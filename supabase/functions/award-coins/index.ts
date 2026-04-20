// Edge Function : award-coins
// Sécurise l'attribution de coins suite à un événement de quête ou de niveau.
// Le RPC `award_coins` est appelé avec le client service_role pour contourner
// les politiques RLS tout en garantissant que l'identité de l'utilisateur
// est vérifiée côté serveur (le p_user_id du body est ignoré).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Raisons valides — doit rester synchronisé avec le type CoinAwardReason
// dans lib/themeEconomy.ts côté client.
// ---------------------------------------------------------------------------
const VALID_REASONS = new Set([
  "quest_first_prayer_today",
  "quest_pray_fajr",
  "quest_pray_all_5",
  "quest_pray_on_time",
  "quest_complete_streak_3",
  "quest_complete_streak_7",
  "level_up",
]);

// ---------------------------------------------------------------------------
// Headers CORS — nécessaires pour les appels depuis l'app React Native (web)
// et pour répondre aux pre-flight OPTIONS.
// ---------------------------------------------------------------------------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
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

    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
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
    // 4. Parser et valider le body de la requête.
    // -----------------------------------------------------------------------
    let body: { reason?: unknown; reference_key?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const { reason, reference_key } = body;

    // Valider reason
    if (typeof reason !== "string" || !VALID_REASONS.has(reason)) {
      return new Response(
        JSON.stringify({
          error: "Invalid reason",
          valid_reasons: Array.from(VALID_REASONS),
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Valider reference_key : string non-vide, < 200 chars
    if (
      typeof reference_key !== "string" ||
      reference_key.trim().length === 0 ||
      reference_key.length >= 200
    ) {
      return new Response(
        JSON.stringify({ error: "reference_key must be a non-empty string under 200 characters" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // -----------------------------------------------------------------------
    // 5. Appeler le RPC award_coins avec le client service_role.
    //    On utilise user.id issu du JWT — jamais le p_user_id du body.
    // -----------------------------------------------------------------------
    const { data, error: rpcError } = await serviceClient.rpc("award_coins", {
      p_user_id: user.id,
      p_reason: reason,
      p_reference_key: reference_key,
    });

    if (rpcError) {
      console.error("[award-coins] RPC error:", rpcError);
      return new Response(
        JSON.stringify({ error: rpcError.message ?? "RPC error" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // -----------------------------------------------------------------------
    // 6. Retourner le nouveau solde.
    // -----------------------------------------------------------------------
    const balance = Number(data ?? 0);
    return new Response(
      JSON.stringify({ balance }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("[award-coins] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
