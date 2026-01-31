import React, { useRef, useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIsDark } from "@/components/useColorScheme";
import { AppText } from "@/components/ui";
import AppDrawer from "@/components/ui/AppDrawer";
import { useTranslation } from "react-i18next";
import { loadSurah, QuranSurah } from "@/utils/quranLoader";

interface SurahReaderDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  surahNumber?: number;
  targetVerseNumber?: number;
  language?: string;
}

export function SurahReaderDrawer({
  isVisible,
  onClose,
  surahNumber = 1,
  targetVerseNumber,
  language = "fr",
}: SurahReaderDrawerProps) {
  const isDark = useIsDark();
  const { t, i18n } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [surah, setSurah] = useState<QuranSurah | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Détecter la langue actuelle
  const currentLanguage = i18n.language.startsWith("en") ? "en" : "fr";

  // Charger la sourate quand le drawer s'ouvre
  useEffect(() => {
    if (isVisible) {
      setIsLoading(true);
      const loadSurahData = async () => {
        const loadedSurah = await loadSurah(surahNumber, currentLanguage);
        setSurah(loadedSurah);
        setIsLoading(false);
      };
      loadSurahData();
    }
  }, [isVisible, surahNumber, currentLanguage]);

  // Scroll jusqu'au verset cible
  useEffect(() => {
    if (
      isVisible &&
      targetVerseNumber &&
      scrollViewRef.current &&
      surah &&
      !isLoading
    ) {
      setTimeout(() => {
        const verseIndex = surah.verses.findIndex(
          (v) => v.id === targetVerseNumber
        );
        if (verseIndex !== -1) {
          const estimatedPosition = verseIndex * 120 + 150;
          scrollViewRef.current?.scrollTo({
            y: estimatedPosition,
            animated: true,
          });
        }
      }, 400);
    }
  }, [isVisible, targetVerseNumber, surah, isLoading]);

  if (isLoading || !surah) {
    return (
      <AppDrawer
        visible={isVisible}
        onClose={onClose}
        title={t("quran.loading")}
        maxHeight="85%"
        showHandle={true}
        enableSwipeToClose={true}
      >
        <View className="flex-1 items-center justify-center py-10">
          <AppText variant="body">{t("quran.loading")}...</AppText>
        </View>
      </AppDrawer>
    );
  }

  return (
    <AppDrawer
      visible={isVisible}
      onClose={onClose}
      title={surah.name}
      subtitle={`${surah.transliteration} - ${surah.translation}`}
      maxHeight="85%"
      showHandle={true}
      showCloseButton={true}
      closeButtonText={t("quran.close")}
      scrollable={true}
      enableSwipeToClose={true}
    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Bismillah - sauf pour Al-Fatiha (sourate 1) et At-Tawbah (sourate 9) */}
        {surah.id !== 1 && surah.id !== 9 && (
          <LinearGradient
            colors={
              isDark ? ["#1f2937", "#111827"] : ["#f0fdfa", "#ffffff"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              marginTop: 8,
              marginBottom: 24,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#ccfbf1",
            }}
          >
            <Text
              className="text-center text-2xl text-text-primary-light dark:text-text-primary-dark"
              style={{
                fontFamily: "Amiri_400Regular",
                writingDirection: "rtl",
              }}
            >
              {t("quran.bismillahAr")}
            </Text>
            <Text className="mt-2 text-center text-xs italic text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
              {t("quran.bismillah")}
            </Text>
          </LinearGradient>
        )}

        {/* Verses */}
        {surah.verses.map((verse, index) => {
          const isTargetVerse = targetVerseNumber === verse.id;

          return (
            <View
              key={verse.id}
              className="mb-4 pb-4"
              style={{
                borderBottomWidth: index === surah.verses.length - 1 ? 0 : 1,
                borderBottomColor: isDark ? "#334155" : "#E2E8F0",
                backgroundColor: isTargetVerse
                  ? isDark
                    ? "rgba(217, 119, 6, 0.1)"
                    : "rgba(217, 119, 6, 0.05)"
                  : "transparent",
                borderRadius: isTargetVerse ? 12 : 0,
                padding: isTargetVerse ? 12 : 0,
                marginHorizontal: isTargetVerse ? -12 : 0,
              }}
            >
              <View className="flex-row items-start gap-3">
                <View className="mt-1 flex-shrink-0">
                  <View
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isTargetVerse
                        ? isDark
                          ? "rgba(217, 119, 6, 0.3)"
                          : "rgba(217, 119, 6, 0.2)"
                        : isDark
                          ? "rgba(17, 94, 89, 0.2)"
                          : "rgba(17, 94, 89, 0.1)",
                    }}
                  >
                    <Text
                      className="text-xs font-outfit-bold"
                      style={{
                        color: isTargetVerse
                          ? isDark
                            ? "#FBBF24"
                            : "#D97706"
                          : isDark
                            ? "#5EEAD4"
                            : "#115E59",
                      }}
                    >
                      {verse.id}
                    </Text>
                  </View>
                </View>

                <View className="flex-1">
                  <Text
                    className="text-right text-xl leading-loose text-text-primary-light dark:text-text-primary-dark"
                    style={{
                      fontFamily: "Amiri_400Regular",
                      writingDirection: "rtl",
                    }}
                  >
                    {verse.text}
                  </Text>
                </View>
              </View>

              <View className="mt-3 pl-12">
                <Text className="text-sm leading-relaxed text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
                  {verse.translation}
                </Text>
              </View>

              {isTargetVerse && (
                <View className="absolute top-2 right-2">
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(217, 119, 6, 0.3)"
                        : "rgba(217, 119, 6, 0.2)",
                    }}
                  >
                    <Text
                      className="text-[10px] font-outfit-bold"
                      style={{
                        color: isDark ? "#FBBF24" : "#D97706",
                      }}
                    >
                      {t("quran.targetVerse")}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Info footer */}
        <View className="mt-4 pt-4 border-t border-border-light dark:border-border-dark mb-4">
          <View className="flex-row items-center justify-between">
            <AppText variant="caption">
              {t("quran.surah")} {surah.id}
            </AppText>
            <AppText variant="caption">
              {surah.total_verses} {t("quran.versets")}
            </AppText>
          </View>
        </View>
      </ScrollView>
    </AppDrawer>
  );
}

export default SurahReaderDrawer;
