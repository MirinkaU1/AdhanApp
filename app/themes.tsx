/**
 * Boutique de thèmes — accessible via le badge pièces sur l'accueil
 */
import {
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
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AlertDialog } from "@/components/ui";
import useThemeStore from "@/stores/useThemeStore";
import useCoinsStore from "@/stores/useCoinsStore";
import useQuestStore from "@/stores/useQuestStore";
import useAuthStore from "@/stores/useAuthStore";
import { APP_THEMES, type AppTheme } from "@/constants/appThemes";

// ─────────────────────────────────────────────
// Carte thème boutique (2 colonnes)
// ─────────────────────────────────────────────

function ShopThemeCard({
  theme,
  onPurchase,
  cardWidth,
}: {
  theme: AppTheme;
  onPurchase: () => void;
  cardWidth: number;
}) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { level } = useQuestStore();
  const { coins } = useCoinsStore();

  const isLevelLocked =
    theme.unlock.type === "level" && level < theme.unlock.level;
  const isEvent = theme.unlock.type === "event";
  const canAfford =
    theme.unlock.type === "coins" ? coins >= theme.unlock.price : false;
  const isLocked = isLevelLocked || isEvent;

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
          {isLevelLocked
            ? t("themes.unlockLevel", {
                level: (theme.unlock as { type: "level"; level: number }).level,
              })
            : isEvent
              ? t("themes.eventDesc")
              : t(theme.descriptionKey)}
        </Text>

        {/* Bouton achat ou verrou */}
        {theme.unlock.type === "coins" && !isLocked ? (
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
              style={{ fontSize: 11, color: canAfford ? "#D97706" : "#94A3B8" }}
            >
              {theme.unlock.price}
            </Text>
          </Pressable>
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
  onPurchase,
  cardWidth,
  gap,
}: {
  themes: AppTheme[];
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

  const GRID_PADDING = 16;
  const GRID_GAP = 10;
  const cardWidth = (width - GRID_PADDING * 2 - GRID_GAP) / 2;

  // Modals
  const [confirmTheme, setConfirmTheme] = useState<AppTheme | null>(null);
  const [purchasedTheme, setPurchasedTheme] = useState<AppTheme | null>(null);
  const [showNoCoins, setShowNoCoins] = useState<{ need: number } | null>(null);

  const lockedThemes = APP_THEMES.filter((th) => !isThemeUnlocked(th.id));

  const handlePurchase = (theme: AppTheme) => {
    if (theme.unlock.type !== "coins") return;
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

  const byCoins = lockedThemes.filter((t) => t.unlock.type === "coins");
  const byLevel = lockedThemes.filter((t) => t.unlock.type === "level");
  const byEvent = lockedThemes.filter((t) => t.unlock.type === "event");

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
        {lockedThemes.length === 0 ? (
          <View className="items-center justify-center py-20">
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
        ) : (
          <>
            {byCoins.length > 0 && (
              <>
                <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3">
                  {t("themes.available")}
                </Text>
                <ThemeGrid
                  themes={byCoins}
                  onPurchase={handlePurchase}
                  cardWidth={cardWidth}
                  gap={GRID_GAP}
                />
              </>
            )}

            {byLevel.length > 0 && (
              <>
                <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3 mt-2">
                  {t("themes.byLevel")}
                </Text>
                <ThemeGrid
                  themes={byLevel}
                  onPurchase={() => {}}
                  cardWidth={cardWidth}
                  gap={GRID_GAP}
                />
              </>
            )}

            {byEvent.length > 0 && (
              <>
                <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3 mt-2">
                  {t("themes.events")}
                </Text>
                <ThemeGrid
                  themes={byEvent}
                  onPurchase={() => {}}
                  cardWidth={cardWidth}
                  gap={GRID_GAP}
                />
              </>
            )}
          </>
        )}
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

      {/* Modal solde insuffisant */}
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
    </View>
  );
}
