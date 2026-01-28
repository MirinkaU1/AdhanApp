import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useAuthStore from "@/stores/useAuthStore";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, updateProfile, isLoading } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.name || "");
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setHasChanges(firstName.trim() !== (user?.name || "").trim());
  }, [firstName, user?.name]);

  const handleSave = async () => {
    if (!hasChanges || !firstName.trim()) return;

    setErrorMessage("");
    setSuccessMessage("");

    const result = await updateProfile({ name: firstName.trim() });

    if (result.success) {
      setSuccessMessage(t("settings.profileUpdated"));
      setHasChanges(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } else {
      setErrorMessage(result.error || t("settings.profileUpdateError"));
    }
  };

  return (
    <View className="flex-1 bg-gray-100 dark:bg-slate-900">
      {/* Header */}
      <LinearGradient
        colors={["#115E59", "#0d4542"]}
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
              {t("settings.profileTitle")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("settings.profileSubtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(217, 119, 6, 0.2)" }}
          >
            <MaterialIconsRound name="person" size={26} color="#D97706" />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingVertical: 24,
            paddingHorizontal: 16,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Message de succès */}
          {successMessage ? (
            <View className="flex-row items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-emerald-500/20">
              <MaterialIconsRound
                name="check-circle"
                size={20}
                color="#10B981"
              />
              <Text
                className="font-outfit-medium flex-1 text-emerald-500"
                style={{ fontSize: 14 }}
              >
                {successMessage}
              </Text>
            </View>
          ) : null}

          {/* Message d'erreur */}
          {errorMessage ? (
            <View className="flex-row items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-red-500/20">
              <MaterialIconsRound name="error" size={20} color="#EF4444" />
              <Text
                className="font-outfit-medium flex-1 text-red-500"
                style={{ fontSize: 14 }}
              >
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Formulaire */}
          <View className="rounded-3xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            {/* Prénom */}
            <View className="p-4">
              <Text
                className="font-outfit-semibold uppercase mb-2 text-gray-500 dark:text-slate-400"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                {t("settings.firstName")}
              </Text>
              <View className="flex-row items-center rounded-xl px-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 h-14">
                <MaterialIconsRound
                  name="person-outline"
                  size={22}
                  color="#64748B"
                />
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t("settings.firstNamePlaceholderProfile")}
                  placeholderTextColor="#64748B"
                  className="flex-1 font-outfit-medium px-3 text-slate-800 dark:text-slate-100"
                  style={{ fontSize: 16, height: "100%" }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {firstName !== user?.name && firstName.trim() ? (
                  <View className="w-6 h-6 rounded-full items-center justify-center bg-amber-600">
                    <MaterialIconsRound name="edit" size={14} color="#fff" />
                  </View>
                ) : null}
              </View>
            </View>

            {/* Séparateur avec info email si disponible */}
            {user?.email ? (
              <>
                <View className="h-px mx-4 bg-gray-200 dark:bg-slate-700" />
                <View className="p-4">
                  <Text
                    className="font-outfit-semibold uppercase mb-2 text-gray-500 dark:text-slate-400"
                    style={{ fontSize: 11, letterSpacing: 1 }}
                  >
                    Email
                  </Text>
                  <View className="flex-row items-center rounded-xl px-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 h-14 opacity-60">
                    <MaterialIconsRound
                      name="mail-outline"
                      size={22}
                      color="#64748B"
                    />
                    <Text
                      className="flex-1 font-outfit-medium px-3 text-gray-500 dark:text-slate-400"
                      style={{ fontSize: 16 }}
                    >
                      {user.email}
                    </Text>
                    <MaterialIconsRound name="lock" size={18} color="#64748B" />
                  </View>
                  <Text
                    className="font-outfit-regular mt-2 px-1 text-gray-500 dark:text-slate-400"
                    style={{ fontSize: 12 }}
                  >
                    {t("settings.emailNotEditable")}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Bouton Enregistrer */}
          <Pressable
            onPress={handleSave}
            disabled={!hasChanges || isLoading}
            className="mt-6 rounded-2xl overflow-hidden"
            style={{ opacity: hasChanges && !isLoading ? 1 : 0.5 }}
          >
            <LinearGradient
              colors={
                hasChanges ? ["#D97706", "#B45309"] : ["#9CA3AF", "#6B7280"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIconsRound name="save" size={22} color="#fff" />
              )}
              <Text
                className="font-outfit-bold text-white"
                style={{ fontSize: 16 }}
              >
                {isLoading ? t("settings.saving") : t("settings.saveChanges")}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
