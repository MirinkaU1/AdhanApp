// Page dédiée de lecture de sourate avec options
import { useState, useEffect, useRef, useCallback } from "react";
import { Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText } from "@/components/ui";
import { loadSurah, QuranSurah } from "@/utils/quranLoader";
import { useQuranStore } from "@/stores/useQuranStore";
import { VerseOptionsDrawer } from "@/components/quran";

interface SelectedVerse {
  id: number;
  text: string;
  translation: string;
  transliteration?: string;
}

export default function QuranReaderScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const isDark = useIsDark();
  const { t, i18n } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);

  const [surah, setSurah] = useState<QuranSurah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(
    null,
  );
  const [showVerseOptions, setShowVerseOptions] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);

  const { updateProgress, getSurahProgress, markAsCompleted } = useQuranStore();
  const surahId = parseInt((params.id as string) || "1");
  const targetVerse = parseInt((params.verse as string) || "1");
  const progress = getSurahProgress(surahId);

  const currentLanguage = i18n.language.startsWith("en") ? "en" : "fr";

  // Charger la sourate
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const loadedSurah = await loadSurah(surahId, currentLanguage);
      setSurah(loadedSurah);
      setIsLoading(false);
      setReadingStartTime(new Date());
    };
    loadData();
  }, [surahId, currentLanguage]);

  // Scroll vers le verset cible (depuis paramètre URL ou progression)
  useEffect(() => {
    if (!isLoading && surah && scrollViewRef.current) {
      // Utiliser le verset passé en paramètre, sinon la progression, sinon 1
      const verseToScroll = targetVerse || progress?.currentVerse || 1;
      const verseIndex = verseToScroll - 1;
      setTimeout(() => {
        const estimatedPosition = verseIndex * 120 + 200;
        scrollViewRef.current?.scrollTo({
          y: estimatedPosition,
          animated: true,
        });
      }, 500);
    }
  }, [isLoading, surah, progress, targetVerse]);

  // Sauvegarder le temps de lecture quand on quitte
  useEffect(() => {
    return () => {
      if (readingStartTime) {
        const minutes = Math.floor(
          (new Date().getTime() - readingStartTime.getTime()) / 60000,
        );
        if (minutes > 0) {
          useQuranStore.getState().addReadingTime(minutes);
        }
      }
    };
  }, [readingStartTime]);

  const handleVersePress = useCallback(
    (verseId: number) => {
      if (surah) {
        updateProgress(surahId, verseId, surah.total_verses, surah.name);
      }
    },
    [surah, surahId, updateProgress],
  );

  const handleVerseLongPress = useCallback(
    (verse: {
      id: number;
      text: string;
      translation: string;
      transliteration?: string;
    }) => {
      setSelectedVerse(verse);
      setShowVerseOptions(true);
    },
    [],
  );

  if (isLoading || !surah) {
    return (
      <View className="flex-1 bg-bg-light dark:bg-bg-dark items-center justify-center">
        <AppText variant="body">{t("common.loading")}...</AppText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header avec gradient */}
      <View className="rounded-b-3xl overflow-hidden">
        <LinearGradient
          colors={["#115E59", "#0d4542"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16 }}
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <MaterialIconsRound name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>

            <View className="flex-1 items-center mx-2">
              <Text
                className="text-xl text-white"
                style={{ fontFamily: "Amiri_400Regular" }}
              >
                {surah.name}
              </Text>
              <Text className="text-white/70 text-sm font-outfit-regular">
                {surah.transliteration}
              </Text>
            </View>

            <View className="w-10" />
          </View>

          {/* Barre de progression */}
          {progress && (
            <View className="mt-4">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-white/80 text-xs font-outfit-medium">
                  {progress.percentage}% {t("quran.completed")}
                </Text>
                <Text className="text-white/80 text-xs font-outfit-medium">
                  {progress.versesRead.length}/{surah.total_verses}{" "}
                  {t("quran.versets")}
                </Text>
              </View>
              <View className="h-1.5 rounded-full overflow-hidden bg-white/20">
                <View
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${progress.percentage}%` }}
                />
              </View>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Contenu */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={true}
      >
        {/* Bismillah */}
        {surah.id !== 1 && surah.id !== 9 && (
          <LinearGradient
            colors={isDark ? ["#1f2937", "#111827"] : ["#f0fdfa", "#ffffff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              marginHorizontal: 16,
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

        {/* Versets */}
        <View className="px-4">
          {surah.verses.map((verse, index) => {
            const isRead = progress?.versesRead.includes(verse.id);

            return (
              <Pressable
                key={verse.id}
                onPress={() => handleVersePress(verse.id)}
                onLongPress={() => handleVerseLongPress(verse)}
                className="mb-4 pb-4 active:opacity-70"
                style={{
                  borderBottomWidth: index === surah.verses.length - 1 ? 0 : 1,
                  borderBottomColor: isDark ? "#334155" : "#E2E8F0",
                  backgroundColor: isRead
                    ? isDark
                      ? "rgba(17, 94, 89, 0.1)"
                      : "rgba(17, 94, 89, 0.05)"
                    : "transparent",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <View className="flex-row items-start gap-3">
                  <View className="mt-1 flex-shrink-0">
                    <View
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isRead
                          ? isDark
                            ? "rgba(17, 94, 89, 0.3)"
                            : "rgba(17, 94, 89, 0.2)"
                          : isDark
                            ? "rgba(17, 94, 89, 0.2)"
                            : "rgba(17, 94, 89, 0.1)",
                      }}
                    >
                      <Text
                        className="text-xs font-outfit-bold"
                        style={{
                          color: isRead
                            ? isDark
                              ? "#5EEAD4"
                              : "#115E59"
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
                  {verse.transliteration ? (
                    <Text className="text-sm italic leading-relaxed text-amber-600 dark:text-amber-500 font-outfit-regular mb-1">
                      {verse.transliteration}
                    </Text>
                  ) : null}
                  <Text className="text-sm leading-relaxed text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
                    {verse.translation}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Drawer des options du verset */}
      {selectedVerse && (
        <VerseOptionsDrawer
          isVisible={showVerseOptions}
          onClose={() => {
            setShowVerseOptions(false);
            setSelectedVerse(null);
          }}
          verseId={selectedVerse.id}
          verseText={selectedVerse.text}
          verseTranslation={selectedVerse.translation}
          surahId={surah.id}
          surahName={surah.name}
          surahTransliteration={surah.transliteration}
          isRead={progress?.versesRead.includes(selectedVerse.id) || false}
          onMarkAsRead={() => handleVersePress(selectedVerse.id)}
        />
      )}
    </View>
  );
}
