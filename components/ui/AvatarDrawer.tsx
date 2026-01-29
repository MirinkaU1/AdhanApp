import { useState, useMemo } from "react";
import {
  Pressable,
  View,
  Text,
  Image,
  ImageSourcePropType,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import AppDrawer from "./AppDrawer";
import AppTabs, { TabOption } from "./AppTabs";

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

  // Tabs configuration
  const tabs: TabOption<"avatars" | "gallery">[] = useMemo(
    () => [
      { key: "avatars", label: t("settings.tabAvatars", "Avatars") },
      { key: "gallery", label: t("settings.tabGallery", "Galerie") },
    ],
    [t],
  );

  // Debug: vérifier les props reçues
  console.log("🎨 AvatarDrawer render:", {
    visible,
    avatarOptionsLength: avatarOptions?.length,
    activeTab,
    avatarOptions: avatarOptions,
  });

  if (!visible) return null;

  return (
    <AppDrawer
      visible={visible}
      onClose={onClose}
      title={t("settings.chooseAvatar")}
      subtitle={t("settings.avatarDrawerSubtitle", "Personnalise ton profil")}
      closeButtonText={t("common.close", "Fermer")}
    >
      {/* Tabs */}
      <AppTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

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
          <MaterialIconsRound name="delete-outline" size={20} color="#EF4444" />
          <Text className="font-outfit-semibold text-red-500">
            {t("settings.removeAvatar", "Supprimer l'avatar")}
          </Text>
        </Pressable>
      ) : null}
    </AppDrawer>
  );
}
