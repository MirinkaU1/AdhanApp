// Drawer des options pour la lecture de sourate
import React from "react";
import { View, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText } from "@/components/ui";
import AppDrawer from "@/components/ui/AppDrawer";
import { SurahProgress } from "@/stores/useQuranStore";

interface SurahOptionsDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onMarkAsRead: () => void;
  onContinueLater: () => void;
  progress: SurahProgress | null;
  surahName: string;
}

interface OptionItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
}

function OptionItem({
  icon,
  title,
  subtitle,
  onPress,
  isDestructive,
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
          backgroundColor: isDestructive
            ? isDark
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(239, 68, 68, 0.1)"
            : isDark
              ? "rgba(17, 94, 89, 0.2)"
              : "rgba(17, 94, 89, 0.1)",
        }}
      >
        <MaterialIconsRound
          name={icon as any}
          size={20}
          color={isDestructive ? "#EF4444" : isDark ? "#5EEAD4" : appTheme.primary}
        />
      </View>
      <View className="flex-1">
        <AppText variant="body" className={isDestructive ? "text-red-500" : ""}>
          {title}
        </AppText>
      </View>
      <MaterialIconsRound
        name="chevron-right"
        size={20}
        color={isDark ? "#94A3B8" : "#64748B"}
      />
    </Pressable>
  );
}

export function SurahOptionsDrawer({
  isVisible,
  onClose,
  onMarkAsRead,
  onContinueLater,
  progress,
  surahName,
}: SurahOptionsDrawerProps) {
  const { t } = useTranslation();
  const isDark = useIsDark();

  return (
    <AppDrawer
      visible={isVisible}
      onClose={onClose}
      title={surahName}
      subtitle={
        progress ? `${progress.percentage}% ${t("quran.completed")}` : undefined
      }
      maxHeight="60%"
      showHandle={true}
      showCloseButton={true}
      closeButtonText={t("common.cancel")}
    >
      <View className="py-2">
        <OptionItem
          icon="check-circle"
          title={t("quran.markAsRead")}
          onPress={() => {
            onMarkAsRead();
            onClose();
          }}
        />

        <OptionItem
          icon="bookmark"
          title={t("quran.savePosition")}
          onPress={() => {
            onContinueLater();
            onClose();
          }}
        />

        <OptionItem
          icon="schedule"
          title={t("quran.readingStats")}
          onPress={() => {
            // TODO: Afficher les stats
            onClose();
          }}
        />

        <OptionItem
          icon="share"
          title={t("quran.share")}
          onPress={() => {
            // TODO: Partager
            onClose();
          }}
        />

        {progress?.isCompleted && (
          <OptionItem
            icon="replay"
            title={t("quran.readAgain")}
            onPress={() => {
              // TODO: Réinitialiser la progression
              onClose();
            }}
          />
        )}
      </View>
    </AppDrawer>
  );
}

export default SurahOptionsDrawer;
