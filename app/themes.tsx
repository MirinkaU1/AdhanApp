/**
 * Boutique de thèmes — accessible via le badge pièces sur l'accueil
 */
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import type { MaterialIconName } from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AlertDialog } from "@/components/ui";
import useThemeStore from "@/stores/useThemeStore";
import useCoinsStore from "@/stores/useCoinsStore";
import useQuestStore from "@/stores/useQuestStore";
import useAuthStore from "@/stores/useAuthStore";
import useRamadanStore from "@/stores/useRamadanStore";
import { APP_THEMES, type AppTheme } from "@/constants/appThemes";
import { ThemePattern } from "@/components/ThemePattern";
import { PRESET_AVATARS, type PresetAvatar } from "@/lib/avatarService";
import useAvatarStore from "@/stores/useAvatarStore";

type ShopCategory = "all" | "themes" | "avatars" | "qiblaSkins" | "others";

function withAlpha(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return hex;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─────────────────────────────────────────────
// Carte avatar boutique (2 colonnes)
// ─────────────────────────────────────────────

function ShopAvatarCard({
  avatar,
  isOwned,
  onPurchase,
  cardWidth,
}: {
  avatar: PresetAvatar;
  isOwned: boolean;
  onPurchase: () => void;
  cardWidth: number;
}) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { level } = useQuestStore();
  const { coins } = useCoinsStore();

  const isLevelLocked =
    avatar.unlock.type === "level" &&
    level < (avatar.unlock as { type: "level"; level: number }).level;
  const price =
    avatar.unlock.type === "coins"
      ? (avatar.unlock as { type: "coins"; price: number }).price
      : null;

  const canAfford = price !== null && coins >= price;

  return (
    <Pressable
      onPress={!isOwned && !isLevelLocked ? onPurchase : undefined}
      style={{ width: cardWidth }}
      className="rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
    >
      {/* Image de l'avatar */}
      <View className="items-center pt-5 pb-3">
        <View
          className="w-20 h-20 rounded-full overflow-hidden border-2"
          style={{ borderColor: isOwned ? "#0F766E" : "#CBD5E1" }}
        >
          <Image
            source={avatar.source}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          {!isOwned && (
            <View
              className="absolute inset-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
            >
              <MaterialIconsRound name="lock" size={20} color="#FFFFFF" />
            </View>
          )}
        </View>
      </View>

      {/* Infos */}
      <View className="px-3 pb-4 items-center gap-2">
        {isOwned ? (
          <View
            className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: isDark ? "rgba(20,83,45,0.35)" : "#DCFCE7",
            }}
          >
            <MaterialIconsRound name="check-circle" size={13} color="#22C55E" />
            <Text
              className="font-outfit-bold text-xs"
              style={{ color: isDark ? "#86EFAC" : "#15803D" }}
            >
              {t("themes.obtained", "Obtenu")}
            </Text>
          </View>
        ) : isLevelLocked ? (
          <View
            className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: isDark ? "rgba(99,102,241,0.18)" : "#EEF2FF",
            }}
          >
            <MaterialIconsRound
              name="military-tech"
              size={13}
              color="#818CF8"
            />
            <Text
              className="font-outfit-bold text-xs"
              style={{ color: isDark ? "#A5B4FC" : "#4338CA" }}
            >
              {t("themes.unlockLevelShort", {
                level: (avatar.unlock as { type: "level"; level: number })
                  .level,
              })}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={onPurchase}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: canAfford
                ? isDark
                  ? "rgba(217,119,6,0.22)"
                  : "#FEF3C7"
                : isDark
                  ? "rgba(100,116,139,0.22)"
                  : "#F1F5F9",
            }}
          >
            <MaterialIconsRound
              name="toll"
              size={13}
              color={canAfford ? "#D97706" : "#94A3B8"}
            />
            <Text
              className="font-outfit-bold text-xs"
              style={{ color: canAfford ? "#D97706" : "#94A3B8" }}
            >
              {price}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Grille d'avatars (2 colonnes)
// ─────────────────────────────────────────────

