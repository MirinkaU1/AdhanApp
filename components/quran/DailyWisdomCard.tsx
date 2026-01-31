import React, { useMemo } from "react";
import { View, Text, Pressable, Share } from "react-native";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText, AppCard } from "@/components/ui";
import { useTranslation } from "react-i18next";
import {
  DailyVerse,
  getDailyVerseByDay,
  getRandomDailyVerse,
} from "@/constants/QuranData";

// Hadiths quotidiens
const DAILY_HADITHS = [
  {
    text: "Les actes ne valent que par les intentions. Chacun n'obtient que ce qu'il s'est proposé.",
    source: "Bukhari & Muslim",
  },
  {
    text: "Le croyant est le miroir du croyant.",
    source: "Abu Dawud",
  },
  {
    text: "Le meilleur parmi vous est celui qui apprend le Coran et l'enseigne.",
    source: "Bukhari",
  },
  {
    text: "N'enviez-vous pas celui qui fait plus de dhikr que vous ?",
    source: "Muslim",
  },
  {
    text: "La prière est le pilier de la religion. Celui qui l'établit a établi la religion.",
    source: "Hadith",
  },
  {
    text: "Allah aime, lorsqu'un de vous fait un travail, qu'il le fasse avec excellence.",
    source: "Bayhaqi",
  },
];

type WisdomType = "verse" | "hadith";

interface DailyWisdomCardProps {
  onVersePress?: (surahId: string, verseNumber: number) => void;
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

  // Déterminer si on affiche un verset ou un hadith (alternance journalière)
  const today = new Date();
  const dayOfMonth = today.getDate();
  const wisdomType: WisdomType = dayOfMonth % 2 === 0 ? "verse" : "hadith";

  // Récupérer le contenu
  const content = useMemo(() => {
    if (wisdomType === "verse") {
      const verse =
        mode === "daily" ? getDailyVerseByDay() : getRandomDailyVerse();
      return {
        type: "verse" as const,
        data: verse,
        surahId: verse.surahId,
        verseNumber: verse.ayahNumber,
      };
    } else {
      const hadithIndex = dayOfMonth % DAILY_HADITHS.length;
      return {
        type: "hadith" as const,
        data: DAILY_HADITHS[hadithIndex],
        surahId: null,
        verseNumber: null,
      };
    }
  }, [wisdomType, mode, dayOfMonth]);

  const handlePress = () => {
    if (
      content.type === "verse" &&
      onVersePress &&
      content.surahId &&
      content.verseNumber
    ) {
      onVersePress(content.surahId, content.verseNumber);
    }
  };

  const handleShare = async () => {
    try {
      if (content.type === "verse") {
        const verse = content.data as DailyVerse;
        await Share.share({
          message: `"${verse.frenchText}" - ${verse.surahName} (${verse.ayahNumber})`,
        });
      } else {
        const hadith = content.data as { text: string; source: string };
        await Share.share({
          message: `"${hadith.text}" - ${hadith.source}`,
        });
      }
    } catch (error) {
      console.error("Erreur partage:", error);
    }
  };

  const isVerse = content.type === "verse";
  const verse = isVerse ? (content.data as DailyVerse) : null;
  const hadith = !isVerse
    ? (content.data as { text: string; source: string })
    : null;

  return (
    <AppCard className={`overflow-hidden ${className}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: isVerse
                ? isDark
                  ? "rgba(217, 119, 6, 0.2)"
                  : "rgba(217, 119, 6, 0.15)"
                : isDark
                  ? "rgba(17, 94, 89, 0.2)"
                  : "rgba(17, 94, 89, 0.15)",
            }}
          >
            <MaterialIconsRound
              name={isVerse ? "menu-book" : "format-quote"}
              size={20}
              color={isVerse ? "#D97706" : "#115E59"}
            />
          </View>
          <AppText
            variant="bodyMedium"
            style={{
              color: isVerse
                ? isDark
                  ? "#FBBF24"
                  : "#D97706"
                : isDark
                  ? "#5EEAD4"
                  : "#115E59",
            }}
          >
            {isVerse ? t('quran.verseOfDay') : t('quran.hadithOfDay')}
          </AppText>
        </View>
        <View
          className="px-2 py-1 rounded-full"
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <Text className="text-[10px] font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark">
            {isVerse ? t('quran.quran') : t('quran.sunna')}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Pressable onPress={isVerse ? handlePress : undefined}>
        {isVerse && verse ? (
          <>
            {/* Arabic Text */}
            <View
              className="mb-3 pb-3"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "#334155" : "#E2E8F0",
              }}
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

            {/* French Translation */}
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
                  backgroundColor: isDark
                    ? "rgba(17, 94, 89, 0.15)"
                    : "rgba(17, 94, 89, 0.08)",
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
                  backgroundColor: isDark
                    ? "rgba(217, 119, 6, 0.15)"
                    : "rgba(217, 119, 6, 0.1)",
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
                style={{
                  backgroundColor: isDark ? "#334155" : "#F1F5F9",
                }}
              >
                <MaterialIconsRound
                  name="share"
                  size={16}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {/* Hadith Text */}
            <Text
              className="text-sm leading-6 font-outfit-regular mb-3"
              style={{ color: isDark ? "#cbd5e1" : "#475569" }}
            >
              « {hadith?.text} »
            </Text>

            {/* Footer */}
            <View
              className="px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: isDark
                  ? "rgba(17, 94, 89, 0.15)"
                  : "rgba(17, 94, 89, 0.08)",
              }}
            >
              <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium">
                — {hadith?.source}
              </Text>
            </View>
            <Pressable
              onPress={handleShare}
              className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
              style={{
                backgroundColor: isDark ? "#334155" : "#F1F5F9",
              }}
            >
              <MaterialIconsRound
                name="share"
                size={16}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </Pressable>
          </>
        )}
      </Pressable>
    </AppCard>
  );
}

export default DailyWisdomCard;
