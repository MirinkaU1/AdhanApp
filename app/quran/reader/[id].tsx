import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  FlatList,
  ListRenderItem,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppLoader } from "@/components/ui";
import {
  loadSurah,
  QuranSurah,
  QuranVerse,
  getSurahIndexSync,
} from "@/utils/quranLoader";
import { useQuranStore } from "@/stores/useQuranStore";
import { VerseOptionsDrawer } from "@/components/quran";

const ESTIMATED_VERSE_HEIGHT = 150;

interface SelectedVerse {
  id: number;
  text: string;
  translation: string;
  transliteration?: string;
}

// ─── VerseItem memoized ───────────────────────────────────────────────────────

interface VerseItemProps {
  verse: QuranVerse;
  isRead: boolean;
  isLast: boolean;
  onPress: (id: number) => void;
  onLongPress: (verse: QuranVerse) => void;
}

const VerseItem = memo(function VerseItem({
  verse,
  isRead,
  isLast,
  onPress,
  onLongPress,
}: VerseItemProps) {
  const isDark = useIsDark();

  return (
    <Pressable
      onPress={() => onPress(verse.id)}
      onLongPress={() => onLongPress(verse)}
      className="mx-4 mb-1 rounded-xl p-3 active:opacity-70"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: isDark ? "#334155" : "#E2E8F0",
        backgroundColor: isRead
          ? isDark
            ? "rgba(17,94,89,0.1)"
            : "rgba(17,94,89,0.05)"
          : "transparent",
        paddingBottom: 14,
      }}
    >
      <View className="flex-row items-start gap-1">
        <View className="mt-1 flex-shrink-0">
          <View
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{
              backgroundColor: isRead
                ? isDark
                  ? "rgba(17,94,89,0.3)"
                  : "rgba(17,94,89,0.2)"
                : isDark
                  ? "rgba(17,94,89,0.2)"
                  : "rgba(17,94,89,0.1)",
            }}
          >
            <Text className="text-xs font-outfit-bold text-primary dark:text-teal-300">
              {verse.id}
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <Text
            className="text-right text-xl leading-loose text-text-primary-light dark:text-text-primary-dark"
            style={{ fontFamily: "Amiri_400Regular", writingDirection: "rtl" }}
          >
            {verse.text}
          </Text>
        </View>
      </View>

      <View className="mt-3 pl-12">
        {verse.transliteration ? (
          <Text className="mb-1 text-sm italic leading-relaxed text-amber-600 dark:text-amber-500 font-outfit-regular">
            {verse.transliteration}
          </Text>
        ) : null}
        <Text className="text-sm leading-relaxed text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
          {verse.translation}
        </Text>
      </View>
    </Pressable>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QuranReaderScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const isDark = useIsDark();
  const { t, i18n } = useTranslation();
  const flatListRef = useRef<FlatList<QuranVerse>>(null);

  const [surah, setSurah] = useState<QuranSurah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [showVerseOptions, setShowVerseOptions] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);

  const { updateProgress, unmarkVerse, getSurahProgress } = useQuranStore();
  const surahId = parseInt((params.id as string) || "1");
  const targetVerse = parseInt((params.verse as string) || "1");
  const progress = getSurahProgress(surahId);

  const currentLanguage = i18n.language.startsWith("en") ? "en" : "fr";

  // Données disponibles immédiatement depuis l'index (nom, translittération)
  // → le header s'affiche sans attendre les versets
  const surahInfo = useMemo(() => {
    const index = getSurahIndexSync(currentLanguage);
    return index?.find((s) => s.id === surahId) ?? null;
  }, [surahId, currentLanguage]);

  const headerName = surah?.name ?? surahInfo?.name ?? "";
  const headerTranslit = surah?.transliteration ?? surahInfo?.transliteration ?? "";

  // Set O(1) pour les lookups isRead — évite un .includes() O(n) par verset rendu
  const readSet = useMemo(
    () => new Set(progress?.versesRead ?? []),
    [progress?.versesRead],
  );

  // Charger la sourate
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadSurah(surahId, currentLanguage).then((loaded) => {
      if (cancelled) return;
      setSurah(loaded);
      setIsLoading(false);
      setReadingStartTime(new Date());
    });
    return () => { cancelled = true; };
  }, [surahId, currentLanguage]);

  // Scroll vers le verset cible une fois les données prêtes
  useEffect(() => {
    if (isLoading || !surah) return;
    const verseToScroll = targetVerse > 1 ? targetVerse : progress?.currentVerse ?? 1;
    if (verseToScroll <= 1) return;
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: (verseToScroll - 1) * ESTIMATED_VERSE_HEIGHT,
        animated: true,
      });
    }, 300);
  }, [isLoading, surah]);

  // Sauvegarder le temps de lecture en quittant
  useEffect(() => {
    return () => {
      if (readingStartTime) {
        const minutes = Math.floor(
          (Date.now() - readingStartTime.getTime()) / 60000,
        );
        if (minutes > 0) useQuranStore.getState().addReadingTime(minutes);
      }
    };
  }, [readingStartTime]);

  const handleVersePress = useCallback(
    (verseId: number) => {
      if (surah) updateProgress(surahId, verseId, surah.total_verses, surah.name);
    },
    [surah, surahId, updateProgress],
  );

  const handleToggleVerseRead = useCallback(
    (verseId: number) => {
      if (!surah) return;
      if (readSet.has(verseId)) {
        unmarkVerse(surahId, verseId);
      } else {
        updateProgress(surahId, verseId, surah.total_verses, surah.name);
      }
    },
    [surah, surahId, readSet, updateProgress, unmarkVerse],
  );

  const handleVerseLongPress = useCallback((verse: QuranVerse) => {
    setSelectedVerse(verse);
    setShowVerseOptions(true);
  }, []);

  const renderItem: ListRenderItem<QuranVerse> = useCallback(
    ({ item, index }) => (
      <VerseItem
        verse={item}
        isRead={readSet.has(item.id)}
        isLast={index === (surah?.verses.length ?? 0) - 1}
        onPress={handleToggleVerseRead}
        onLongPress={handleVerseLongPress}
      />
    ),
    [readSet, surah?.verses.length, handleToggleVerseRead, handleVerseLongPress],
  );

  const keyExtractor = useCallback((item: QuranVerse) => item.id.toString(), []);

  // Bismillah en ListHeaderComponent
  const ListHeader = useMemo(() => {
    if (!surah || surah.id === 1 || surah.id === 9) return null;
    return (
      <LinearGradient
        colors={isDark ? ["#1f2937", "#111827"] : ["#f0fdfa", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          marginHorizontal: 16,
          marginBottom: 20,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? "#334155" : "#ccfbf1",
        }}
      >
        <Text
          className="text-center text-2xl text-text-primary-light dark:text-text-primary-dark"
          style={{ fontFamily: "Amiri_400Regular", writingDirection: "rtl" }}
        >
          {t("quran.bismillahAr")}
        </Text>
        <Text className="mt-2 text-center text-xs italic text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
          {t("quran.bismillah")}
        </Text>
      </LinearGradient>
    );
  }, [surah?.id, isDark, t]);

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* ── Header — s'affiche immédiatement depuis l'index ── */}
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
                {headerName}
              </Text>
              <Text className="text-white/70 text-sm font-outfit-regular">
                {headerTranslit}
              </Text>
            </View>

            <View className="w-10" />
          </View>

          {progress && surah && (
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

      {/* ── Contenu ── */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <AppLoader variant="inline" size="large" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={surah?.verses ?? []}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={<View style={{ height: 40 }} />}
          contentContainerStyle={{ paddingTop: 20 }}
          showsVerticalScrollIndicator
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          updateCellsBatchingPeriod={50}
        />
      )}

      {/* ── Drawer options verset ── */}
      {selectedVerse && surah && (
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
          isRead={readSet.has(selectedVerse.id)}
          onToggleRead={() => handleToggleVerseRead(selectedVerse.id)}
        />
      )}
    </View>
  );
}