function AvatarGrid({
  avatars,
  isAvatarOwned,
  onPurchase,
  cardWidth,
  gap,
}: {
  avatars: PresetAvatar[];
  isAvatarOwned: (id: string) => boolean;
  onPurchase: (avatar: PresetAvatar) => void;
  cardWidth: number;
  gap: number;
}) {
  const rows: PresetAvatar[][] = [];
  for (let i = 0; i < avatars.length; i += 2) {
    rows.push(avatars.slice(i, i + 2));
  }
  return (
    <View style={{ gap }}>
      {rows.map((row, ri) => (
        <View key={ri} className="flex-row" style={{ gap }}>
          {row.map((avatar) => (
            <ShopAvatarCard
              key={avatar.id}
              avatar={avatar}
              isOwned={isAvatarOwned(avatar.id)}
              onPurchase={() => onPurchase(avatar)}
              cardWidth={cardWidth}
            />
          ))}
          {/* Remplissage si nombre impair */}
          {row.length === 1 && <View style={{ width: cardWidth }} />}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────
// Carte thème boutique (2 colonnes)
// ─────────────────────────────────────────────

function ShopThemeCard({
  theme,
  isOwned,
  isEventActive,
  onPurchase,
  cardWidth,
}: {
  theme: AppTheme;
  isOwned: boolean;
  isEventActive: boolean;
  onPurchase: () => void;
  cardWidth: number;
}) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { level } = useQuestStore();
  const { coins } = useCoinsStore();

  const isLevelLocked =
    theme.unlock.type === "level" && !isOwned && level < theme.unlock.level;
  const isEvent = theme.unlock.type === "event";
  const isEventLocked = isEvent && !isOwned && !isEventActive;
  const canAfford =
    theme.unlock.type === "coins" ? coins >= theme.unlock.price : false;
  const isLocked = isLevelLocked || isEventLocked;

  return (
    <View
      style={{
        width: cardWidth,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isDark ? "#334155" : "#E2E8F0",
        opacity: isLocked ? 0.65 : 1,
      }}
    >
      {/* Preview gradient */}
      <LinearGradient
        colors={theme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 90, padding: 12, justifyContent: "space-between" }}
      >
        {/* Motif de fond */}
        {theme.pattern && (
          <ThemePattern pattern={theme.pattern} width={cardWidth} height={90} />
        )}
        {/* Pastilles */}
        <View className="flex-row gap-1.5">
          {theme.preview.map((color, i) => (
            <View
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: color,
                borderWidth: 1.5,
                borderColor: "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </View>

        {/* Badge verrou ou évènement */}
        {isLocked && (
          <View
            className="flex-row items-center gap-1 self-start px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <MaterialIconsRound
              name="lock"
              size={10}
              color="rgba(255,255,255,0.9)"
            />
            <Text
              className="font-outfit-medium"
              style={{ fontSize: 10, color: "rgba(255,255,255,0.9)" }}
            >
              {isEvent
                ? t("themes.event")
                : t("themes.unlockLevelShort", {
                    level: (theme.unlock as { type: "level"; level: number })
                      .level,
                  })}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Infos + bouton achat */}
      <View
        className="p-2.5"
        style={{ backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }}
      >
        <Text
          className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark"
          style={{ fontSize: 12 }}
          numberOfLines={1}
        >
          {t(theme.nameKey)}
        </Text>
        <Text
          className="font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark mt-0.5"
          style={{ fontSize: 10 }}
          numberOfLines={1}
        >
          {isOwned
            ? t(theme.descriptionKey)
            : isLevelLocked
              ? t("themes.unlockLevel", {
                  level: (theme.unlock as { type: "level"; level: number })
                    .level,
                })
              : isEvent
                ? t("themes.eventDesc")
                : t(theme.descriptionKey)}
        </Text>

        {/* Bouton achat ou verrou */}
        {theme.unlock.type === "coins" && !isLocked ? (
          isOwned ? (
            <View
              className="mt-2 rounded-xl py-1.5 flex-row items-center justify-center gap-1"
              style={{
                backgroundColor: isDark ? "rgba(34,197,94,0.18)" : "#DCFCE7",
                borderWidth: 1,
                borderColor: isDark ? "rgba(34,197,94,0.35)" : "#86EFAC",
              }}
            >
              <MaterialIconsRound
                name="check-circle"
                size={12}
                color="#16A34A"
              />
              <Text
                className="font-outfit-bold"
                style={{ fontSize: 11, color: "#16A34A" }}
              >
                {t("themes.obtained")}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={onPurchase}
              className="mt-2 rounded-xl py-1.5 flex-row items-center justify-center gap-1 active:opacity-80"
              style={{
                backgroundColor: canAfford
                  ? isDark
                    ? "rgba(217,119,6,0.2)"
                    : "#FEF3C7"
                  : isDark
                    ? "#1E293B"
                    : "#F8FAFC",
                borderWidth: 1,
                borderColor: canAfford
                  ? isDark
                    ? "rgba(217,119,6,0.4)"
                    : "#FDE68A"
                  : isDark
                    ? "#334155"
                    : "#E2E8F0",
              }}
            >
              <MaterialIconsRound
                name="toll"
                size={13}
                color={canAfford ? "#D97706" : "#94A3B8"}
              />
              <Text
                className="font-outfit-bold"
                style={{
                  fontSize: 11,
                  color: canAfford ? "#D97706" : "#94A3B8",
                }}
              >
                {theme.unlock.price}
              </Text>
            </Pressable>
          )
        ) : isOwned ? (
          <View
            className="mt-2 rounded-xl py-1.5 flex-row items-center justify-center gap-1"
            style={{
              backgroundColor: isDark ? "rgba(34,197,94,0.18)" : "#DCFCE7",
              borderWidth: 1,
              borderColor: isDark ? "rgba(34,197,94,0.35)" : "#86EFAC",
            }}
          >
            <MaterialIconsRound name="check-circle" size={12} color="#16A34A" />
            <Text
              className="font-outfit-bold"
              style={{ fontSize: 11, color: "#16A34A" }}
            >
              {t("themes.obtained")}
            </Text>
          </View>
        ) : (
          <View
            className="mt-2 rounded-xl py-1.5 flex-row items-center justify-center gap-1"
            style={{ backgroundColor: isDark ? "#0F172A" : "#F1F5F9" }}
          >
            <MaterialIconsRound name="lock" size={12} color="#94A3B8" />
            <Text
              className="font-outfit-medium"
              style={{ fontSize: 11, color: "#94A3B8" }}
            >
              {isEvent
                ? t("themes.event")
                : `Niv. ${(theme.unlock as { type: "level"; level: number }).level}`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Écran boutique
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Grille 2 colonnes helper
// ─────────────────────────────────────────────

function ThemeGrid({
  themes,
  isThemeOwned,
  isEventActive,
  onPurchase,
  cardWidth,
  gap,
}: {
  themes: AppTheme[];
  isThemeOwned: (themeId: string) => boolean;
  isEventActive: (theme: AppTheme) => boolean;
  onPurchase: (theme: AppTheme) => void;
  cardWidth: number;
  gap: number;
}) {
  const pairs: AppTheme[][] = [];
  for (let i = 0; i < themes.length; i += 2) {
    pairs.push(themes.slice(i, i + 2));
  }

  return (
    <>
      {pairs.map((pair, rowIndex) => (
        <View key={rowIndex} className="flex-row mb-3" style={{ gap }}>
          {pair.map((theme) => (
            <ShopThemeCard
              key={theme.id}
              theme={theme}
              isOwned={isThemeOwned(theme.id)}
              isEventActive={isEventActive(theme)}
              onPurchase={() => onPurchase(theme)}
              cardWidth={cardWidth}
            />
          ))}
          {pair.length === 1 && <View style={{ width: cardWidth }} />}
        </View>
      ))}
    </>
  );
}

function ComingSoonSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useTranslation();
  const isDark = useIsDark();

  return (
    <View
      className="rounded-2xl p-4"
      style={{
        backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
        borderWidth: 1,
        borderColor: isDark ? "#334155" : "#E2E8F0",
      }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <MaterialIconsRound name="schedule" size={18} color="#F59E0B" />
        <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base">
          {title}
        </Text>
      </View>
      <Text className="font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark text-sm">
        {description}
      </Text>
      <View
        className="self-start mt-3 px-2.5 py-1 rounded-full"
        style={{
          backgroundColor: isDark ? "rgba(245,158,11,0.2)" : "#FEF3C7",
          borderWidth: 1,
          borderColor: isDark ? "rgba(245,158,11,0.35)" : "#FCD34D",
        }}
      >
        <Text
          className="font-outfit-bold"
          style={{ color: "#D97706", fontSize: 11 }}
        >
          {t("themes.comingSoonBadge")}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Écran boutique
// ─────────────────────────────────────────────

export default function ThemesShopScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const { coins } = useCoinsStore();
  const { isThemeUnlocked, purchaseTheme, setActiveTheme } = useThemeStore();
  const { isRamadanMode } = useRamadanStore();
  const { isAvatarUnlocked, purchaseAvatar } = useAvatarStore();

  const GRID_PADDING = 16;
  const GRID_GAP = 10;
  const cardWidth = (width - GRID_PADDING * 2 - GRID_GAP) / 2;

  // Modals thèmes
  const [confirmTheme, setConfirmTheme] = useState<AppTheme | null>(null);
  const [purchasedTheme, setPurchasedTheme] = useState<AppTheme | null>(null);
  const [showNoCoins, setShowNoCoins] = useState<{ need: number } | null>(null);
  // Modals avatars
  const [confirmAvatar, setConfirmAvatar] = useState<PresetAvatar | null>(null);
  const [showNoCoinsAvatar, setShowNoCoinsAvatar] = useState<{
    need: number;
  } | null>(null);

  const [activeCategory, setActiveCategory] = useState<ShopCategory>("all");

  const shopThemes = APP_THEMES.filter(
    (theme) => theme.unlock.type !== "level",
  );
  const lockedShopThemes = shopThemes.filter((th) => !isThemeUnlocked(th.id));

  const handlePurchase = (theme: AppTheme) => {
    if (theme.unlock.type !== "coins") return;
    if (isThemeUnlocked(theme.id)) return;
    const price = theme.unlock.price;

    if (coins < price) {
      setShowNoCoins({ need: price - coins });
      return;
    }

    setConfirmTheme(theme);
  };

  const handleConfirmPurchase = async () => {
    if (!confirmTheme || confirmTheme.unlock.type !== "coins") return;
    const success = await purchaseTheme(
      confirmTheme.id,
      confirmTheme.unlock.price,
      user?.id,
    );
    const bought = confirmTheme;
    setConfirmTheme(null);
    if (success) setPurchasedTheme(bought);
  };

  const handleApplyPurchased = async () => {
    if (!purchasedTheme) return;
    await setActiveTheme(purchasedTheme.id, user?.id);
    setPurchasedTheme(null);
  };

  const handleAvatarPurchase = (avatar: PresetAvatar) => {
    if (avatar.unlock.type !== "coins") return;
    if (isAvatarUnlocked(avatar.id)) return;
    const price = (avatar.unlock as { type: "coins"; price: number }).price;

    if (coins < price) {
      setShowNoCoinsAvatar({ need: price - coins });
      return;
    }
    setConfirmAvatar(avatar);
  };

  const handleConfirmAvatarPurchase = () => {
    if (!confirmAvatar || confirmAvatar.unlock.type !== "coins") return;
    const price = (confirmAvatar.unlock as { type: "coins"; price: number })
      .price;
    purchaseAvatar(confirmAvatar.id, price);
    setConfirmAvatar(null);
  };

  const byCoins = shopThemes.filter((t) => t.unlock.type === "coins");
  const byEvent = shopThemes.filter((t) => t.unlock.type === "event");
  const shopAvatars = PRESET_AVATARS.filter(
    (avatar) => avatar.unlock.type !== "level",
  );
  const isThemeEventActive = (theme: AppTheme) =>
    theme.unlock.type === "event" && theme.unlock.eventId === "ramadan"
      ? isRamadanMode
      : false;

  const categories: Array<{
    key: ShopCategory;
    label: string;
    icon: MaterialIconName;
  }> = [
    { key: "all", label: t("themes.categoryAll"), icon: "apps" },
    { key: "themes", label: t("themes.categoryThemes"), icon: "palette" },
    { key: "avatars", label: t("themes.categoryAvatars"), icon: "face" },
    {
      key: "qiblaSkins",
      label: t("themes.categoryQiblaSkins"),
      icon: "explore",
    },
    { key: "others", label: t("themes.categoryOthers"), icon: "widgets" },
  ];

  const comingSoonDescriptionByCategory: Record<
    Exclude<ShopCategory, "themes" | "all" | "avatars">,
    string
  > = {
    qiblaSkins: t("themes.comingSoonQiblaSkins"),
    others: t("themes.comingSoonOthers"),
  };

  const shouldShowThemes =
    activeCategory === "themes" || activeCategory === "all";
  const shouldShowAvatars =
    activeCategory === "avatars" || activeCategory === "all";
  const activeTabBackground = withAlpha(appTheme.primary, isDark ? 0.24 : 0.12);
  const activeTabBorder = withAlpha(appTheme.primary, isDark ? 0.48 : 0.3);
  const activeTabText = isDark ? appTheme.accent : appTheme.primary;

  const comingSoonCategories: Array<
    Exclude<ShopCategory, "themes" | "all" | "avatars">
  > =
    activeCategory === "all"
      ? ["qiblaSkins", "others"]
      : activeCategory === "qiblaSkins" || activeCategory === "others"
        ? [activeCategory]
        : [];

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <LinearGradient
        colors={appTheme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: 48,
          paddingBottom: 24,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-white font-outfit-bold"
              style={{ fontSize: 24 }}
            >
              {t("themes.shopTitle")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("themes.shopSubtitle")}
            </Text>
          </View>
          {/* Solde pièces */}
          <View
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(217,119,6,0.25)",
              borderWidth: 1,
              borderColor: "rgba(217,119,6,0.4)",
            }}
          >
            <MaterialIconsRound name="toll" size={16} color="#FCD34D" />
            <Text className="font-outfit-bold text-white text-sm">{coins}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          <View className="flex-row" style={{ gap: 8 }}>
            {categories.map((category) => {
              const isActive = activeCategory === category.key;
              return (
                <Pressable
                  key={category.key}
                  onPress={() => setActiveCategory(category.key)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: isActive
                      ? activeTabBackground
                      : isDark
                        ? "#0F172A"
                        : "#F8FAFC",
                    borderWidth: 1,
                    borderColor: isActive
                      ? activeTabBorder
                      : isDark
                        ? "#334155"
                        : "#E2E8F0",
                  }}
                >
                  <MaterialIconsRound
                    name={category.icon}
                    size={15}
                    color={isActive ? activeTabText : "#64748B"}
                  />
                  <Text
                    className="font-outfit-medium"
                    style={{
                      fontSize: 12,
                      color: isActive ? activeTabText : "#64748B",
                    }}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {shouldShowThemes && lockedShopThemes.length === 0 && (
          <View className="items-center justify-center py-8">
            <MaterialIconsRound
              name="check-circle"
              size={52}
              color={isDark ? "#334155" : "#CBD5E1"}
            />
            <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-lg mt-4">
              {t("themes.allOwned")}
            </Text>
            <Text className="font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark text-sm mt-2 text-center px-8">
              {t("themes.allOwnedDesc")}
            </Text>
          </View>
        )}

        {shouldShowThemes && byCoins.length > 0 && (
          <>
            <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3">
              {t("themes.available")}
            </Text>
            <ThemeGrid
              themes={byCoins}
              isThemeOwned={isThemeUnlocked}
              isEventActive={isThemeEventActive}
              onPurchase={handlePurchase}
              cardWidth={cardWidth}
              gap={GRID_GAP}
            />
          </>
        )}

        {shouldShowThemes && byEvent.length > 0 && (
          <>
            <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3 mt-2">
              {t("themes.events")}
            </Text>
            <ThemeGrid
              themes={byEvent}
              isThemeOwned={isThemeUnlocked}
              isEventActive={isThemeEventActive}
              onPurchase={() => {}}
              cardWidth={cardWidth}
              gap={GRID_GAP}
            />
          </>
        )}

        {/* ─── Section Avatars ─── */}
        {shouldShowAvatars && (
          <>
            <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3 mt-2">
              {t("themes.categoryAvatars")}
            </Text>
            <AvatarGrid
              avatars={shopAvatars}
              isAvatarOwned={isAvatarUnlocked}
              onPurchase={handleAvatarPurchase}
              cardWidth={cardWidth}
              gap={GRID_GAP}
            />
          </>
        )}

        {comingSoonCategories.map((category) => (
          <View key={category} className="mb-3">
            <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3 mt-2">
              {categories.find((c) => c.key === category)?.label}
            </Text>
            <ComingSoonSection
              title={t("themes.comingSoonTitle")}
              description={comingSoonDescriptionByCategory[category]}
            />
          </View>
        ))}
      </ScrollView>

      {/* Modal confirmation d'achat */}
      <AlertDialog
        visible={confirmTheme !== null}
        title={t("themes.confirmPurchase")}
        message={
          confirmTheme
            ? t("themes.confirmPurchaseDesc", {
                name: t(confirmTheme.nameKey),
                price:
                  confirmTheme.unlock.type === "coins"
                    ? confirmTheme.unlock.price
                    : 0,
              })
            : ""
        }
        icon="toll"
        iconColor="#D97706"
        buttons={[
          {
            text: t("common.cancel"),
            style: "default",
            onPress: () => setConfirmTheme(null),
          },
          {
            text: t("themes.buy"),
            style: "primary",
            onPress: handleConfirmPurchase,
          },
        ]}
        onDismiss={() => setConfirmTheme(null)}
      />

      {/* Modal succès achat — proposer d'appliquer */}
      <AlertDialog
        visible={purchasedTheme !== null}
        title={t("themes.purchaseSuccess")}
        message={
          purchasedTheme
            ? t("themes.purchaseSuccessDesc", {
                name: t(purchasedTheme.nameKey),
              })
            : ""
        }
        icon="palette"
        iconColor="#9333EA"
        buttons={[
          {
            text: t("themes.applyLater"),
            style: "default",
            onPress: () => setPurchasedTheme(null),
          },
          {
            text: t("themes.applyNow"),
            style: "primary",
            onPress: handleApplyPurchased,
          },
        ]}
        onDismiss={() => setPurchasedTheme(null)}
      />

      {/* Modal solde insuffisant (thèmes) */}
      <AlertDialog
        visible={showNoCoins !== null}
        title={t("themes.notEnoughCoins")}
        message={
          showNoCoins
            ? t("themes.notEnoughCoinsDesc", { need: showNoCoins.need })
            : ""
        }
        icon="toll"
        iconColor="#EF4444"
        buttons={[
          {
            text: t("common.ok"),
            style: "default",
            onPress: () => setShowNoCoins(null),
          },
        ]}
        onDismiss={() => setShowNoCoins(null)}
      />

      {/* Modal confirmation achat avatar */}
      <AlertDialog
        visible={confirmAvatar !== null}
        title={t("avatars.confirmPurchase", "Acheter l'avatar")}
        message={
          confirmAvatar && confirmAvatar.unlock.type === "coins"
            ? t("avatars.confirmPurchaseDesc", {
                price: (
                  confirmAvatar.unlock as { type: "coins"; price: number }
                ).price,
                defaultValue: `Acheter cet avatar pour ${(confirmAvatar.unlock as { type: "coins"; price: number }).price} pièces ?`,
              })
            : ""
        }
        icon="face"
        iconColor="#D97706"
        buttons={[
          {
            text: t("common.cancel"),
            style: "default",
            onPress: () => setConfirmAvatar(null),
          },
          {
            text: t("avatars.buy", "Acheter"),
            style: "primary",
            onPress: handleConfirmAvatarPurchase,
          },
        ]}
        onDismiss={() => setConfirmAvatar(null)}
      />

      {/* Modal solde insuffisant (avatars) */}
      <AlertDialog
        visible={showNoCoinsAvatar !== null}
        title={t("themes.notEnoughCoins")}
        message={
          showNoCoinsAvatar
            ? t("themes.notEnoughCoinsDesc", { need: showNoCoinsAvatar.need })
            : ""
        }
        icon="toll"
        iconColor="#EF4444"
        buttons={[
          {
            text: t("common.ok"),
            style: "default",
            onPress: () => setShowNoCoinsAvatar(null),
          },
        ]}
        onDismiss={() => setShowNoCoinsAvatar(null)}
      />
    </View>
  );
}
