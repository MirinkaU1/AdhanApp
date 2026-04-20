// Edge Function : grant-coins
// Permet aux utilisateurs avec le rôle `dev` ou `tester` d'attribuer
// manuellement des coins. La vérification du rôle se fait côté serveur
// via le client service_role (contourne le RLS uniquement pour cette lecture).
// Le RPC `grant_coins` est ensuite appelé avec service_role.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Rôles autorisés à utiliser cette fonction.
// ---------------------------------------------------------------------------
const ALLOWED_ROLES = new Set(["dev", "tester"]);

// ---------------------------------------------------------------------------
// Montant maximum accordé en un seul appel pour limiter les abus.
// ---------------------------------------------------------------------------
const MAX_AMOUNT = 1000;

// ---------------------------------------------------------------------------
// Headers CORS — nécessaires pour les appels depuis l'app React Native (web)
// et pour répondre aux pre-flight OPTIONS.
// ---------------------------------------------------------------------------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // -------------------------------------------------------------------------
  // Répondre aux pre-flight CORS sans traitement supplémentaire.
  // -------------------------------------------------------------------------
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // -----------------------------------------------------------------------
    // 1. Vérifier la présence du header Authorization.
    // -----------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // -----------------------------------------------------------------------
    // 2. Vérifier le JWT via le client anon avec le JWT dans les headers.
    //    Cette approche supporte HS256 ET ES256 (projets Supabase récents)
    //    car la validation est déléguée au serveur Supabase Auth — contrairement
    //    à serviceClient.auth.getUser(token) qui valide en local (HS256 only).
    // -----------------------------------------------------------------------
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
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------------------------------
    // 3. Créer un client service_role pour les opérations RPC privilégiées.
    //    Ce client bypasse le RLS — ne jamais l'exposer côté client.
    // -----------------------------------------------------------------------
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // -----------------------------------------------------------------------
    // 4. Vérifier que l'utilisateur possède le rôle `dev` ou `tester`.
    //    La table `profiles` est lue avec service_role pour ignorer le RLS.
    // -----------------------------------------------------------------------
    const { data: profileData, error: profileError } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      console.error("[grant-coins] Profile lookup error:", profileError);
      return new Response(
        JSON.stringify({ error: "Could not retrieve user profile" }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    if (!ALLOWED_ROLES.has(profileData.role)) {
      return new Response(
        JSON.stringify({ error: "Forbidden: insufficient role" }),
        {
          status: 403,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------------------------------
    // 5. Parser et valider le body de la requête.
    // -----------------------------------------------------------------------
    let body: { amount?: unknown; reason?: unknown; reference_key?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { amount, reason, reference_key } = body;

    // Valider amount : entier positif ≤ MAX_AMOUNT
    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount <= 0 ||
      amount > MAX_AMOUNT
    ) {
      return new Response(
        JSON.stringify({
          error: `amount must be a positive integer ≤ ${MAX_AMOUNT}`,
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Valider reason : string non-vide
    if (typeof reason !== "string" || reason.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "reason must be a non-empty string" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // reference_key est optionnel — si fourni, doit être une string
    const resolvedReferenceKey: string | null =
      typeof reference_key === "string" ? reference_key : null;

    // -----------------------------------------------------------------------
    // 6. Appeler le RPC grant_coins avec le client service_role.
    //    On utilise user.id issu du JWT comme target par défaut.
    //    Le body ne contient pas de target_user_id pour éviter l'escalade.
    // -----------------------------------------------------------------------
    const { data, error: rpcError } = await serviceClient.rpc("grant_coins", {
      p_amount: amount,
      p_reason: reason,
      p_reference_key: resolvedReferenceKey,
      p_target_user_id: user.id,
    });

    if (rpcError) {
      console.error("[grant-coins] RPC error:", rpcError);
      return new Response(
        JSON.stringify({ error: rpcError.message ?? "RPC error" }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------------------------------
    // 7. Retourner le nouveau solde.
    // -----------------------------------------------------------------------
    const balance = Number(data ?? 0);
    return new Response(JSON.stringify({ balance }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[grant-coins] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
