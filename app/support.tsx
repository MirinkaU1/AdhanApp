import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
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
import { useIsDark } from "@/components/useColorScheme";
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
  const isDark = useIsDark();
  const navigation = useNavigation();
  const confettiRef = useRef<ConfettiCannon>(null);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [state, setState] = useState<PurchaseState>({
    loadingId: null,
    success: false,
    error: null,
  });

  const canGoBack = navigation.canGoBack();

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
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header avec gradient */}
      <LinearGradient
        colors={["#115E59", "#0d4542"]}
        className="pt-[60px] pb-8 px-5"
      >
        {/* Bouton retour */}
        {canGoBack && (
          <Pressable
            onPress={() => router.back()}
            className="absolute top-[60px] left-4 w-10 h-10 rounded-full bg-white/15 items-center justify-center"
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Icône cœur */}
        <View className="self-center w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-4">
          <MaterialIconsRound name="favorite" size={32} color="#FFFFFF" />
        </View>

        <Text className="font-outfit-bold text-[28px] text-white text-center mb-2">
          {t("support.title")}
        </Text>

        <Text className="font-outfit-regular text-base text-white/85 text-center leading-6">
          {t("support.subtitle")}
        </Text>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Message d'introduction */}
        <View className="bg-card-light dark:bg-card-dark rounded-2xl p-5 mb-6 border border-border-light dark:border-border-dark">
          <Text className="font-outfit-regular text-[15px] text-text-secondary-light dark:text-text-secondary-dark text-center leading-6">
            {t("support.intro")}
          </Text>
        </View>

        {/* Message d'erreur */}
        {state.error && (
          <View className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 mb-5 flex-row items-center gap-3">
            <MaterialIconsRound
              name="error"
              size={24}
              color={isDark ? "#FCA5A5" : "#DC2626"}
            />
            <Text className="flex-1 font-outfit-medium text-sm text-red-600 dark:text-red-300">
              {state.error}
            </Text>
          </View>
        )}

        {/* Message de succès */}
        {state.success && (
          <View className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 mb-5 flex-row items-center gap-3">
            <MaterialIconsRound
              name="check-circle"
              size={24}
              color={isDark ? "#6EE7B7" : "#059669"}
            />
            <View className="flex-1">
              <Text className="font-outfit-semibold text-base text-emerald-600 dark:text-emerald-300 mb-1">
                {t("support.thankYou")}
              </Text>
              <Text className="font-outfit-regular text-sm text-emerald-600 dark:text-emerald-300">
                {t("support.thankYouDesc")}
              </Text>
            </View>
          </View>
        )}

        {/* Cartes de dons */}
        <Text className="font-outfit-semibold text-lg text-text-primary-light dark:text-text-primary-dark mb-4">
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
              className="bg-card-light dark:bg-card-dark rounded-2xl p-5 mb-4 active:opacity-90 active:scale-[0.98]"
              style={{
                borderWidth: 2,
                borderColor: isLoading
                  ? tier.color
                  : isDark
                    ? "#334155"
                    : "#E2E8F0",
              }}
            >
              <View className="flex-row items-center gap-4">
                {/* Emoji */}
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${tier.color}20` }}
                >
                  <Text className="text-[28px]">{tier.emoji}</Text>
                </View>

                {/* Infos */}
                <View className="flex-1">
                  <Text className="font-outfit-bold text-xl text-text-primary-light dark:text-text-primary-dark mb-1">
                    {t(tier.titleKey)}
                  </Text>
                  <Text className="font-outfit-regular text-[13px] text-text-secondary-light dark:text-text-secondary-dark">
                    {t(tier.descriptionKey)}
                  </Text>
                </View>

                {/* Prix / Loading */}
                {isLoading ? (
                  <ActivityIndicator size="small" color={tier.color} />
                ) : (
                  <View
                    className="px-4 py-2.5 rounded-xl"
                    style={{ backgroundColor: tier.color }}
                  >
                    <Text
                      className="font-outfit-bold text-base"
                      style={{
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
        <View className="mt-4">
          <Text className="font-outfit-semibold text-lg text-text-primary-light dark:text-text-primary-dark mb-4">
            {t("support.whySupport")}
          </Text>

          {/* Coûts serveurs */}
          <View className="flex-row items-start gap-3.5 mb-4">
            <View className="w-11 h-11 rounded-full bg-teal-800/10 items-center justify-center">
              <MaterialIconsRound name="dns" size={22} color="#115E59" />
            </View>
            <View className="flex-1">
              <Text className="font-outfit-semibold text-[15px] text-text-primary-light dark:text-text-primary-dark mb-1">
                {t("support.serverCosts")}
              </Text>
              <Text className="font-outfit-regular text-[13px] text-text-secondary-light dark:text-text-secondary-dark leading-[18px]">
                {t("support.serverCostsDesc")}
              </Text>
            </View>
          </View>

          {/* Développement */}
          <View className="flex-row items-start gap-3.5 mb-4">
            <View className="w-11 h-11 rounded-full bg-teal-800/10 items-center justify-center">
              <MaterialIconsRound name="code" size={22} color="#115E59" />
            </View>
            <View className="flex-1">
              <Text className="font-outfit-semibold text-[15px] text-text-primary-light dark:text-text-primary-dark mb-1">
                {t("support.development")}
              </Text>
              <Text className="font-outfit-regular text-[13px] text-text-secondary-light dark:text-text-secondary-dark leading-[18px]">
                {t("support.developmentDesc")}
              </Text>
            </View>
          </View>

          {/* Sadaqah Jariyah */}
          <View className="flex-row items-start gap-3.5">
            <View className="w-11 h-11 rounded-full bg-teal-800/10 items-center justify-center">
              <MaterialIconsRound name="favorite" size={22} color="#115E59" />
            </View>
            <View className="flex-1">
              <Text className="font-outfit-semibold text-[15px] text-text-primary-light dark:text-text-primary-dark mb-1">
                {t("support.sadaqah")}
              </Text>
              <Text className="font-outfit-regular text-[13px] text-text-secondary-light dark:text-text-secondary-dark leading-[18px]">
                {t("support.sadaqahDesc")}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="font-outfit-regular text-[13px] text-text-secondary-light dark:text-text-secondary-dark text-center leading-5">
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
