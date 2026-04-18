import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import useThemeStore, { ThemeMode } from "@/stores/useThemeStore";
import useCoinsStore from "@/stores/useCoinsStore";
import useAuthStore from "@/stores/useAuthStore";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { APP_THEMES } from "@/constants/appThemes";

// ─────────────────────────────────────────────
// Mode clair / sombre
// ─────────────────────────────────────────────

interface ThemeOption {
  id: ThemeMode;
  nameKey: string;
  descriptionKey: string;
  icon: MaterialIconName;
}

const MODE_OPTIONS: ThemeOption[] = [
  {
    id: "light",
    nameKey: "theme.light",
    descriptionKey: "theme.lightDesc",
    icon: "light-mode",
  },
  {
    id: "dark",
    nameKey: "theme.dark",
    descriptionKey: "theme.darkDesc",
    icon: "dark-mode",
  },
  {
    id: "system",
    nameKey: "theme.system",
    descriptionKey: "theme.systemDesc",
    icon: "settings-suggest",
  },
];

// ─────────────────────────────────────────────
// Aperçu du thème actif
// ─────────────────────────────────────────────

function ActiveThemePreview({ themeId }: { themeId: string }) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const theme = APP_THEMES.find((th) => th.id === themeId);
  if (!theme) return null;

  return (
    <View
      className="rounded-3xl overflow-hidden mb-6"
      style={{
        borderWidth: 2,
        borderColor: theme.accent,
      }}
    >
      <LinearGradient
        colors={theme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 120, padding: 16, justifyContent: "space-between" }}
      >
        {/* Pastilles couleur */}
        <View className="flex-row gap-2.5">
          {theme.preview.map((color, i) => (
            <View
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: color,
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </View>

        {/* Badge actif */}
        <View
          className="flex-row items-center gap-1.5 self-start px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <MaterialIconsRound name="check-circle" size={14} color="#fff" />
          <Text className="font-outfit-bold text-white text-xs">
            {t("themes.active")}
          </Text>
        </View>
      </LinearGradient>

      <View
        className="px-4 py-3 flex-row items-center justify-between"
        style={{ backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }}
      >
        <View>
          <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base">
            {t(theme.nameKey)}
          </Text>
          <Text className="font-outfit-regular text-xs mt-0.5 text-text-secondary-light dark:text-text-secondary-dark">
            {t(theme.descriptionKey)}
          </Text>
        </View>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${theme.accent}20` }}
        >
          <MaterialIconsRound name="palette" size={20} color={theme.accent} />
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Carte collection (2 colonnes)
// ─────────────────────────────────────────────

function CollectionCard({
  themeId,
  isActive,
  onSelect,
  cardWidth,
}: {
  themeId: string;
  isActive: boolean;
  onSelect: () => void;
  cardWidth: number;
}) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const theme = APP_THEMES.find((th) => th.id === themeId);
  if (!theme) return null;

  return (
    <Pressable
      onPress={onSelect}
      className="active:opacity-80"
      style={{
        width: cardWidth,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: isActive ? 2 : 1,
        borderColor: isActive ? theme.accent : isDark ? "#334155" : "#E2E8F0",
      }}
    >
      {/* Preview gradient */}
      <LinearGradient
        colors={theme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 90, padding: 12, justifyContent: "space-between" }}
      >
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

        {/* Badge actif */}
        {isActive && (
          <View
            className="flex-row items-center gap-1 self-start px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          >
            <MaterialIconsRound name="check" size={10} color="#fff" />
            <Text
              className="font-outfit-bold text-white"
              style={{ fontSize: 10 }}
            >
              {t("themes.active")}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Nom + bouton */}
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
        <View
          className="mt-1.5 rounded-lg py-1 items-center"
          style={{
            backgroundColor: isActive
              ? isDark
                ? "rgba(217,119,6,0.2)"
                : "#FEF3C7"
              : isDark
                ? "#334155"
                : "#F1F5F9",
          }}
        >
          <Text
            className="font-outfit-bold"
            style={{
              fontSize: 11,
              color: isActive ? "#D97706" : isDark ? "#94A3B8" : "#475569",
            }}
          >
            {isActive ? t("themes.applied") : t("themes.apply")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Écran principal
// ─────────────────────────────────────────────

export default function ThemeScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const {
    mode: themeMode,
    setMode,
    activeThemeId,
    setActiveTheme,
    isThemeUnlocked,
  } = useThemeStore();
  const { coins } = useCoinsStore();

  const ownedThemes = APP_THEMES.filter((th) => isThemeUnlocked(th.id));

  // Taille des cartes pour la grille 2 colonnes
  const GRID_PADDING = 16;
  const GRID_GAP = 10;
  const cardWidth = (width - GRID_PADDING * 2 - GRID_GAP) / 2;

  // Construire les paires pour la grille
  const themePairs: (typeof ownedThemes)[] = [];
  for (let i = 0; i < ownedThemes.length; i += 2) {
    themePairs.push(ownedThemes.slice(i, i + 2));
  }

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
              {t("theme.title")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("theme.subtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.2)" }}
          >
            <MaterialIconsRound name="palette" size={26} color="#F59E0B" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingVertical: 24,
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Aperçu thème actif ── */}
        <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3">
          {t("theme.activeTheme")}
        </Text>
        <ActiveThemePreview themeId={activeThemeId} />

        {/* ── Section mode clair / sombre ── */}
        <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3">
          {t("theme.modeTitle")}
        </Text>

        <View className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark mb-6">
          {MODE_OPTIONS.map((option, index) => {
            const isSelected = themeMode === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setMode(option.id)}
                className="flex-row items-center justify-between p-4"
                style={{
                  borderBottomWidth: index < MODE_OPTIONS.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? "#334155" : "#F1F5F9",
                  backgroundColor: isSelected
                    ? isDark
                      ? "#422006"
                      : "#FEF3C7"
                    : "transparent",
                }}
              >
                <View className="flex-row items-center gap-3.5">
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? "#78350F"
                          : "#FDE68A"
                        : isDark
                          ? "#334155"
                          : "#F1F5F9",
                    }}
                  >
                    <MaterialIconsRound
                      name={option.icon}
                      size={22}
                      color={
                        isSelected ? "#F59E0B" : isDark ? "#94A3B8" : "#64748B"
                      }
                    />
                  </View>
                  <View>
                    <Text
                      className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                      style={{ fontSize: 15 }}
                    >
                      {t(option.nameKey)}
                    </Text>
                    <Text className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular text-xs mt-0.5">
                      {t(option.descriptionKey)}
                    </Text>
                  </View>
                </View>

                {isSelected && (
                  <View className="w-7 h-7 rounded-full bg-accent items-center justify-center">
                    <MaterialIconsRound name="check" size={18} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Section collection ── */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base">
            {t("themes.myCollection")}
          </Text>
          {/* Lien vers boutique */}
          <Pressable
            onPress={() => router.push("/themes")}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full active:opacity-70"
            style={{
              backgroundColor: isDark ? "rgba(217,119,6,0.15)" : "#FEF3C7",
              borderWidth: 1,
              borderColor: isDark ? "rgba(217,119,6,0.3)" : "#FDE68A",
            }}
          >
            <MaterialIconsRound name="toll" size={13} color="#D97706" />
            <Text
              className="font-outfit-bold text-xs"
              style={{ color: "#D97706" }}
            >
              {coins}
            </Text>
            <MaterialIconsRound name="storefront" size={13} color="#D97706" />
          </Pressable>
        </View>

        {/* Grille 2 colonnes */}
        {themePairs.map((pair, rowIndex) => (
          <View
            key={rowIndex}
            className="flex-row mb-3"
            style={{ gap: GRID_GAP }}
          >
            {pair.map((theme) => (
              <CollectionCard
                key={theme.id}
                themeId={theme.id}
                isActive={activeThemeId === theme.id}
                onSelect={() => {
                  void setActiveTheme(theme.id, user?.id);
                }}
                cardWidth={cardWidth}
              />
            ))}
            {/* Remplir l'espace si nombre impair */}
            {pair.length === 1 && <View style={{ width: cardWidth }} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
