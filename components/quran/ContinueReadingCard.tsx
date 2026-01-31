import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText, AppCard } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { useQuranStore } from "@/stores/useQuranStore";

// Mapping des noms arabes des sourates principales
const SURAH_ARABIC_NAMES: Record<number, string> = {
  1: "الفاتحة",
  2: "البقرة",
  3: "آل عمران",
  4: "النساء",
  5: "المائدة",
  6: "الأنعام",
  7: "الأعراف",
  8: "الأنفال",
  9: "التوبة",
  10: "يونس",
  18: "الكهف",
  67: "الملك",
  94: "الشرح",
  112: "الإخلاص",
  113: "الفلق",
  114: "الناس",
};

// Petit méta-données des sourates (utilisées si disponibles)
const SURAH_META: Record<
  number,
  { english?: string; arabic?: string; verses?: number }
> = {
  1: { english: "Al-Fatiha", arabic: "الفاتحة", verses: 7 },
  2: { english: "Al-Baqara", arabic: "البقرة" },
  3: { english: "Al-Imran", arabic: "آل عمران" },
  4: { english: "An-Nisa'", arabic: "النساء" },
  5: { english: "Al-Ma'idah", arabic: "المائدة" },
  6: { english: "Al-An'am", arabic: "الأنعام" },
  7: { english: "Al-A'raf", arabic: "الأعراف" },
  8: { english: "Al-Anfal", arabic: "الأنفال" },
  9: { english: "At-Tawbah", arabic: "التوبة" },
  10: { english: "Yunus", arabic: "يونس" },
  18: { english: "Al-Kahf", arabic: "الكهف" },
  67: { english: "Al-Mulk", arabic: "الملك" },
  94: { english: "Ash-Sharh", arabic: "الشرح" },
  112: { english: "Al-Ikhlas", arabic: "الإخلاص" },
  113: { english: "Al-Falaq", arabic: "الفلق" },
  114: { english: "An-Nas", arabic: "الناس" },
};

export function ContinueReadingCard() {
  const isDark = useIsDark();
  const { t } = useTranslation();
  const router = useRouter();

  // Utiliser directement le store - c'est instantané car déjà en mémoire
  const { getLastReading } = useQuranStore();
  const lastReading = getLastReading();

  // Si pas de lecture en cours, afficher une carte par défaut (Al-Fatiha)
  const displayReading = lastReading || {
    surahId: 1,
    // utiliser les données des sourates si disponibles
    surahName: SURAH_META[1]?.english || "Al-Fatiha",
    currentVerse: 1,
    totalVerses: 7,
    percentage: 0,
    lastReadAt: new Date().toISOString(),
    isCompleted: false,
    versesRead: [],
  };

  const progress = displayReading.percentage;
  const versesRemaining =
    displayReading.totalVerses - displayReading.currentVerse;

  // Nom arabe depuis le mapping (ou on pourrait l'ajouter au store)
  const surahNameAr =
    SURAH_ARABIC_NAMES[displayReading.surahId] || displayReading.surahName;

  const surahNameEn =
    SURAH_META[displayReading.surahId]?.english || displayReading.surahName;

  const handlePress = () => {
    router.push({
      pathname: `/quran/reader/${displayReading.surahId}` as any,
      params: { verse: displayReading.currentVerse.toString() },
    });
  };

  return (
    <AppCard className="overflow-hidden rounded-3xl p-0">
      {/* Content */}
      <View>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 pr-4">
            <Text
              className="text-xl text-text-primary-light dark:text-text-primary-dark"
              style={{ fontFamily: "Amiri_400Regular" }}
            >
              {surahNameAr}
            </Text>
            <AppText variant="caption" className="mt-1">
              {surahNameEn}
            </AppText>
          </View>
          <View
            className="px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: isDark
                ? "rgba(17, 94, 89, 0.2)"
                : "rgba(17, 94, 89, 0.1)",
            }}
          >
            <Text
              className="text-xs font-outfit-medium"
              style={{ color: isDark ? "#5EEAD4" : "#115E59" }}
            >
              {t("quran.verse")} {displayReading.currentVerse}/
              {displayReading.totalVerses}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="mt-2">
          <View
            className="h-2 rounded-full overflow-hidden"
            style={{
              backgroundColor: isDark ? "#334155" : "#E2E8F0",
            }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: "#115E59",
              }}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            <AppText variant="label">
              {progress}% {t("quran.completed")}
            </AppText>
            <AppText variant="label">
              {versesRemaining} {t("quran.versesRemaining")}
            </AppText>
          </View>
        </View>

        {/* Action button */}
        <Pressable
          onPress={handlePress}
          className="mt-4 py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 active:scale-95"
          style={{
            backgroundColor: isDark
              ? "rgba(17, 94, 89, 0.2)"
              : "rgba(17, 94, 89, 0.1)",
          }}
        >
          <MaterialIconsRound
            name="play-arrow"
            size={18}
            color={isDark ? "#5EEAD4" : "#115E59"}
          />
          <Text
            className="font-outfit-semibold"
            style={{ color: isDark ? "#5EEAD4" : "#115E59" }}
          >
            {lastReading ? t("quran.resume") : t("quran.start")}
          </Text>
        </Pressable>
      </View>
    </AppCard>
  );
}

export default ContinueReadingCard;
