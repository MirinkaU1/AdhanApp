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
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { Asset } from "expo-asset";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useAuthStore from "@/stores/useAuthStore";
import { useIsDark } from "@/components/useColorScheme";
import { AvatarDrawer } from "@/components/ui";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { user, updateProfile, uploadAvatar, isLoading } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.name || "");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "");
  const [avatarUri, setAvatarUri] = useState(user?.avatar || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Avatars locaux
  const avatarOptions = [
    { id: "01", source: require("@/assets/images/avatars/01.png") },
    { id: "02", source: require("@/assets/images/avatars/02.png") },
    { id: "03", source: require("@/assets/images/avatars/03.png") },
    { id: "04", source: require("@/assets/images/avatars/04.png") },
    { id: "05", source: require("@/assets/images/avatars/05.png") },
    { id: "06", source: require("@/assets/images/avatars/06.png") },
  ];

  // Debug: vérifier que les avatars sont chargés
  useEffect(() => {
    console.log("👤 Avatar options loaded:", avatarOptions.length);
    avatarOptions.forEach((avatar) => {
      console.log(`Avatar ${avatar.id}:`, avatar.source);
    });
  }, []);

  useEffect(() => {
    const nameChanged = firstName.trim() !== (user?.name || "").trim();
    const birthDateChanged = birthDate !== (user?.birthDate || "");
    setHasChanges(nameChanged || birthDateChanged);
  }, [firstName, birthDate, user?.name, user?.birthDate]);

  const pickImage = async () => {
    try {
      // Demander les permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("settings.permissionRequired"),
          t("settings.photoPermissionDesc"),
        );
        return;
      }

      // Ouvrir le sélecteur d'images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingAvatar(true);
        setErrorMessage("");

        const uploadResult = await uploadAvatar(result.assets[0].uri);

        if (uploadResult.success && uploadResult.url) {
          setAvatarUri(uploadResult.url);
          setSuccessMessage(t("settings.avatarUpdated"));
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setErrorMessage(
            uploadResult.error || t("settings.avatarUploadError"),
          );
        }

        setIsUploadingAvatar(false);
      }
    } catch (error: any) {
      console.error("Image picker error:", error);
      setErrorMessage(error.message);
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setErrorMessage("");
    setSuccessMessage("");

    const updateData: { name?: string; birthDate?: string } = {};

    if (firstName.trim() !== (user?.name || "").trim()) {
      updateData.name = firstName.trim();
    }
    if (birthDate !== (user?.birthDate || "")) {
      updateData.birthDate = birthDate;
    }

    console.log(
      "[ProfileScreen] Sending update:",
      updateData,
      "birthDate state:",
      birthDate,
    );

    const result = await updateProfile(updateData);

    if (result.success) {
      setSuccessMessage(t("settings.profileUpdated"));
      setHasChanges(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } else {
      setErrorMessage(result.error || t("settings.profileUpdateError"));
    }
  };

  // Formater la date de naissance pour l'affichage (JJ-MM-AAAA)
  const formatBirthDateInput = (text: string) => {
    // Supprimer tout sauf les chiffres
    const numbers = text.replace(/\D/g, "");

    // Formater en JJ-MM-AAAA
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4, 8)}`;
    }
  };

  const handleSelectAvatar = async (
    source: string | import("react-native").ImageSourcePropType,
  ) => {
    try {
      setIsUploadingAvatar(true);
      setErrorMessage("");

      let resolvedUri: string | undefined;

      if (typeof source === "string") {
        resolvedUri = source;
      } else {
        const asset = Asset.fromModule(source as number);
        if (!asset.localUri) {
          await asset.downloadAsync();
        }
        resolvedUri = asset.localUri || asset.uri;
      }

      if (!resolvedUri) {
        setErrorMessage(t("settings.avatarUploadError"));
        setIsUploadingAvatar(false);
        return;
      }

      const uploadResult = await uploadAvatar(resolvedUri);

      if (uploadResult.success && uploadResult.url) {
        setAvatarUri(uploadResult.url);
        setSuccessMessage(t("settings.avatarUpdated"));
        setTimeout(() => setSuccessMessage(""), 3000);
        setIsAvatarSheetOpen(false);
      } else {
        setErrorMessage(uploadResult.error || t("settings.avatarUploadError"));
      }
    } catch (error: any) {
      console.error("Avatar select error:", error);
      setErrorMessage(error.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      setErrorMessage("");

      const result = await updateProfile({ avatar: null });
      if (result.success) {
        setAvatarUri("");
        setSuccessMessage(t("settings.avatarUpdated"));
        setTimeout(() => setSuccessMessage(""), 3000);
        setIsAvatarSheetOpen(false);
      } else {
        setErrorMessage(result.error || t("settings.avatarUploadError"));
      }
    } catch (error: any) {
      console.error("Remove avatar error:", error);
      setErrorMessage(error.message);
    } finally {
      setIsUploadingAvatar(false);
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
          {/* Icône profil dans le header */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(217, 119, 6, 0.2)" }}
          >
            <MaterialIconsRound name="person" size={26} color="#D97706" />
          </View>
        </View>
      </LinearGradient>

      {/* Drawer Avatars */}
      <AvatarDrawer
        visible={isAvatarSheetOpen}
        onClose={() => setIsAvatarSheetOpen(false)}
        onPickImage={pickImage}
        avatarOptions={avatarOptions}
        onSelectAvatar={handleSelectAvatar}
        onRemoveAvatar={avatarUri ? handleRemoveAvatar : undefined}
        isLoading={isUploadingAvatar}
      />

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

          {/* Action avatar visible */}
          <Pressable
            onPress={() => setIsAvatarSheetOpen(true)}
            className="mb-6 flex-row items-center gap-4 p-4 rounded-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <View className="w-14 h-14 rounded-full items-center justify-center bg-gray-200 dark:bg-slate-700">
                <ActivityIndicator size="small" color="#D97706" />
              </View>
            ) : avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                className="w-14 h-14 rounded-full"
              />
            ) : (
              <View className="w-14 h-14 rounded-full items-center justify-center bg-amber-100 dark:bg-amber-900/30">
                <MaterialIconsRound name="person" size={26} color="#D97706" />
              </View>
            )}
            <View className="flex-1">
              <Text className="font-outfit-semibold text-slate-800 dark:text-slate-100">
                {t("settings.chooseAvatar")}
              </Text>
              <Text className="text-sm font-outfit-regular text-gray-500 dark:text-slate-400">
                {t("settings.chooseFromGallery")}
              </Text>
            </View>
            <MaterialIconsRound
              name="chevron-right"
              size={24}
              color="#94A3B8"
            />
          </Pressable>

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

            {/* Séparateur */}
            <View className="h-px mx-4 bg-gray-200 dark:bg-slate-700" />

            {/* Date de naissance */}
            <View className="p-4">
              <Text
                className="font-outfit-semibold uppercase mb-2 text-gray-500 dark:text-slate-400"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                {t("settings.birthDate")}
              </Text>
              <View className="flex-row items-center rounded-xl px-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 h-14">
                <MaterialIconsRound name="cake" size={22} color="#64748B" />
                <TextInput
                  value={birthDate}
                  onChangeText={(text) =>
                    setBirthDate(formatBirthDateInput(text))
                  }
                  placeholder="JJ-MM-AAAA"
                  placeholderTextColor="#64748B"
                  className="flex-1 font-outfit-medium px-3 text-slate-800 dark:text-slate-100"
                  style={{ fontSize: 16, height: "100%" }}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                {birthDate !== (user?.birthDate || "") &&
                birthDate.length === 10 ? (
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
