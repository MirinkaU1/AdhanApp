import { supabase } from "@/lib/supabase";

// URL de base des Edge Functions — lue depuis les variables d'env Expo
// (même source que celle utilisée pour initialiser le client Supabase).
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export type CoinAwardReason =
  | "quest_first_prayer_today"
  | "quest_pray_fajr"
  | "quest_pray_all_5"
  | "quest_pray_on_time"
  | "quest_complete_streak_3"
  | "quest_complete_streak_7"
  | "level_up";

export interface ThemeInventory {
  coins: number;
  activeThemeId: string;
  unlockedThemeIds: string[];
}

interface PurchaseThemeResult {
  success: boolean;
  newBalance: number;
  activeThemeId: string;
  unlockedThemeIds: string[];
  errorCode: string | null;
}

const toArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const parseInventory = (row: any): ThemeInventory => ({
  coins: Number(row?.coins ?? 0),
  activeThemeId: String(row?.active_theme_id ?? "default"),
  unlockedThemeIds: toArray<string>(row?.unlocked_theme_ids).map(String),
});

export const fetchThemeInventory = async (
  userId?: string,
): Promise<ThemeInventory | null> => {
  const { data, error } = await supabase.rpc("get_user_theme_inventory", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[themeEconomy] fetchThemeInventory error:", error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return null;
  }

  return parseInventory(row);
};

export const purchaseThemeServer = async (
  themeId: string,
  userId?: string,
  referenceKey?: string,
): Promise<PurchaseThemeResult | null> => {
  const { data, error } = await supabase.rpc("purchase_theme", {
    p_theme_id: themeId,
    p_user_id: userId,
    p_reference_key: referenceKey ?? null,
  });

  if (error) {
    console.error("[themeEconomy] purchaseThemeServer error:", error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return null;
  }

  return {
    success: Boolean(row.success),
    newBalance: Number(row.new_balance ?? 0),
    activeThemeId: String(row.active_theme_id ?? "default"),
    unlockedThemeIds: toArray<string>(row.unlocked_theme_ids).map(String),
    errorCode: row.error_code ? String(row.error_code) : null,
  };
};

export const setActiveThemeServer = async (
  themeId: string,
  userId?: string,
): Promise<boolean> => {
  const { data, error } = await supabase.rpc("set_active_theme", {
    p_theme_id: themeId,
    p_user_id: userId,
  });

  if (error) {
    console.error("[themeEconomy] setActiveThemeServer error:", error);
    return false;
  }

  return Boolean(data);
};

export const awardCoinsServer = async (
  reason: CoinAwardReason,
  referenceKey: string,
  // userId n'est plus utilisé : l'identité est vérifiée côté Edge Function
  // via le JWT. Le paramètre est conservé pour la compatibilité des appelants.
  _userId?: string,
): Promise<number | null> => {
  // Récupérer le token JWT de la session courante.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    console.error("[themeEconomy] awardCoinsServer: no active session");
    return null;
  }

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/award-coins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Le JWT authentifie l'utilisateur côté Edge Function.
        Authorization: `Bearer ${token}`,
        // La clé anon est requise par le gateway Supabase pour router la requête.
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ reason, reference_key: referenceKey }),
    });
  } catch (err) {
    console.error("[themeEconomy] awardCoinsServer fetch error:", err);
    return null;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[themeEconomy] awardCoinsServer HTTP ${res.status}:`,
      body,
    );
    return null;
  }

  const json = await res.json().catch(() => null);
  return json?.balance != null ? Number(json.balance) : null;
};

export const grantCoinsServer = async (
  amount: number,
  reason: string,
  referenceKey?: string,
  // targetUserId n'est plus accepté par l'Edge Function pour éviter l'escalade
  // de privilèges : l'identité est toujours celle du JWT. Le paramètre est
  // conservé pour la compatibilité des appelants mais ignoré côté serveur.
  _targetUserId?: string,
): Promise<number | null> => {
  // Récupérer le token JWT de la session courante.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    console.error("[themeEconomy] grantCoinsServer: no active session");
    return null;
  }

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/grant-coins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Le JWT authentifie l'utilisateur côté Edge Function.
        Authorization: `Bearer ${token}`,
        // La clé anon est requise par le gateway Supabase pour router la requête.
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        amount,
        reason,
        reference_key: referenceKey ?? null,
      }),
    });
  } catch (err) {
    console.error("[themeEconomy] grantCoinsServer fetch error:", err);
    return null;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[themeEconomy] grantCoinsServer HTTP ${res.status}:`,
      body,
    );
    return null;
  }

  const json = await res.json().catch(() => null);
  return json?.balance != null ? Number(json.balance) : null;
};
