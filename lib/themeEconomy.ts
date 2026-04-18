import { supabase } from "@/lib/supabase";

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
  userId?: string,
): Promise<number | null> => {
  const { data, error } = await supabase.rpc("award_coins", {
    p_reason: reason,
    p_reference_key: referenceKey,
    p_user_id: userId,
  });

  if (error) {
    console.error("[themeEconomy] awardCoinsServer error:", error);
    return null;
  }

  return Number(data ?? 0);
};

export const grantCoinsServer = async (
  amount: number,
  reason: string,
  referenceKey?: string,
  targetUserId?: string,
): Promise<number | null> => {
  const { data, error } = await supabase.rpc("grant_coins", {
    p_amount: amount,
    p_reason: reason,
    p_reference_key: referenceKey ?? null,
    p_target_user_id: targetUserId ?? null,
  });

  if (error) {
    console.error("[themeEconomy] grantCoinsServer error:", error);
    return null;
  }

  return Number(data ?? 0);
};
