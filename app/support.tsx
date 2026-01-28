import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import Purchases, {
  PURCHASES_ERROR_CODE,
  PurchasesPackage,
} from "react-native-purchases";
import ConfettiCannon from "react-native-confetti-cannon";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useThemeStore from "@/stores/useThemeStore";
import { initRevenueCat } from "@/lib/revenuecat";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";

// Types de dons avec leurs identifiants RevenueCat
interface DonationTier {
  id: string;
  rcIdentifier: string; // RevenueCat product identifier
  emoji: string;
  titleKey: string;
  descriptionKey: string;
  color: string;
  accentColor: string;
  priceHint: string; // Fallback price hint
}

const DONATION_TIERS: DonationTier[] = [
  {
    id: "bronze",
    rcIdentifier: "donation_tier_1",
    emoji: "🥉",
    titleKey: "support.bronze",
    descriptionKey: "support.bronzeDesc",
    color: "#CD7F32",
    accentColor: "#B87333",
    priceHint: "~1000 FCFA",
  },
  {
    id: "silver",
    rcIdentifier: "donation_tier_2",
    emoji: "🥈",
    titleKey: "support.silver",
    descriptionKey: "support.silverDesc",
    color: "#C0C0C0",
    accentColor: "#A8A8A8",
    priceHint: "~5000 FCFA",
  },
  {
    id: "gold",
    rcIdentifier: "donation_tier_3",
    emoji: "🥇",
    titleKey: "support.gold",
    descriptionKey: "support.goldDesc",
    color: "#FFD700",
    accentColor: "#DAA520",
    priceHint: "~10000 FCFA",
  },
];

type PurchaseState = {
  loadingId: string | null;
  success: boolean;
  error: string | null;
};

