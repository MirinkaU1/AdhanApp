// Edge Function : revenuecat-webhook
//
// Reçoit les notifications RevenueCat lors d'un achat et met à jour
// le flag `is_supporter` dans la table profiles via le client service_role.
// Cette fonction est la seule voie légitime pour passer is_supporter à TRUE
// (le client en est empêché par le trigger prevent_privileged_profile_changes).
//
// Authentification : RevenueCat envoie un header Authorization avec un secret
// partagé qu'on définit dans le dashboard RC ET dans les secrets Supabase :
//   supabase secrets set REVENUECAT_WEBHOOK_SECRET=<une-longue-chaine-aléatoire>
//
// Déploiement (sans vérification du JWT Supabase, RC n'en envoie pas) :
//   supabase functions deploy revenuecat-webhook --no-verify-jwt
//
// Documentation événements RC :
//   https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Events qui octroient le statut supporter
const PURCHASE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "NON_RENEWING_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
]);

// Events qui révoquent le statut (refund / chargeback)
const REVOKE_EVENTS = new Set([
  "CANCELLATION", // peut signifier un refund selon cancel_reason
  "EXPIRATION",
]);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 1. Vérifier le secret partagé envoyé par RevenueCat
  const expectedSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!expectedSecret) {
    console.error("[revenuecat-webhook] REVENUECAT_WEBHOOK_SECRET not set");
    return new Response("Server misconfigured", { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const providedSecret = authHeader.replace(/^Bearer\s+/i, "");
  if (providedSecret !== expectedSecret) {
    console.warn("[revenuecat-webhook] Invalid secret");
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parser le body
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = payload?.event;
  if (!event || typeof event.type !== "string") {
    return new Response("Missing event.type", { status: 400 });
  }

  // app_user_id = ce qu'on a passé à Purchases.logIn() côté client
  // = l'UUID Supabase de l'utilisateur
  const userId: string | undefined = event.app_user_id;
  if (!userId) {
    console.warn("[revenuecat-webhook] Missing app_user_id, event:", event.type);
    // On répond 200 pour que RC ne re-essaie pas (achats anonymes ignorés)
    return new Response("OK (no user)", { status: 200 });
  }

  // Validation grossière du format UUID (au cas où le user serait
  // un anonyme RC `$RCAnonymousID:...`, on ignore proprement)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(userId);
  if (!isUuid) {
    console.log("[revenuecat-webhook] Skipping non-Supabase user:", userId);
    return new Response("OK (anonymous)", { status: 200 });
  }

  // 3. Client service_role (bypass RLS + bypass trigger profile)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    if (PURCHASE_EVENTS.has(event.type)) {
      // Marquer supporter
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_supporter: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        console.error("[revenuecat-webhook] profiles update error:", profileError);
        return new Response("DB error", { status: 500 });
      }

      // Historiser dans donations (idempotent via transaction_id)
      const transactionId: string | null =
        event.transaction_id ?? event.original_transaction_id ?? null;
      const productId: string | null = event.product_id ?? null;
      const priceCents: number = Math.round(
        Number(event.price_in_purchased_currency ?? 0) * 100,
      );
      const currency: string = event.currency ?? "USD";

      // tier_id : on dérive du product_id (donation_tier_1 → bronze, etc.)
      let tierId = "unknown";
      if (productId?.includes("tier_1")) tierId = "bronze";
      else if (productId?.includes("tier_2")) tierId = "silver";
      else if (productId?.includes("tier_3")) tierId = "gold";

      if (transactionId) {
        // Vérifier si déjà inséré (idempotence — RC peut renvoyer le même event)
        const { data: existing } = await supabase
          .from("donations")
          .select("id")
          .eq("revenuecat_transaction_id", transactionId)
          .maybeSingle();

        if (!existing) {
          const { error: donationError } = await supabase
            .from("donations")
            .insert({
              user_id: userId,
              tier_id: tierId,
              amount_cents: priceCents,
              currency,
              revenuecat_transaction_id: transactionId,
            });

          if (donationError) {
            console.error("[revenuecat-webhook] donation insert error:", donationError);
            // Pas bloquant — le supporter status est déjà mis à jour
          }
        }
      }

      console.log(`[revenuecat-webhook] User ${userId} marked supporter (${event.type})`);
      return new Response("OK", { status: 200 });
    }

    if (REVOKE_EVENTS.has(event.type)) {
      // Révoquer uniquement si refund explicite (cancel_reason === 'CUSTOMER_SUPPORT'
      // ou refunded_at présent). Pour les dons one-shot, l'expiration n'a pas de sens.
      const isRefund =
        event.cancel_reason === "CUSTOMER_SUPPORT" ||
        event.cancel_reason === "REFUND" ||
        Boolean(event.refunded_at);

      if (isRefund) {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_supporter: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("[revenuecat-webhook] revoke error:", error);
          return new Response("DB error", { status: 500 });
        }
        console.log(`[revenuecat-webhook] Revoked supporter for ${userId}`);
      }
      return new Response("OK", { status: 200 });
    }

    // Event non géré : on accepte pour éviter les retries RC
    console.log(`[revenuecat-webhook] Ignored event type: ${event.type}`);
    return new Response("OK (ignored)", { status: 200 });
  } catch (err) {
    console.error("[revenuecat-webhook] Unexpected error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
