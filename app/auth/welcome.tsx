import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  Image,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppInput, AppButton, GenderDrawer, AppSelect, AppDatePicker } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import useAuthStore from "@/stores/useAuthStore";
import type { UserGender } from "@/stores/useAuthStore";
export default function WelcomeScreen() {
  const { login } = useAuthStore();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<UserGender | null>(null);
  const [isGenderDrawerOpen, setIsGenderDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [dateError, setDateError] = useState("");

  const selectedGenderLabel =
    gender === "male"
      ? t("onboarding.genderMale")
      : gender === "female"
        ? t("onboarding.genderFemale")
        : gender === "not_specified"
          ? t("onboarding.genderNotSpecified")
          : t("onboarding.genderSelect");

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
    if (step === 1) {
      if (!firstName.trim()) {
        setFirstNameError(t("onboarding.nameRequired"));
        return;
      }
      setFirstNameError("");
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleGuestLogin = async () => {
    if (!firstName.trim()) {
      setFirstNameError(t("onboarding.nameRequired"));
      return;
    }

    if (birthDate && !isValidDate(birthDate)) {
      setDateError(t("onboarding.invalidDate"));
      return;
    }

    setIsLoading(true);

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInAnonymously();
        const shouldLockGender = gender === "male" || gender === "female";

        if (error) {
          console.warn(
            "Supabase auth failed, using local mode:",
            error.message,
          );
          login({
            id: `guest_${Date.now()}`,
            name: firstName.trim(),
            email: "",
            role: "user",
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
              gender,
              gender_locked: shouldLockGender,
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
            role: "user",
            birthDate: birthDate || undefined,
            memberSince: new Date().toISOString(),
            isGuest: true,
            xp: 0,
            level: 1,
            gender: gender || undefined,
            genderLocked: shouldLockGender,
          });
        }
      } else {
        const shouldLockGender = gender === "male" || gender === "female";
        login({
          id: `guest_${Date.now()}`,
          name: firstName.trim(),
          email: "",
          role: "user",
          birthDate: birthDate || undefined,
          memberSince: new Date().toISOString(),
          isGuest: true,
          xp: 0,
          level: 1,
          gender: gender || undefined,
          genderLocked: shouldLockGender,
        });
      }

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Erreur connexion:", error);
      const shouldLockGender = gender === "male" || gender === "female";
      login({
        id: `guest_${Date.now()}`,
        name: firstName.trim(),
        email: "",
        role: "user",
        birthDate: birthDate || undefined,
        memberSince: new Date().toISOString(),
        isGuest: true,
        xp: 0,
        level: 1,
        gender: gender || undefined,
        genderLocked: shouldLockGender,
      });
      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

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
    if (!regex.test(date)) return false;

    const [day, month, year] = date.split("/").map(Number);
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;

    return true;
  };

  return (
    <View className="flex-1 bg-gray-100 dark:bg-slate-900">
      {/* Header avec logo */}
      <LinearGradient
        colors={["#115E59", "#0d4542"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="h-[40%] items-center justify-center"
      >
        {/* Pattern décoratif */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdQO7DmBVbuu03IH4BocFKDFkHmlUe2HE1SMJ8hEEP0N9z-aKcbbSzlGU3DVcXn-D1v-uxMZ2Q_WWZudOeijOi0hrg4Jk0GT83F2Mo31sUwByC3xc1deVXN2ubGgZVyVREHzB26yPLeEwviGWxhQcpIR25bjDWHkZbfz8f7Mbm_HNa368vc9k55RodXtXsFNZZm_u91vUH82knn_hPTGfdAi0dWm0qcPJBjs1uyWZUCGthXhCIpJKfERne5HKVvMzjBkZIEfHly_w",
          }}
          className="absolute inset-0 opacity-[0.08]"
          resizeMode="cover"
        />

        {/* Logo carré rotatif */}
        <View className="items-center">
          <View className="w-24 h-24 bg-white/10 rounded-2xl rotate-45 items-center justify-center border border-white/20">
            <View className="-rotate-45">
              <MaterialIconsRound name="mosque" size={48} color="#FCD34D" />
            </View>
          </View>
          <Text className="text-4xl font-outfit-bold text-white mt-6">
            {t("auth.appName")}
          </Text>
          <Text className="text-base font-outfit-regular text-white/70 mt-1">
            {t("onboarding.tagline")}
          </Text>
        </View>
      </LinearGradient>

      {/* Formulaire scrollable */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-gray-100 dark:bg-slate-900 -mt-8 rounded-t-[32px]"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <GenderDrawer
          visible={isGenderDrawerOpen}
          onClose={() => setIsGenderDrawerOpen(false)}
          selectedGender={gender}
          onSelectGender={setGender}
          title={t("onboarding.genderTitle")}
          subtitle={t("onboarding.genderSubtitle")}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 48,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Indicateur d'étape */}
          <View className="flex-row items-center justify-center mb-6 gap-2">
            <View
              className={`h-2 rounded ${step === 1 ? "w-6" : "w-2 bg-gray-300 dark:bg-slate-600"}`}
              style={step === 1 ? { backgroundColor: "#115E59" } : undefined}
            />
            <View
              className={`h-2 rounded ${step === 2 ? "w-6" : "w-2 bg-gray-300 dark:bg-slate-600"}`}
              style={step === 2 ? { backgroundColor: "#115E59" } : undefined}
            />
          </View>

          {/* ÉTAPE 1: Prénom */}
          {step === 1 && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text className="text-3xl font-outfit-bold text-slate-800 dark:text-slate-100 mb-2">
                {t("onboarding.welcomeStep1Title")}
              </Text>
              <Text className="text-lg font-outfit-regular text-gray-500 dark:text-slate-400 mb-8">
                {t("onboarding.welcomeStep1Subtitle")}
              </Text>

              {/* Input Prénom */}
              <AppInput
                label={t("onboarding.firstNamePlaceholder")}
                icon="person"
                placeholder={t("onboarding.firstNamePlaceholder")}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (firstNameError) setFirstNameError("");
                }}
                autoCapitalize="words"
                autoCorrect={false}
                error={firstNameError}
                containerClassName="mb-6"
              />

              {/* Bouton Continuer */}
              <AppButton
                title={t("onboarding.continueButton")}
                onPress={handleContinue}
                variant="primary"
                size="md"
                icon="arrow-forward"
                iconPosition="right"
                fullWidth
              />
            </Animated.View>
          )}

          {/* ÉTAPE 2: Date de naissance */}
          {step === 2 && (
            <Animated.View entering={FadeInRight.duration(300)}>
              {/* Bouton retour */}
              <Pressable
                onPress={handleBack}
                className="flex-row items-center mb-4 gap-1"
              >
                <MaterialIconsRound
                  name="arrow-back"
                  size={20}
                  color={"#115E59"}
                />
                <Text
                  className="text-base font-outfit-medium"
                  style={{ color: "#115E59" }}
                >
                  {t("onboarding.backButton")}
                </Text>
              </Pressable>

              <Text className="text-2xl font-outfit-bold mb-3 text-slate-800 dark:text-slate-100">
                {t("onboarding.welcomeStep2Subtitle")}
              </Text>

              {/* Input Date */}
              <Text className="text-base font-outfit-medium text-slate-700 dark:text-slate-200 mb-3">
                {t("onboarding.welcomeStep2Title")}
              </Text>
              <AppDatePicker
                label={t("onboarding.welcomeStep2Title")}
                value={birthDate}
                placeholder={t("onboarding.datePlaceholder")}
                error={dateError}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                onChange={(date) => {
                  setBirthDate(date || "");
                  if (dateError) setDateError("");
                }}
                containerClassName="mb-6"
              />

              <Text className="text-base font-outfit-medium text-slate-700 dark:text-slate-200 mb-3">
                {t("onboarding.welcomeStep2GenderTitle")}
              </Text>
              <AppSelect
                icon="wc"
                value={selectedGenderLabel}
                placeholder={t("onboarding.genderSelect")}
                onPress={() => setIsGenderDrawerOpen(true)}
                containerClassName="mb-6"
              />

              {/* Bouton Commencer */}
              <AppButton
                title={t("onboarding.start")}
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
                className="items-center py-4 mt-2"
              >
                <Text className="text-base font-outfit-medium text-gray-500 dark:text-slate-400">
                  {t("onboarding.skipButton")}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-300 dark:bg-slate-600" />
            <Text className="text-base font-outfit-regular text-gray-400 dark:text-slate-500 mx-4">
              {t("onboarding.or:", "ou")}
            </Text>
            <View className="flex-1 h-px bg-gray-300 dark:bg-slate-600" />
          </View>

          {/* Login Link */}
          <Pressable onPress={handleLogin} className="items-center py-3">
            <Text className="text-base font-outfit-regular text-gray-500 dark:text-slate-400">
              {t("onboarding.alreadyHaveAccount")}{" "}
              <Text
                className="font-outfit-semibold"
                style={{ color: "#115E59" }}
              >
                {t("onboarding.login")}
              </Text>
            </Text>
          </Pressable>

          {/* Terms */}
          <Text className="text-sm font-outfit-regular text-gray-400 dark:text-slate-500 text-center mt-6 leading-5">
            {t("onboarding.terms")}{" "}
            <Text style={{ color: "#115E59" }}>
              {t("onboarding.termsOfService")}
            </Text>{" "}
            {t("onboarding.and")}{" "}
            <Text style={{ color: "#115E59" }}>
              {t("onboarding.privacyPolicy")}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
