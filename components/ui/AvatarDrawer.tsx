import { useState } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

interface AvatarOption {
  id: string;
  source: ImageSourcePropType;
}

interface AvatarDrawerProps {
  visible: boolean;
  onClose: () => void;
  onPickImage: () => void;
  avatarOptions: AvatarOption[];
  onSelectAvatar: (source: ImageSourcePropType) => void;
  onRemoveAvatar?: () => void;
  isLoading?: boolean;
}

export default function AvatarDrawer({
  visible,
  onClose,
  onPickImage,
  avatarOptions = [],
  onSelectAvatar,
  onRemoveAvatar,
  isLoading = false,
}: AvatarDrawerProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"avatars" | "gallery">("avatars");

  // Debug: vérifier les props reçues
  console.log("🎨 AvatarDrawer render:", {
    visible,
    avatarOptionsLength: avatarOptions?.length,
    activeTab,
    avatarOptions: avatarOptions,
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop avec animation */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Drawer animé */}
        <Animated.View
          entering={SlideInDown.duration(300).damping(20)}
          exiting={SlideOutDown.duration(250)}
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl"
          style={{ maxHeight: "75%", paddingBottom: 0 }}
        >
          <ScrollView
            className="px-5 pt-4"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Handle indicator */}
            <View className="items-center mb-4">
              <View className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-slate-700" />
            </View>
            <Text className="text-lg font-outfit-bold text-slate-800 dark:text-slate-100">
              {t("settings.chooseAvatar")}
            </Text>
            <Text className="text-sm font-outfit-regular text-gray-500 dark:text-slate-400 mt-1">
              {t("settings.avatarDrawerSubtitle", "Personnalise ton profil")}
            </Text>

            {/* Tabs */}
            <View className="flex-row mt-4 bg-gray-100 dark:bg-slate-800 rounded-2xl p-1">
              <Pressable
                onPress={() => setActiveTab("avatars")}
                className={`flex-1 py-2 rounded-xl ${
                  activeTab === "avatars"
                    ? "bg-white dark:bg-slate-900"
                    : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-center font-outfit-semibold ${
                    activeTab === "avatars"
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {t("settings.tabAvatars", "Avatars")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("gallery")}
                className={`flex-1 py-2 rounded-xl ${
                  activeTab === "gallery"
                    ? "bg-white dark:bg-slate-900"
                    : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-center font-outfit-semibold ${
                    activeTab === "gallery"
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {t("settings.tabGallery", "Galerie")}
                </Text>
              </Pressable>
            </View>

            {activeTab === "gallery" ? (
              <View className="mt-4">
                <Pressable
                  onPress={onPickImage}
                  className="flex-row items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-800"
                  disabled={isLoading}
                >
                  <MaterialIconsRound
                    name="photo-library"
                    size={22}
                    color="#0F766E"
                  />
                  <Text className="font-outfit-medium text-slate-800 dark:text-slate-100">
                    {t("settings.chooseFromGallery")}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="mt-4 mb-4">
                <Text className="text-sm font-outfit-semibold uppercase text-gray-500 dark:text-slate-400 mb-2">
                  {t("settings.avatars")}
                </Text>
                {(() => {
                  console.log("🔍 Avatar tab render check:", {
                    hasAvatarOptions: !!avatarOptions,
                    length: avatarOptions?.length,
                    isEmpty: !avatarOptions || avatarOptions.length === 0,
                  });
                  return null;
                })()}
                {!avatarOptions || avatarOptions.length === 0 ? (
                  <Text className="text-sm text-gray-500 dark:text-slate-400">
                    {t("settings.noAvatars")}
                  </Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                  >
                    <View className="flex-row gap-4">
                      {avatarOptions.map((avatar) => (
                        <Pressable
                          key={avatar.id}
                          onPress={() => {
                            console.log(
                              "🎨 Avatar selected:",
                              avatar.id,
                              avatar.source,
                            );
                            onSelectAvatar(avatar.source);
                          }}
                          className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700"
                          disabled={isLoading}
                        >
                          <Image
                            source={avatar.source}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                            onError={() => {
                              console.error(
                                "❌ Image load error for avatar:",
                                avatar.id,
                              );
                            }}
                            onLoad={() => {
                              console.log("✅ Image loaded:", avatar.id);
                            }}
                          />
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}

            {onRemoveAvatar ? (
              <Pressable
                onPress={onRemoveAvatar}
                className="mt-5 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10"
                disabled={isLoading}
              >
                <MaterialIconsRound
                  name="delete-outline"
                  size={20}
                  color="#EF4444"
                />
                <Text className="font-outfit-semibold text-red-500">
                  {t("settings.removeAvatar", "Supprimer l'avatar")}
                </Text>
              </Pressable>
            ) : null}

            <Pressable onPress={onClose} className="my-6 items-center">
              <Text className="text-base font-outfit-semibold text-amber-600">
                {t("common.close", "Fermer")}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
