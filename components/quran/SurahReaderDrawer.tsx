import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  useMemo,
} from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppText, AppLoader } from "@/components/ui";
import AppDrawer from "@/components/ui/AppDrawer";
import { useTranslation } from "react-i18next";
import { loadSurah, QuranSurah, QuranVerse } from "@/utils/quranLoader";

// Nombre de versets avant/après la cible à inclure dans la fenêtre
const WINDOW_BEFORE = 5;
const WINDOW_AFTER = 45;

// ─── VerseItem ────────────────────────────────────────────────────────────────

interface VerseItemProps {
  verse: QuranVerse;
  isTarget: boolean;
  isLast: boolean;
  isDark: boolean;
}

const VerseItem = memo(function VerseItem({
  verse,
  isTarget,
  isLast,
  isDark,
}: VerseItemProps) {
  const appTheme = useAppTheme();
  return (
    <View
      style={[
        styles.verseContainer,
        !isLast && (isDark ? styles.borderDark : styles.borderLight),
        isTarget && (isDark ? styles.targetBgDark : styles.targetBgLight),
        isTarget && styles.targetPadding,
      ]}
    >
      <View style={styles.verseRow}>
        <View
          style={[
            styles.numberCircle,
            isTarget
              ? isDark
                ? styles.numberCircleTargetDark
                : styles.numberCircleTargetLight
              : isDark
                ? styles.numberCircleDark
                : styles.numberCircleLight,
          ]}
        >
          <Text
            style={[
              styles.numberText,
              {
                color: isTarget
                  ? isDark
                    ? "#FBBF24"
                    : "#D97706"
                  : isDark
                    ? "#5EEAD4"
                    : appTheme.primary,
              },
            ]}
          >
            {verse.id}
          </Text>
        </View>

        <View style={styles.arabicWrapper}>
          <Text
            style={[
              styles.arabicText,
              { color: isDark ? "#F1F5F9" : "#1E293B" },
            ]}
          >
            {verse.text}
          </Text>
        </View>
      </View>

      <View style={styles.translationWrapper}>
        <Text
          style={[
            styles.translationText,
            { color: isDark ? "#94A3B8" : "#64748B" },
          ]}
        >
          {verse.translation}
        </Text>
      </View>

      {/* {isTarget && (
        <View style={styles.badge}>
          <View style={isDark ? styles.badgeBgDark : styles.badgeBgLight}>
            <Text style={[styles.badgeText, { color: isDark ? "#FBBF24" : "#D97706" }]}>★</Text>
          </View>
        </View>
      )} */}
    </View>
  );
});

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface SurahReaderDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  surahNumber?: number;
  targetVerseNumber?: number;
}

