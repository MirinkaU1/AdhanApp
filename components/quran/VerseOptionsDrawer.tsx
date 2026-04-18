// Drawer des options pour un verset spécifique
import React from "react";
import { View, Pressable, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText } from "@/components/ui";
import AppDrawer from "@/components/ui/AppDrawer";
import * as Haptics from "expo-haptics";
import { useQuranStore } from "@/stores/useQuranStore";

interface VerseOptionsDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  verseId: number;
  verseText: string;
  verseTranslation: string;
  surahId: number;
  surahName: string;
  surahTransliteration: string;
  isRead: boolean;
  onToggleRead: () => void;
}

interface OptionItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isActive?: boolean;
  danger?: boolean;
}

function OptionItem({
  icon,
  title,
  subtitle,
  onPress,
  isActive,
  danger,
}: OptionItemProps) {
  const isDark = useIsDark();
  const appTheme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 px-2 active:opacity-60"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#334155" : "#E2E8F0",
      }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
        style={{
          backgroundColor: danger
            ? isDark
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(239, 68, 68, 0.1)"
            : isActive
              ? isDark
                ? "rgba(17, 94, 89, 0.3)"
                : "rgba(17, 94, 89, 0.2)"
              : isDark
                ? "rgba(17, 94, 89, 0.2)"
                : "rgba(17, 94, 89, 0.1)",
        }}
      >
        <MaterialIconsRound
          name={icon as any}
          size={20}
          color={
            danger
              ? "#EF4444"
              : isActive
                ? appTheme.primary
                : isDark
                  ? "#5EEAD4"
                  : appTheme.primary
          }
        />
      </View>
      <View className="flex-1">
        <AppText
          variant="body"
          style={danger ? { color: "#EF4444" } : undefined}
        >
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" className="mt-1">
            {subtitle}
          </AppText>
        )}
      </View>
      {isActive && !danger && (
        <MaterialIconsRound name="check" size={20} color={appTheme.primary} />
      )}
    </Pressable>
  );
}

export function VerseOptionsDrawer({
  isVisible,
  onClose,
  verseId,
  verseText,
  verseTranslation,
  surahId,
  surahName,
  surahTransliteration,
  isRead,
  onToggleRead,
}: VerseOptionsDrawerProps) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const isFavorite = useQuranStore((state) =>
    state.isFavorite(surahId, verseId),
  );
  const addToFavorites = useQuranStore((state) => state.addToFavorites);
  const removeFromFavorites = useQuranStore((state) => state.removeFromFavorites);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${verseText}\n\n${verseTranslation}\n\n— ${surahName} (${t("quran.verse")} ${verseId})`,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erreur partage:", error);
    }
    onClose();
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`${verseText}\n\n${verseTranslation}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleMarkAsRead = () => {
    onToggleRead();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorites(surahId, verseId);
    } else {
      addToFavorites({
        surahId,
        surahName,
        surahTransliteration,
        verseNumber: verseId,
        verseText,
        verseTranslation,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <AppDrawer
      visible={isVisible}
      onClose={onClose}
      title={`${t("quran.verse")} ${verseId}`}
      subtitle={surahName}
      maxHeight="70%"
      showHandle={true}
      showCloseButton={true}
      closeButtonText={t("common.close")}
    >
      <View
        className="mx-4 mb-4 p-4 rounded-xl"
        style={{
          backgroundColor: isDark
            ? "rgba(17, 94, 89, 0.1)"
            : "rgba(17, 94, 89, 0.05)",
          borderWidth: 1,
          borderColor: isDark ? "#334155" : "#E2E8F0",
        }}
      >
        <AppText
          variant="body"
          className="text-right mb-2 font-amiri"
          style={{ writingDirection: "rtl" }}
        >
          {verseText}
        </AppText>
        <AppText variant="caption">{verseTranslation}</AppText>
      </View>

      <View className="py-2">
        <OptionItem
          icon={isRead ? "remove-done" : "check-circle-outline"}
          title={isRead ? t("quran.markAsUnread") : t("quran.markAsRead")}
          subtitle={isRead ? t("quran.markAsUnreadDesc") : t("quran.markAsReadDesc")}
          onPress={handleMarkAsRead}
          isActive={isRead}
        />

        <OptionItem
          icon={isFavorite ? "bookmark" : "bookmark-border"}
          title={isFavorite ? t("quran.removeFromFavorites") : t("quran.addToFavorites")}
          onPress={handleToggleFavorite}
          isActive={isFavorite}
        />

        <OptionItem
          icon="share"
          title={t("quran.shareVerse")}
          onPress={handleShare}
        />

        <OptionItem
          icon="content-copy"
          title={t("quran.copyVerse")}
          onPress={handleCopy}
        />
      </View>
    </AppDrawer>
  );
}

export default VerseOptionsDrawer;