export default function SupportScreen() {
  const { t } = useTranslation();
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();
  const navigation = useNavigation();
  const confettiRef = useRef<ConfettiCannon>(null);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [state, setState] = useState<PurchaseState>({
    loadingId: null,
    success: false,
    error: null,
  });

  const canGoBack = navigation.canGoBack();

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const colors = {
    bg: isDark ? "#0F172A" : "#F8FAFC",
    card: isDark ? "#1E293B" : "#FFFFFF",
    textPrimary: isDark ? "#F8FAFC" : "#12201F",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    tealDark: "#115E59",
    tealDeep: "#0d4542",
    error: isDark ? "#FCA5A5" : "#DC2626",
    errorBg: isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
    successBg: isDark ? "rgba(16, 185, 129, 0.1)" : "#ECFDF5",
    successText: isDark ? "#6EE7B7" : "#059669",
  };

  // Charger les offres RevenueCat
  useEffect(() => {
    const loadOfferings = async () => {
      try {
        await initRevenueCat();
        const offerings = await Purchases.getOfferings();
        if (offerings.current?.availablePackages) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (error) {
        console.log("Erreur chargement offres:", error);
      }
    };
    loadOfferings();
  }, []);

  // Trouver le prix pour un tier donné
  const getPriceForTier = (tier: DonationTier): string => {
    const pkg = packages.find((p) =>
      p.identifier.toLowerCase().includes(tier.rcIdentifier.toLowerCase()),
    );
    return pkg?.product.priceString || tier.priceHint;
  };

  // Marquer l'utilisateur comme supporter dans Supabase
  const markAsSupporter = async () => {
    if (!supabase) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ is_supporter: true })
          .eq("id", user.id);
      }
    } catch (error) {
      console.log("Erreur marquage supporter:", error);
    }
  };

  // Gérer l'achat d'un don
  const handleDonation = async (tier: DonationTier) => {
    const pkg = packages.find((p) =>
      p.identifier.toLowerCase().includes(tier.rcIdentifier.toLowerCase()),
    );

    if (!pkg) {
      setState((prev) => ({
        ...prev,
        error: t("support.errorOccurred"),
      }));
      return;
    }

    setState({ loadingId: tier.id, success: false, error: null });

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      // Marquer comme supporter dans Supabase
      await markAsSupporter();

      // Déclencher les confettis
      confettiRef.current?.start();

      setState({ loadingId: null, success: true, error: null });
    } catch (error: any) {
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        // L'utilisateur a annulé, pas besoin d'afficher d'erreur
        setState({ loadingId: null, success: false, error: null });
      } else {
        setState({
          loadingId: null,
          success: false,
          error: t("support.errorOccurred"),
        });
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={[colors.tealDark, colors.tealDeep]}
        style={{
          paddingTop: 60,
          paddingBottom: 32,
          paddingHorizontal: 20,
        }}
      >
        {/* Bouton retour */}
        {canGoBack && (
          <Pressable
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: 60,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Icône cœur */}
        <View
          style={{
            alignSelf: "center",
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "rgba(255,255,255,0.2)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <MaterialIconsRound name="favorite" size={32} color="#FFFFFF" />
        </View>

        <Text
          style={{
            fontFamily: "Outfit_700Bold",
            fontSize: 28,
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {t("support.title")}
        </Text>

        <Text
          style={{
            fontFamily: "Outfit_400Regular",
            fontSize: 16,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            lineHeight: 24,
          }}
        >
          {t("support.subtitle")}
        </Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Message d'introduction */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: "Outfit_400Regular",
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            {t("support.intro")}
          </Text>
        </View>

        {/* Message d'erreur */}
        {state.error && (
          <View
            style={{
              backgroundColor: colors.errorBg,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <MaterialIconsRound name="error" size={24} color={colors.error} />
            <Text
              style={{
                flex: 1,
                fontFamily: "Outfit_500Medium",
                fontSize: 14,
                color: colors.error,
              }}
            >
              {state.error}
            </Text>
          </View>
        )}

        {/* Message de succès */}
        {state.success && (
          <View
            style={{
              backgroundColor: colors.successBg,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <MaterialIconsRound
              name="check-circle"
              size={24}
              color={colors.successText}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Outfit_600SemiBold",
                  fontSize: 16,
                  color: colors.successText,
                  marginBottom: 4,
                }}
              >
                {t("support.thankYou")}
              </Text>
              <Text
                style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 14,
                  color: colors.successText,
                }}
              >
                {t("support.thankYouDesc")}
              </Text>
            </View>
          </View>
        )}

        {/* Cartes de dons */}
        <Text
          style={{
            fontFamily: "Outfit_600SemiBold",
            fontSize: 18,
            color: colors.textPrimary,
            marginBottom: 16,
          }}
        >
          {t("support.chooseDonation")}
        </Text>

        {DONATION_TIERS.map((tier) => {
          const isLoading = state.loadingId === tier.id;
          const price = getPriceForTier(tier);

          return (
            <Pressable
              key={tier.id}
              onPress={() => handleDonation(tier)}
              disabled={state.loadingId !== null}
              style={({ pressed }) => ({
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 2,
                borderColor: isLoading ? tier.color : colors.border,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* Emoji */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: `${tier.color}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{tier.emoji}</Text>
                </View>

                {/* Infos */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Outfit_700Bold",
                      fontSize: 20,
                      color: colors.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    {t(tier.titleKey)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Outfit_400Regular",
                      fontSize: 13,
                      color: colors.textSecondary,
                    }}
                  >
                    {t(tier.descriptionKey)}
                  </Text>
                </View>

                {/* Prix / Loading */}
                {isLoading ? (
                  <ActivityIndicator size="small" color={tier.color} />
                ) : (
                  <View
                    style={{
                      backgroundColor: tier.color,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Outfit_700Bold",
                        fontSize: 16,
                        color: tier.id === "silver" ? "#1E293B" : "#FFFFFF",
                      }}
                    >
                      {price}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}

        {/* Section "Pourquoi soutenir ?" */}
        <View style={{ marginTop: 16 }}>
          <Text
            style={{
              fontFamily: "Outfit_600SemiBold",
              fontSize: 18,
              color: colors.textPrimary,
              marginBottom: 16,
            }}
          >
            {t("support.whySupport")}
          </Text>

          {/* Coûts serveurs */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${colors.tealDark}15`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIconsRound
                name="dns"
                size={22}
                color={colors.tealDark}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Outfit_600SemiBold",
                  fontSize: 15,
                  color: colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                {t("support.serverCosts")}
              </Text>
              <Text
                style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 13,
                  color: colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                {t("support.serverCostsDesc")}
              </Text>
            </View>
          </View>

          {/* Développement */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${colors.tealDark}15`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIconsRound
                name="code"
                size={22}
                color={colors.tealDark}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Outfit_600SemiBold",
                  fontSize: 15,
                  color: colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                {t("support.development")}
              </Text>
              <Text
                style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 13,
                  color: colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                {t("support.developmentDesc")}
              </Text>
            </View>
          </View>

          {/* Sadaqah Jariyah */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${colors.tealDark}15`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIconsRound
                name="favorite"
                size={22}
                color={colors.tealDark}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Outfit_600SemiBold",
                  fontSize: 15,
                  color: colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                {t("support.sadaqah")}
              </Text>
              <Text
                style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 13,
                  color: colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                {t("support.sadaqahDesc")}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text
            style={{
              fontFamily: "Outfit_400Regular",
              fontSize: 13,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {t("support.securePayment")} {"\n"}
            {t("support.appStorePlay")}
          </Text>
        </View>
      </ScrollView>

      {/* Confetti */}
      {state.success && (
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: -10, y: 0 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={350}
          fallSpeed={2500}
        />
      )}
    </View>
  );
}