export function SurahReaderDrawer({
  isVisible,
  onClose,
  surahNumber = 1,
  targetVerseNumber,
}: SurahReaderDrawerProps) {
  const isDark = useIsDark();
  const { t, i18n } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [surah, setSurah] = useState<QuranSurah | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentLanguage = i18n.language.startsWith("en") ? "en" : "fr";

  useEffect(() => {
    if (!isVisible) return;
    let cancelled = false;
    setIsLoading(true);
    setSurah(null);
    loadSurah(surahNumber, currentLanguage).then((loaded) => {
      if (cancelled) return;
      setSurah(loaded);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isVisible, surahNumber, currentLanguage]);

  // Index du verset cible dans le tableau complet
  const targetIndex = useMemo(() => {
    if (!surah || !targetVerseNumber) return 0;
    const i = surah.verses.findIndex((v) => v.id === targetVerseNumber);
    return i > 0 ? i : 0;
  }, [surah, targetVerseNumber]);

  // Fenêtre de versets : WINDOW_BEFORE avant la cible + WINDOW_AFTER après
  // On ne rend jamais plus de ~50 versets → ScrollView simple, zéro virtualisation
  const { windowVerses, windowTargetIndex } = useMemo(() => {
    if (!surah) return { windowVerses: [], windowTargetIndex: 0 };
    const start = Math.max(0, targetIndex - WINDOW_BEFORE);
    const end = Math.min(surah.verses.length, targetIndex + WINDOW_AFTER);
    return {
      windowVerses: surah.verses.slice(start, end),
      windowTargetIndex: targetIndex - start,
    };
  }, [surah, targetIndex]);

  // Scroll vers le verset cible dès que le contenu est rendu
  // L'estimation suffit ici : on n'a que ~50 items, l'erreur est faible
  const handleContentSizeChange = useCallback(() => {
    if (windowTargetIndex <= 0) return;
    // Mesure approximative : chaque item ~170px, bismillah ~110px
    const hasBismillah = surah && surah.id !== 1 && surah.id !== 9;
    const offset = (hasBismillah ? 110 : 0) + windowTargetIndex * 170;
    scrollRef.current?.scrollTo({ y: offset, animated: false });
  }, [windowTargetIndex, surah?.id]);

  const bismillah = useMemo(() => {
    if (!surah || surah.id === 1 || surah.id === 9) return null;
    return (
      <LinearGradient
        colors={isDark ? ["#1f2937", "#111827"] : ["#f0fdfa", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.bismillah,
          { borderColor: isDark ? "#334155" : "#ccfbf1" },
        ]}
      >
        <Text
          className="text-center text-2xl text-text-primary-light dark:text-text-primary-dark"
          style={{ fontFamily: "Amiri_400Regular", writingDirection: "rtl" }}
        >
          {t("quran.bismillahAr")}
        </Text>
        <Text className="mt-1.5 text-center text-xs italic font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark">
          {t("quran.bismillah")}
        </Text>
      </LinearGradient>
    );
  }, [surah?.id, isDark, t]);

  return (
    <AppDrawer
      visible={isVisible}
      onClose={onClose}
      title={surah?.name ?? ""}
      subtitle={
        surah ? `${surah.transliteration} · ${surah.translation}` : undefined
      }
      maxHeight="85%"
      showHandle
      showCloseButton
      closeButtonText={t("quran.close")}
      scrollable={false}
      fillHeight
      enableSwipeToClose
    >
      {isLoading || !surah ? (
        <View className="flex-1 items-center justify-center">
          <AppLoader variant="inline" size="large" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          showsVerticalScrollIndicator
          onContentSizeChange={handleContentSizeChange}
          scrollEventThrottle={16}
        >
          {bismillah}

          {windowVerses.map((verse, index) => (
            <VerseItem
              key={verse.id}
              verse={verse}
              isTarget={verse.id === targetVerseNumber}
              isLast={index === windowVerses.length - 1}
              isDark={isDark}
            />
          ))}

          <View className="flex-row justify-between mt-4 pt-3 border-t border-border-light dark:border-border-dark mb-2">
            <AppText variant="caption">
              {t("quran.surah")} {surah.id}
            </AppText>
            <AppText variant="caption">
              {surah.total_verses} {t("quran.versets")}
            </AppText>
          </View>
        </ScrollView>
      )}
    </AppDrawer>
  );
}

export default SurahReaderDrawer;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  // Verse
  verseContainer: { marginBottom: 16, paddingBottom: 16 },
  borderLight: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  borderDark: { borderBottomWidth: 1, borderBottomColor: "#334155" },
  targetBgLight: { backgroundColor: "rgba(217,119,6,0.05)" },
  targetBgDark: { backgroundColor: "rgba(217,119,6,0.1)" },
  targetPadding: { borderRadius: 12, padding: 12 },
  verseRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  numberCircleLight: { backgroundColor: "rgba(17,94,89,0.1)" },
  numberCircleDark: { backgroundColor: "rgba(17,94,89,0.2)" },
  numberCircleTargetLight: { backgroundColor: "rgba(217,119,6,0.2)" },
  numberCircleTargetDark: { backgroundColor: "rgba(217,119,6,0.3)" },
  numberText: { fontSize: 12, fontFamily: "Outfit_700Bold" },
  arabicWrapper: { flex: 1 },
  arabicText: {
    textAlign: "right",
    fontSize: 20,
    lineHeight: 38,
    fontFamily: "Amiri_400Regular",
    writingDirection: "rtl",
  },
  translationWrapper: { marginTop: 10, paddingLeft: 48 },
  translationText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Outfit_400Regular",
  },
  badge: { position: "absolute", top: 8, right: 8 },
  badgeBgLight: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: "rgba(217,119,6,0.2)",
  },
  badgeBgDark: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: "rgba(217,119,6,0.3)",
  },
  badgeText: { fontSize: 10, fontFamily: "Outfit_700Bold" },
  // Bismillah
  bismillah: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
});
