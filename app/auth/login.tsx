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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppInput, AppButton, ErrorMessage } from "@/components/ui";
import useAuthStore from "@/stores/useAuthStore";
export default function LoginScreen() {
  const { signInWithEmail, isLoading } = useAuthStore();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const canGoBack = navigation.canGoBack();

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage(t("auth.loginEmailRequired"));
      return;
    }
    if (!password) {
      setErrorMessage(t("auth.loginPasswordRequired"));
      return;
    }

    const result = await signInWithEmail(email.trim(), password);

    if (result.success) {
      router.replace("/(tabs)");
    } else {
      let errorMsg = result.error || t("common.error");
      if (errorMsg.includes("Invalid login credentials")) {
        errorMsg = t("auth.loginInvalidCredentials");
      } else if (errorMsg.includes("Email not confirmed")) {
        errorMsg = t("auth.loginEmailNotConfirmed");
      } else if (errorMsg.includes("invalid email")) {
        errorMsg = t("auth.loginInvalidEmail");
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
          className="h-[45%] items-center justify-center relative"
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

          {/* Logo mosquée */}
          <View className="w-24 h-24 bg-white/10 rounded-2xl rotate-45 items-center justify-center border border-white/20">
            <View className="-rotate-45">
              <MaterialIconsRound name="mosque" size={48} color="#FCD34D" />
            </View>
          </View>

          <Text className="text-white font-outfit-bold text-4xl mt-6">
            {t("auth.appName")}
          </Text>
          <Text className="text-white/70 font-outfit-regular text-base mt-1">
            {t("auth.loginTagline")}
          </Text>
        </LinearGradient>

        {/* Formulaire */}
        <ScrollView
          className="flex-1 bg-gray-100 dark:bg-slate-900 -mt-8 rounded-t-3xl"
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 50,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-3xl font-outfit-bold text-slate-800 dark:text-slate-100 mb-2">
            {t("auth.loginWelcomeBack")}
          </Text>
          <Text className="text-lg font-outfit-regular text-gray-500 dark:text-slate-400 mb-8">
            {t("auth.loginEnterCredentials")}
          </Text>

          {/* Email */}
          <AppInput
            label={t("auth.email")}
            icon="mail"
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerClassName="mb-5"
          />

          {/* Mot de passe */}
          <AppInput
            label={t("auth.password")}
            icon="lock"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            containerClassName="mb-4"
          />

          {/* Mot de passe oublié */}
          <Pressable className="self-end mb-6">
            <Text
              className="text-base font-outfit-semibold"
              style={{ color: "#115E59" }}
            >
              {t("auth.loginForgotPassword")}
            </Text>
          </Pressable>

          {/* Message d'erreur */}
          {errorMessage ? (
            <ErrorMessage message={errorMessage} className="mb-4" />
          ) : null}

          {/* Bouton connexion */}
          <AppButton
            title={t("auth.loginButton")}
            onPress={handleLogin}
            variant="secondary"
            loading={isLoading}
          />

          {/* Lien inscription */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-base font-outfit-medium text-gray-500 dark:text-slate-400">
              {t("auth.loginNoAccount")}
            </Text>
            <Pressable onPress={() => router.push("/auth/register")}>
              <Text className="text-base font-outfit-bold text-amber-600 ml-2">
                {t("auth.loginSignUp")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
