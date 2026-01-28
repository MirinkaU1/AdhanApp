import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppInput, AppButton } from "@/components/ui";
import useThemeColors from "@/hooks/useThemeColors";
import { fonts, fontSizes, spacing, borderRadius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import useAuthStore from "@/stores/useAuthStore";

export default function WelcomeScreen() {
  const colors = useThemeColors();
  const { login } = useAuthStore();

  const [step, setStep] = useState(1); // 1 = prénom, 2 = date de naissance
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Convertir date DD/MM/YYYY en format ISO (YYYY-MM-DD) pour PostgreSQL
  const parseBirthDate = (dateStr: string): string | null => {
    if (!dateStr || dateStr.length !== 10) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    if (isNaN(Number(day)) || isNaN(Number(month)) || isNaN(Number(year)))
      return null;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const handleContinue = () => {
    if (step === 1 && firstName.trim()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleGuestLogin = async () => {
    if (!firstName.trim()) return;

    setIsLoading(true);

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          console.warn(
            "Supabase auth failed, using local mode:",
            error.message,
          );
          login({
            id: `guest_${Date.now()}`,
            name: firstName.trim(),
            email: "",
            memberSince: new Date().toISOString(),
            isGuest: true,
            xp: 0,
            level: 1,
          });
          router.replace("/(tabs)");
          return;
        }

        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              username: firstName.trim(),
              birth_date: parseBirthDate(birthDate),
              is_anonymous: true,
              xp: 0,
              level: 1,
              created_at: new Date().toISOString(),
            });

          if (profileError) {
            console.warn("Erreur création profil:", profileError);
          }

          login({
            id: data.user.id,
            name: firstName.trim(),
            email: "",
            memberSince: new Date().toISOString(),
            isGuest: true,
            xp: 0,
            level: 1,
          });
        }
      } else {
        login({
          id: `guest_${Date.now()}`,
          name: firstName.trim(),
          email: "",
          memberSince: new Date().toISOString(),
          isGuest: true,
          xp: 0,
          level: 1,
        });
      }

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Erreur connexion:", error);
      login({
        id: `guest_${Date.now()}`,
        name: firstName.trim(),
        email: "",
        memberSince: new Date().toISOString(),
        isGuest: true,
        xp: 0,
        level: 1,
      });
      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  // Format date input (DD/MM/YYYY)
  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted =
        cleaned.slice(0, 2) +
        "/" +
        cleaned.slice(2, 4) +
        "/" +
        cleaned.slice(4, 8);
    }
    setBirthDate(formatted);
  };

  const isValidDate = (date: string) => {
    if (!date) return true;
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(date);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header avec logo */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          height: "40%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Pattern décoratif */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdQO7DmBVbuu03IH4BocFKDFkHmlUe2HE1SMJ8hEEP0N9z-aKcbbSzlGU3DVcXn-D1v-uxMZ2Q_WWZudOeijOi0hrg4Jk0GT83F2Mo31sUwByC3xc1deVXN2ubGgZVyVREHzB26yPLeEwviGWxhQcpIR25bjDWHkZbfz8f7Mbm_HNa368vc9k55RodXtXsFNZZm_u91vUH82knn_hPTGfdAi0dWm0qcPJBjs1uyWZUCGthXhCIpJKfERne5HKVvMzjBkZIEfHly_w",
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.08,
          }}
          resizeMode="cover"
        />

        {/* Logo carré rotatif */}
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 96,
              height: 96,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: borderRadius.xl,
              transform: [{ rotate: "45deg" }],
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <View style={{ transform: [{ rotate: "-45deg" }] }}>
              <MaterialIconsRound name="mosque" size={48} color="#FCD34D" />
            </View>
          </View>
          <Text
            style={{
              fontSize: fontSizes["5xl"],
              fontFamily: fonts.bold,
              color: "#fff",
              marginTop: spacing.lg,
            }}
          >
            MaPrière
          </Text>
          <Text
            style={{
              fontSize: fontSizes.md,
              fontFamily: fonts.regular,
              color: "rgba(255,255,255,0.7)",
              marginTop: spacing.xs,
            }}
          >
            Votre compagnon spirituel
          </Text>
        </View>
      </LinearGradient>

      {/* Formulaire scrollable */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          borderTopLeftRadius: borderRadius["4xl"],
          borderTopRightRadius: borderRadius["4xl"],
          marginTop: -30,
        }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing["2xl"],
            paddingTop: spacing.base,
            paddingBottom: spacing["4xl"],
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Indicateur d'étape */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.xl,
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                width: step === 1 ? 24 : 8,
                height: 8,
                borderRadius: borderRadius.sm,
                backgroundColor: step === 1 ? colors.primary : colors.divider,
              }}
            />
            <View
              style={{
                width: step === 2 ? 24 : 8,
                height: 8,
                borderRadius: borderRadius.sm,
                backgroundColor: step === 2 ? colors.primary : colors.divider,
              }}
            />
          </View>

          {/* ÉTAPE 1: Prénom */}
          {step === 1 && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text
                style={{
                  fontSize: fontSizes["4xl"],
                  fontFamily: fonts.bold,
                  color: colors.textPrimary,
                  marginBottom: spacing.sm,
                }}
              >
                Bienvenue 👋
              </Text>
              <Text
                style={{
                  fontSize: fontSizes.lg,
                  fontFamily: fonts.regular,
                  color: colors.textSecondary,
                  marginBottom: spacing["2xl"],
                }}
              >
                Comment devons-nous vous appeler ?
              </Text>

              {/* Input Prénom */}
              <AppInput
                icon="person"
                placeholder="Votre Prénom"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
                containerStyle={{ marginBottom: spacing.xl }}
              />

              {/* Bouton Continuer */}
              <AppButton
                title="Continuer"
                onPress={handleContinue}
                variant="primary"
                size="md"
                icon="arrow-forward"
                iconPosition="right"
                fullWidth
                disabled={!firstName.trim()}
              />
            </Animated.View>
          )}

          {/* ÉTAPE 2: Date de naissance */}
          {step === 2 && (
            <Animated.View entering={FadeInRight.duration(300)}>
              {/* Bouton retour */}
              <Pressable
                onPress={handleBack}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: spacing.base,
                  gap: spacing.xs,
                }}
              >
                <MaterialIconsRound
                  name="arrow-back"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: fontSizes.md,
                    fontFamily: fonts.medium,
                    color: colors.primary,
                  }}
                >
                  Retour
                </Text>
              </Pressable>

              <Text
                style={{
                  fontSize: fontSizes["4xl"],
                  fontFamily: fonts.bold,
                  color: colors.textPrimary,
                  marginBottom: spacing.sm,
                }}
              >
                Votre date de naissance 🎂
              </Text>
              <Text
                style={{
                  fontSize: fontSizes.lg,
                  fontFamily: fonts.regular,
                  color: colors.textSecondary,
                  marginBottom: spacing["2xl"],
                }}
              >
                Pour personnaliser votre expérience (optionnel)
              </Text>

              {/* Input Date */}
              <AppInput
                icon="cake"
                placeholder="JJ/MM/AAAA"
                value={birthDate}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
                containerStyle={{ marginBottom: spacing.xl }}
              />

              {/* Bouton Commencer */}
              <AppButton
                title="Commencer"
                onPress={handleGuestLogin}
                variant="secondary"
                icon="rocket-launch"
                iconPosition="right"
                loading={isLoading}
                disabled={birthDate.length > 0 && !isValidDate(birthDate)}
              />

              {/* Skip option */}
              <Pressable
                onPress={handleGuestLogin}
                disabled={isLoading}
                style={{
                  alignItems: "center",
                  paddingVertical: spacing.base,
                  marginTop: spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: fontSizes.md,
                    fontFamily: fonts.medium,
                    color: colors.textSecondary,
                  }}
                >
                  Passer cette étape
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: spacing.xl,
            }}
          >
            <View
              style={{ flex: 1, height: 1, backgroundColor: colors.divider }}
            />
            <Text
              style={{
                fontSize: fontSizes.md,
                fontFamily: fonts.regular,
                color: colors.placeholder,
                marginHorizontal: spacing.base,
              }}
            >
              ou
            </Text>
            <View
              style={{ flex: 1, height: 1, backgroundColor: colors.divider }}
            />
          </View>

          {/* Login Link */}
          <Pressable
            onPress={handleLogin}
            style={{ alignItems: "center", paddingVertical: spacing.md }}
          >
            <Text
              style={{
                fontSize: fontSizes.base,
                fontFamily: fonts.regular,
                color: colors.textSecondary,
              }}
            >
              Vous avez déjà un compte ?{" "}
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  color: colors.primary,
                }}
              >
                Se connecter
              </Text>
            </Text>
          </Pressable>

          {/* Terms */}
          <Text
            style={{
              fontSize: fontSizes.sm,
              fontFamily: fonts.regular,
              color: colors.placeholder,
              textAlign: "center",
              marginTop: spacing.lg,
              lineHeight: 18,
            }}
          >
            En continuant, vous acceptez nos{" "}
            <Text style={{ color: colors.primary }}>
              Conditions d'utilisation
            </Text>{" "}
            et notre{" "}
            <Text style={{ color: colors.primary }}>
              Politique de confidentialité
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
