import { useState, useEffect, useMemo } from "react";
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
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useAuthStore, { type UserGender } from "@/stores/useAuthStore";
import useAvatarStore from "@/stores/useAvatarStore";
import useCoinsStore from "@/stores/useCoinsStore";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AvatarDrawer, GenderDrawer, AppDatePicker } from "@/components/ui";
import {
  getPresetAvatarsForGender,
  selectPresetAvatar,
  uploadCustomAvatar,
  removeAvatar,
  getAvatarSource,
} from "@/lib/avatarService";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const { user, updateProfile, isLoading, setAvatarLocal } = useAuthStore();
  const { unlockedAvatarIds, purchaseAvatar } = useAvatarStore();
  const { coins } = useCoinsStore();

  const [firstName, setFirstName] = useState(user?.name || "");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "");
  const [selectedGender, setSelectedGender] = useState<UserGender | null>(
    user?.gender || null,
  );
  const [avatarSource, setAvatarSource] = useState(
    getAvatarSource(user?.avatar_id, user?.avatar_url),
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const [isGenderDrawerOpen, setIsGenderDrawerOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const canEditGender = !(user?.genderLocked ?? false);
  const canEditBirthDate = !user?.birthDate;
  const avatarGenderFilter = selectedGender ?? user?.gender ?? null;
  const availableAvatarOptions = useMemo(
    () => getPresetAvatarsForGender(avatarGenderFilter),
    [avatarGenderFilter],
  );
  const selectedGenderLabel =
    selectedGender === "male"
      ? t("settings.genderMale")
      : selectedGender === "female"
        ? t("settings.genderFemale")
        : selectedGender === "not_specified"
          ? t("settings.genderNotSpecified")
          : t("settings.genderUnset");

  useEffect(() => {
    const nameChanged = firstName.trim() !== (user?.name || "").trim();
    const birthDateChanged = birthDate !== (user?.birthDate || "");
    const genderChanged =
      selectedGender !== null && selectedGender !== (user?.gender ?? null);
    setHasChanges(nameChanged || birthDateChanged || genderChanged);
  }, [
    firstName,
    birthDate,
    selectedGender,
    user?.name,
    user?.birthDate,
    user?.gender,
  ]);

  useEffect(() => {
    setFirstName(user?.name || "");
    setBirthDate(user?.birthDate || "");
    setSelectedGender(user?.gender || null);
    setAvatarSource(getAvatarSource(user?.avatar_id, user?.avatar_url));
  }, [
    user?.id,
    user?.name,
    user?.birthDate,
    user?.gender,
    user?.avatar_id,
    user?.avatar_url,
  ]);

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

        const uploadResult = await uploadCustomAvatar(
          result.assets[0].uri,
          user!.id,
        );

        if (uploadResult.success && uploadResult.url) {
          setAvatarSource({ uri: uploadResult.url });
          setAvatarLocal({ avatar_url: uploadResult.url, avatar_id: null });
          setSuccessMessage(t("settings.avatarUpdated"));
          setTimeout(() => setSuccessMessage(""), 3000);
          setIsAvatarSheetOpen(false);
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

    const updateData: {
      name?: string;
      birthDate?: string;
      gender?: UserGender;
    } = {};

    if (firstName.trim() !== (user?.name || "").trim()) {
      updateData.name = firstName.trim();
    }
    if (birthDate !== (user?.birthDate || "")) {
      updateData.birthDate = birthDate;
    }
    if (selectedGender !== null && selectedGender !== (user?.gender ?? null)) {
      updateData.gender = selectedGender;
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

  const handleSelectPresetAvatar = async (avatarId: string) => {
    try {
      setIsUploadingAvatar(true);
      setErrorMessage("");

      const result = await selectPresetAvatar(user!.id, avatarId);

      if (result.success) {
        const source = getAvatarSource(avatarId, null);
        setAvatarSource(source);
        setAvatarLocal({ avatar_id: avatarId, avatar_url: null });
        setSuccessMessage(t("settings.avatarUpdated"));
        setTimeout(() => setSuccessMessage(""), 3000);
        setIsAvatarSheetOpen(false);
      } else {
        setErrorMessage(result.error || t("settings.avatarUploadError"));
      }
    } catch (error: any) {
      console.error("❌ Error selecting avatar:", error);
      setErrorMessage(error.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      setErrorMessage("");

      const result = await removeAvatar(user!.id);
      if (result.success) {
        setAvatarSource(null);
        setAvatarLocal({ avatar_id: null, avatar_url: null });
        setSuccessMessage(t("settings.avatarUpdated"));
        setTimeout(() => setSuccessMessage(""), 3000);
        setIsAvatarSheetOpen(false);
      } else {
        setErrorMessage(result.error || t("settings.avatarUploadError"));
      }
    } catch (error: any) {
      console.error("❌ Remove avatar error:", error);
      setErrorMessage(error.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 dark:bg-slate-900">
      {/* Header */}
      <LinearGradient
        colors={appTheme.headerGradient}
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
        avatarOptions={availableAvatarOptions}
        unlockedAvatarIds={unlockedAvatarIds}
        coins={coins}
        onSelectAvatar={(avatarId) => handleSelectPresetAvatar(avatarId)}
        onPurchaseAvatar={(avatarId, price) => purchaseAvatar(avatarId, price)}
        onRemoveAvatar={avatarSource ? handleRemoveAvatar : undefined}
        isLoading={isUploadingAvatar}
      />

      <GenderDrawer
        visible={isGenderDrawerOpen}
        onClose={() => setIsGenderDrawerOpen(false)}
        selectedGender={selectedGender}
        onSelectGender={setSelectedGender}
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
            ) : avatarSource ? (
              <Image source={avatarSource} className="w-14 h-14 rounded-full" />
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

            {/* Genre */}
            <View className="p-4">
              <Text
                className="font-outfit-semibold uppercase mb-2 text-gray-500 dark:text-slate-400"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                {t("settings.gender")}
              </Text>

              <Pressable
                onPress={() => canEditGender && setIsGenderDrawerOpen(true)}
                disabled={!canEditGender}
                className="flex-row items-center rounded-xl px-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 h-14"
                style={{ opacity: canEditGender ? 1 : 0.6 }}
              >
                <MaterialIconsRound name="wc" size={22} color="#64748B" />
                <Text
                  className="flex-1 font-outfit-medium px-3 text-slate-800 dark:text-slate-100"
                  style={{ fontSize: 16 }}
                >
                  {selectedGenderLabel}
                </Text>
                <MaterialIconsRound
                  name={canEditGender ? "expand-more" : "lock"}
                  size={20}
                  color="#64748B"
                />
              </Pressable>

              <Text
                className="font-outfit-regular mt-2 px-1 text-gray-500 dark:text-slate-400"
                style={{ fontSize: 12 }}
              >
                {canEditGender
                  ? t("settings.genderEditableOnce")
                  : t("settings.genderLockedDesc")}
              </Text>
            </View>

            <View className="h-px mx-4 bg-gray-200 dark:bg-slate-700" />

            {/* Date de naissance */}
            <View className="p-4">
              {canEditBirthDate ? (
                <AppDatePicker
                  label={t("settings.birthDate")}
                  value={birthDate}
                  onChange={(date) => setBirthDate(date || "")}
                  containerClassName=""
                  maximumDate={new Date()}
                />
              ) : (
                <>
                  <Text
                    className="font-outfit-semibold uppercase mb-2 text-gray-500 dark:text-slate-400"
                    style={{ fontSize: 11, letterSpacing: 1 }}
                  >
                    {t("settings.birthDate")}
                  </Text>
                  <View
                    className="flex-row items-center rounded-xl px-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 h-14"
                    style={{ opacity: 0.6 }}
                  >
                    <MaterialIconsRound name="cake" size={22} color="#64748B" />
                    <Text
                      className="flex-1 font-outfit-medium px-3 text-slate-800 dark:text-slate-100"
                      style={{ fontSize: 16 }}
                    >
                      {birthDate}
                    </Text>
                    <MaterialIconsRound name="lock" size={18} color="#64748B" />
                  </View>
                  <Text
                    className="font-outfit-regular mt-2 px-1 text-gray-500 dark:text-slate-400"
                    style={{ fontSize: 12 }}
                  >
                    {t("settings.birthDateLockedDesc")}
                  </Text>
                </>
              )}
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
