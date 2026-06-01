// Edge Function : dev-toggle-supporter
//
// Permet aux utilisateurs avec le rôle `dev` ou `tester` de simuler un achat
// de don sans passer par RevenueCat. Met à jour `profiles.is_supporter` via
// service_role (la seule voie autorisée depuis qu'on a posé le trigger
// prevent_privileged_profile_changes) et historise un don avec
// currency='TEST' pour pouvoir le distinguer des vrais dons.
//
// Body attendu :
//   - { tier: 'bronze' | 'silver' | 'gold' }   → grant supporter
//   - { revoke: true }                          → revoke supporter
//
// Déploiement :
//   supabase functions deploy dev-toggle-supporter

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ROLES = new Set(["dev", "tester"]);
const VALID_TIERS = new Set(["bronze", "silver", "gold"]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    // 1. JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser();

    if (authError || !user) {
      return json(401, { error: "Invalid or expired token" });
    }

    // 2. Service role pour bypass RLS + trigger profiles
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // 3. Vérifier le rôle
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("[dev-toggle-supporter] profile lookup error:", profileError);
      return json(500, { error: "Profile lookup failed" });
    }

    if (!ALLOWED_ROLES.has(profile.role)) {
      return json(403, { error: "Forbidden: dev/tester only" });
    }

    // 4. Parse body
    let body: { tier?: unknown; revoke?: unknown };
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 5. Révocation
    if (body.revoke === true) {
      const { error } = await serviceClient
        .from("profiles")
        .update({
          is_supporter: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("[dev-toggle-supporter] revoke error:", error);
        return json(500, { error: "DB error on revoke" });
      }
      return json(200, { is_supporter: false });
    }

    // 6. Grant
    const tier =
      typeof body.tier === "string" && VALID_TIERS.has(body.tier)
        ? body.tier
        : "bronze";

    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({
        is_supporter: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[dev-toggle-supporter] update error:", updateError);
      return json(500, { error: "DB error on grant" });
    }

    // Faux don pour traçabilité (currency=TEST permet de filtrer)
    const fakeTransactionId = `dev-test-${user.id}-${Date.now()}`;
    const { error: donationError } = await serviceClient
      .from("donations")
      .insert({
        user_id: user.id,
        tier_id: tier,
        amount_cents: 0,
        currency: "TEST",
        revenuecat_transaction_id: fakeTransactionId,
      });

    if (donationError) {
      console.warn(
        "[dev-toggle-supporter] donation insert warning:",
        donationError,
      );
      // Pas bloquant : le supporter status est déjà mis
    }

    return json(200, { is_supporter: true, tier });
  } catch (err) {
    console.error("[dev-toggle-supporter] unexpected error:", err);
    return json(500, { error: "Internal error" });
  }
});
