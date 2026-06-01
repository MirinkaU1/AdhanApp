import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppInput, AppButton, ErrorMessage } from "@/components/ui";
import useAuthStore from "@/stores/useAuthStore";
import { useIsDark } from "@/components/useColorScheme";

export default function RegisterScreen() {
  const { signUpWithEmail, isLoading } = useAuthStore();
  const isDark = useIsDark();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage(t("auth.registerNameRequired"));
      return;
    }
    if (!email.trim()) {
      setErrorMessage(t("auth.registerEmailRequired"));
      return;
    }
    if (!password) {
      setErrorMessage(t("auth.registerPasswordRequired"));
      return;
    }
    if (password.length < 8) {
      setErrorMessage(t("auth.registerPasswordMin"));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t("auth.registerPasswordMismatch"));
      return;
    }
    if (!acceptTerms) {
      setErrorMessage(t("auth.registerTermsRequired"));
      return;
    }

    const result = await signUpWithEmail(email.trim(), password, name.trim());

    if (result.success) {
      Alert.alert(
        t("auth.registerSuccessTitle"),
        t("auth.registerSuccessMessage"),
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }],
      );
    } else {
      let errorMsg = result.error || t("common.error");
      if (errorMsg.includes("already registered")) {
        errorMsg = t("auth.registerEmailAlreadyUsed");
      } else if (errorMsg.includes("invalid email")) {
        errorMsg = t("auth.registerInvalidEmail");
      } else if (errorMsg.includes("weak password")) {
        errorMsg = t("auth.registerWeakPassword");
      }
      setErrorMessage(errorMsg);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 dark:bg-slate-900">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <LinearGradient
          colors={["#115E59", "#0d4542"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="pt-16 pb-12 px-6 relative"
        >
          {/* Pattern islamique */}
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdQO7DmBVbuu03IH4BocFKDFkHmlUe2HE1SMJ8hEEP0N9z-aKcbbSzlGU3DVcXn-D1v-uxMZ2Q_WWZudOeijOi0hrg4Jk0GT83F2Mo31sUwByC3xc1deVXN2ubGgZVyVREHzB26yPLeEwviGWxhQcpIR25bjDWHkZbfz8f7Mbm_HNa368vc9k55RodXtXsFNZZm_u91vUH82knn_hPTGfdAi0dWm0qcPJBjs1uyWZUCGthXhCIpJKfERne5HKVvMzjBkZIEfHly_w",
            }}
            className="absolute inset-0 opacity-[0.08]"
            resizeMode="cover"
          />

          {/* Bouton retour */}
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white/10 items-center justify-center mb-4"
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>

          <Text className="text-4xl font-outfit-bold text-white">
            {t("auth.registerTitle")}
          </Text>
          <Text className="text-base font-outfit-regular text-white/70 mt-1">
            {t("auth.registerSubtitle")}
          </Text>
        </LinearGradient>

        {/* Formulaire */}
        <ScrollView
          className="flex-1 bg-gray-100 dark:bg-slate-900 -mt-5 rounded-t-3xl"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 50,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nom complet */}
          <AppInput
            label={t("auth.registerFullName")}
            icon="person"
            placeholder={t("auth.registerFullNamePlaceholder")}
            value={name}
            onChangeText={setName}
            containerClassName="mb-4"
          />

          {/* Email */}
          <AppInput
            label={t("auth.email")}
            icon="mail"
            placeholder={t("auth.registerEmailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerClassName="mb-4"
          />

          {/* Mot de passe */}
          <AppInput
            label={t("auth.password")}
            icon="lock"
            placeholder={t("auth.registerPasswordPlaceholder")}
            value={password}
            onChangeText={setPassword}
            isPassword
            containerClassName="mb-4"
          />

          {/* Confirmer mot de passe */}
          <AppInput
            label={t("auth.registerConfirmPassword")}
            icon="verified-user"
            placeholder={t("auth.registerPasswordPlaceholder")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            containerClassName="mb-5"
          />

          {/* Conditions */}
          <Pressable
            onPress={() => setAcceptTerms(!acceptTerms)}
            className="flex-row items-start mb-6"
          >
            <View
              className="w-6 h-6 rounded-md border-2 items-center justify-center mr-3 mt-0.5"
              style={{
                backgroundColor: acceptTerms ? "#115E59" : "transparent",
                borderColor: acceptTerms
                  ? "#115E59"
                  : isDark
                    ? "#475569"
                    : "#D1D5DB",
              }}
            >
              {acceptTerms && (
                <MaterialIconsRound name="check" size={16} color="#fff" />
              )}
            </View>
            <Text className="flex-1 text-base font-outfit-medium text-gray-500 dark:text-slate-400 leading-5">
              {t("auth.registerAcceptTerms")}{" "}
              <Text
                className="font-outfit-bold underline"
                style={{ color: "#115E59" }}
              >
                {t("auth.registerTermsOfService")}
              </Text>{" "}
              {t("auth.registerAnd")}{" "}
              {t("auth.registerPrivacyPolicy")}
            </Text>
          </Pressable>

          {/* Message d'erreur */}
          {errorMessage ? (
            <ErrorMessage message={errorMessage} className="mb-4" />
          ) : null}

          {/* Bouton inscription */}
          <AppButton
            title={t("auth.registerButton")}
            onPress={handleRegister}
            variant="secondary"
            icon="arrow-forward"
            iconPosition="right"
            loading={isLoading}
          />

          {/* Lien connexion */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-base font-outfit-medium text-gray-500 dark:text-slate-400">
              {t("auth.registerAlreadyAccount")}
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text
                className="text-base font-outfit-bold ml-2"
                style={{ color: "#115E59" }}
              >
                {t("auth.registerLogin")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
