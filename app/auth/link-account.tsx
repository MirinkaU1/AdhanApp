import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppInput, AppButton, ErrorMessage } from "@/components/ui";
import useAuthStore from "@/stores/useAuthStore";

export default function LinkAccountScreen() {
  const { t } = useTranslation();
  const { linkIdentity, isLoading } = useAuthStore();
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canGoBack = navigation.canGoBack();

  const handleLinkAccount = async () => {
    setErrorMessage("");

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Veuillez entrer un email valide");
      return;
    }

    // Validation mot de passe
    if (password.length < 6) {
      setErrorMessage(t("settings.passwordTooShort"));
      return;
    }

    // Validation confirmation
    if (password !== confirmPassword) {
      setErrorMessage(t("settings.passwordMismatch"));
      return;
    }

    const result = await linkIdentity(email.trim().toLowerCase(), password);

    if (result.success) {
      setSuccessMessage(t("settings.linkAccountSuccess"));
      setTimeout(() => {
        router.back();
      }, 1500);
    } else {
      let errorMsg = result.error || t("settings.linkAccountError");
      if (errorMsg.includes("already registered")) {
        errorMsg = "Cet email est déjà utilisé";
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
        {/* Header avec logo */}
        <LinearGradient
          colors={["#115E59", "#0d4542"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="h-[35%] items-center justify-center relative"
        >
          {/* Bouton retour */}
          {canGoBack && (
            <Pressable
              onPress={() => router.back()}
              className="absolute top-12 left-4 w-11 h-11 rounded-full bg-white/10 items-center justify-center z-10"
            >
              <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
            </Pressable>
          )}

          {/* Pattern islamique */}
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdQO7DmBVbuu03IH4BocFKDFkHmlUe2HE1SMJ8hEEP0N9z-aKcbbSzlGU3DVcXn-D1v-uxMZ2Q_WWZudOeijOi0hrg4Jk0GT83F2Mo31sUwByC3xc1deVXN2ubGgZVyVREHzB26yPLeEwviGWxhQcpIR25bjDWHkZbfz8f7Mbm_HNa368vc9k55RodXtXsFNZZm_u91vUH82knn_hPTGfdAi0dWm0qcPJBjs1uyWZUCGthXhCIpJKfERne5HKVvMzjBkZIEfHly_w",
            }}
            className="absolute inset-0 opacity-[0.08]"
            resizeMode="cover"
          />

          {/* Icône lien */}
          <View className="w-20 h-20 bg-white/10 rounded-2xl rotate-45 items-center justify-center border border-white/20">
            <View className="-rotate-45">
              <MaterialIconsRound name="link" size={40} color="#FCD34D" />
            </View>
          </View>

          <Text className="text-white font-outfit-bold text-2xl mt-4">
            {t("settings.linkAccountTitle")}
          </Text>
          <Text className="text-white/70 font-outfit-regular text-sm mt-1">
            {t("settings.linkAccountSubtitle")}
          </Text>
        </LinearGradient>

        {/* Formulaire */}
        <ScrollView
          className="flex-1 bg-gray-100 dark:bg-slate-900 -mt-6 rounded-t-3xl"
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 50,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info box */}
          <View className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mb-6 flex-row items-start gap-3 border border-amber-200 dark:border-amber-800">
            <MaterialIconsRound name="info" size={20} color="#D97706" />
            <Text className="flex-1 text-amber-800 dark:text-amber-200 font-outfit-regular text-sm leading-5">
              {t("settings.linkAccountDescription")}
            </Text>
          </View>

          {/* Email */}
          <AppInput
            label="Email"
            icon="mail"
            placeholder={t("settings.linkAccountEmailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            containerClassName="mb-5"
          />

          {/* Mot de passe */}
          <AppInput
            label={t("settings.linkAccountPassword")}
            icon="lock"
            placeholder={t("settings.linkAccountPasswordPlaceholder")}
            value={password}
            onChangeText={setPassword}
            isPassword
            returnKeyType="next"
            containerClassName="mb-5"
          />

          {/* Confirmer mot de passe */}
          <AppInput
            label={t("settings.linkAccountConfirmPassword")}
            icon="lock"
            placeholder={t("settings.linkAccountPasswordPlaceholder")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            returnKeyType="done"
            containerClassName="mb-6"
          />

          {/* Message de succès */}
          {successMessage ? (
            <View className="bg-green-100 dark:bg-green-900/30 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
              <MaterialIconsRound
                name="check-circle"
                size={20}
                color="#16A34A"
              />
              <Text className="text-green-700 dark:text-green-300 font-outfit-medium flex-1">
                {successMessage}
              </Text>
            </View>
          ) : null}

          {/* Message d'erreur */}
          {errorMessage ? (
            <ErrorMessage message={errorMessage} className="mb-4" />
          ) : null}

          {/* Bouton lier */}
          <AppButton
            title={t("settings.linkAccountButton")}
            onPress={handleLinkAccount}
            variant="secondary"
            loading={isLoading}
            icon="link"
          />

          {/* Lien connexion compte existant */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-base font-outfit-medium text-gray-500 dark:text-slate-400">
              Vous avez déjà un compte ?
            </Text>
            <Pressable onPress={() => router.push("/auth/login")}>
              <Text className="text-base font-outfit-bold text-amber-600 ml-2">
                Se connecter
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
