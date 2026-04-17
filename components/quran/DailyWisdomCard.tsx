import React, { useMemo } from "react";
import { View, Text, Pressable, Share } from "react-native";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText, AppCard } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { getDailyVerseByDay, getRandomDailyVerse } from "@/constants/QuranData";

interface DailyWisdomCardProps {
  onVersePress?: (surahNumber: number, verseNumber: number) => void;
  mode?: "daily" | "random";
  className?: string;
}

export function DailyWisdomCard({
  onVersePress,
  mode = "daily",
  className = "",
}: DailyWisdomCardProps) {
  const isDark = useIsDark();
  const { t } = useTranslation();

  const verse = useMemo(
    () => (mode === "daily" ? getDailyVerseByDay() : getRandomDailyVerse()),
    [mode],
  );

  const handlePress = () => {
    onVersePress?.(verse.surahNumber, verse.ayahNumber);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${verse.frenchText}" — ${verse.surahName} (${verse.ayahNumber})`,
      });
    } catch (error) {
      console.error("Erreur partage:", error);
    }
  };

  return (
    <AppCard className={`overflow-hidden ${className}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: isDark ? "rgba(217,119,6,0.2)" : "rgba(217,119,6,0.15)",
            }}
          >
            <MaterialIconsRound name="menu-book" size={20} color="#D97706" />
          </View>
          <AppText
            variant="bodyMedium"
            style={{ color: isDark ? "#FBBF24" : "#D97706" }}
          >
            {t("quran.verseOfDay")}
          </AppText>
        </View>

        <View
          className="px-2 py-1 rounded-full"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          }}
        >
          <Text className="text-[10px] font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark">
            {t("quran.quran")}
          </Text>
        </View>
      </View>

      {/* Contenu */}
      <Pressable onPress={handlePress} className="active:opacity-80">
        {/* Texte arabe */}
        <View
          className="mb-3 pb-3"
          style={{ borderBottomWidth: 1, borderBottomColor: isDark ? "#334155" : "#E2E8F0" }}
        >
          <Text
            className="text-center text-xl leading-loose"
            style={{
              fontFamily: "Amiri_400Regular",
              writingDirection: "rtl",
              color: isDark ? "#F8FAFC" : "#1E293B",
            }}
          >
            {verse.arabicText}
          </Text>
        </View>

        {/* Traduction */}
        <Text
          className="text-sm leading-6 font-outfit-regular mb-3"
          style={{ color: isDark ? "#cbd5e1" : "#475569" }}
        >
          « {verse.frenchText} »
        </Text>

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <View
            className="px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: isDark ? "rgba(17,94,89,0.15)" : "rgba(17,94,89,0.08)",
            }}
          >
            <Text
              className="text-xs font-outfit-medium"
              style={{ color: isDark ? "#5EEAD4" : "#115E59" }}
            >
              {verse.surahName} : {verse.ayahNumber}
            </Text>
          </View>

          <View
            className="px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: isDark ? "rgba(217,119,6,0.15)" : "rgba(217,119,6,0.1)",
            }}
          >
            <Text
              className="text-xs font-outfit-medium"
              style={{ color: isDark ? "#FBBF24" : "#D97706" }}
            >
              {verse.theme}
            </Text>
          </View>

          <Pressable
            onPress={handleShare}
            className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
            style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}
          >
            <MaterialIconsRound
              name="share"
              size={16}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>
        </View>
      </Pressable>
    </AppCard>
  );
}

export default DailyWisdomCard;
