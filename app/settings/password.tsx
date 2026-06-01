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
import { useAppTheme } from "@/hooks/useAppTheme";

export default function PasswordScreen() {
  const { t } = useTranslation();
  const appTheme = useAppTheme();
  const { changePassword, isLoading } = useAuthStore();
  const navigation = useNavigation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canGoBack = navigation.canGoBack();

  const handleChangePassword = async () => {
    setErrorMessage("");

    // Validation mot de passe actuel
    if (!currentPassword) {
      setErrorMessage(t("settings.currentPasswordRequired"));
      return;
    }

    // Validation nouveau mot de passe
    if (newPassword.length < 8) {
      setErrorMessage(t("settings.passwordTooShort"));
      return;
    }

    // Validation confirmation
    if (newPassword !== confirmPassword) {
      setErrorMessage(t("settings.passwordMismatch"));
      return;
    }

    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      setSuccessMessage(t("settings.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        router.back();
      }, 2000);
    } else {
      // Gérer l'erreur spécifique du mot de passe actuel incorrect
      if (result.error === "INVALID_CURRENT_PASSWORD") {
        setErrorMessage(t("settings.currentPasswordInvalid"));
      } else {
        setErrorMessage(result.error || t("settings.passwordChangeError"));
      }
    }
  };

  // Indicateur de force du mot de passe
  const getPasswordStrength = () => {
    if (newPassword.length === 0) return null;
    if (newPassword.length < 6)
      return { level: 1, label: "Trop court", color: "#EF4444" };
    if (newPassword.length < 8)
      return { level: 2, label: "Acceptable", color: "#F59E0B" };
    if (newPassword.length < 12)
      return { level: 3, label: "Bon", color: "#22C55E" };
    return { level: 4, label: "Excellent", color: "#16A34A" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <View className="flex-1 bg-gray-100 dark:bg-slate-900">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <LinearGradient
          colors={appTheme.headerGradient}
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

          {/* Icône cadenas */}
          <View className="w-20 h-20 bg-white/10 rounded-2xl rotate-45 items-center justify-center border border-white/20">
            <View className="-rotate-45">
              <MaterialIconsRound name="lock" size={40} color="#FCD34D" />
            </View>
          </View>

          <Text className="text-white font-outfit-bold text-2xl mt-4">
            {t("settings.passwordTitle")}
          </Text>
          <Text className="text-white/70 font-outfit-regular text-sm mt-1">
            {t("settings.passwordSubtitle")}
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
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-6 flex-row items-start gap-3 border border-blue-200 dark:border-blue-800">
            <MaterialIconsRound name="security" size={20} color="#3B82F6" />
            <Text className="flex-1 text-blue-800 dark:text-blue-200 font-outfit-regular text-sm leading-5">
              {t("settings.passwordSecurityInfo")}
            </Text>
          </View>

          {/* Mot de passe actuel */}
          <AppInput
            label={t("settings.currentPassword")}
            icon="lock-open"
            placeholder={t("settings.currentPasswordPlaceholder")}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            isPassword
            returnKeyType="next"
            containerClassName="mb-5"
          />

          {/* Séparateur */}
          <View className="flex-row items-center gap-3 mb-5">
            <View className="flex-1 h-px bg-gray-300 dark:bg-slate-700" />
            <Text className="text-gray-500 dark:text-gray-400 font-outfit-regular text-xs">
              {t("settings.newPasswordSection")}
            </Text>
            <View className="flex-1 h-px bg-gray-300 dark:bg-slate-700" />
          </View>

          {/* Nouveau mot de passe */}
          <AppInput
            label={t("settings.newPassword")}
            icon="lock"
            placeholder={t("settings.newPasswordPlaceholder")}
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
            returnKeyType="next"
            containerClassName="mb-2"
          />

          {/* Indicateur de force */}
          {passwordStrength && (
            <View className="mb-5">
              <View className="flex-row gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    className="flex-1 h-1 rounded-full"
                    style={{
                      backgroundColor:
                        level <= passwordStrength.level
                          ? passwordStrength.color
                          : "#E5E7EB",
                    }}
                  />
                ))}
              </View>
              <Text
                className="text-xs font-outfit-medium ml-1"
                style={{ color: passwordStrength.color }}
              >
                {passwordStrength.label}
              </Text>
            </View>
          )}

          {/* Confirmer mot de passe */}
          <AppInput
            label={t("settings.confirmNewPassword")}
            icon="lock"
            placeholder={t("settings.confirmNewPasswordPlaceholder")}
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

          {/* Bouton changer */}
          <AppButton
            title={t("settings.changePasswordButton")}
            onPress={handleChangePassword}
            variant="secondary"
            loading={isLoading}
            icon="lock"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
