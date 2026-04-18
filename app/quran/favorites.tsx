import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  FlatList,
  Text,
  View,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText, AppCard, AlertDialog } from "@/components/ui";
import { useQuranStore, FavoriteVerse } from "@/stores/useQuranStore";
import * as Haptics from "expo-haptics";

function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useState(new Animated.Value(0))[0];
  const [isShown, setIsShown] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setIsShown(true);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setIsShown(false));
    }
  }, [visible, opacity]);

  if (!isShown && !visible) return null;

  return (
    <Animated.View
      className="absolute bottom-20 left-8 right-8 bg-slate-800 px-4 py-3 rounded-xl items-center z-50"
      style={{ opacity }}
    >
      <Text className="text-white font-outfit-medium">{message}</Text>
    </Animated.View>
  );
}

function FavoriteVerseCard({
  verse,
  onPress,
  onRemove,
  t,
}: {
  verse: FavoriteVerse;
  onPress: () => void;
  onRemove: () => void;
  t: (key: string) => string;
}) {
  const isDark = useIsDark();
  const appTheme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      className="active:scale-[0.98] transition-transform mx-4 mb-3"
    >
      <AppCard className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View
              className="w-8 h-8 rounded-lg items-center justify-center mr-2"
              style={{
                backgroundColor: isDark
                  ? "rgba(17, 94, 89, 0.2)"
                  : "rgba(17, 94, 89, 0.1)",
              }}
            >
              <Text
                className="text-sm font-outfit-bold"
                style={{ color: isDark ? "#5EEAD4" : appTheme.primary }}
              >
                {verse.surahId}
              </Text>
            </View>
            <View>
              <Text
                className="text-base font-outfit-semibold text-text-primary-light dark:text-text-primary-dark"
                style={{ fontFamily: "Amiri_400Regular" }}
              >
                {verse.surahName}
              </Text>
              <Text
                className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
              >
                {verse.surahTransliteration} - {t("quran.verse")} {verse.verseNumber}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onRemove}
            className="p-2 rounded-full active:opacity-60"
            style={{
              backgroundColor: isDark
                ? "rgba(239, 68, 68, 0.15)"
                : "rgba(239, 68, 68, 0.1)",
            }}
          >
            <MaterialIconsRound name="delete-outline" size={20} color="#EF4444" />
          </Pressable>
        </View>

        <Text
          className="text-lg text-right mb-2 font-amiri"
          style={{
            writingDirection: "rtl",
            color: isDark ? "#E2E8F0" : "#1E293B",
          }}
        >
          {verse.verseText}
        </Text>

        <Text
          className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
          numberOfLines={2}
        >
          {verse.verseTranslation}
        </Text>
      </AppCard>
    </Pressable>
  );
}

import React from "react";

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const favorites = useQuranStore((state) => state.getAllFavorites());
  const removeFromFavorites = useQuranStore((state) => state.removeFromFavorites);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [pendingRemove, setPendingRemove] = useState<{
    surahId: number;
    verseNumber: number;
  } | null>(null);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2500);
  };

  const groupedFavorites = useMemo(() => {
    const groups: Record<number, FavoriteVerse[]> = {};
    favorites.forEach((verse) => {
      if (!groups[verse.surahId]) {
        groups[verse.surahId] = [];
      }
      groups[verse.surahId].push(verse);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([surahId, verses]) => ({
        surahId: Number(surahId),
        surahName: verses[0].surahName,
        surahTransliteration: verses[0].surahTransliteration,
        verses: verses.sort((a, b) => a.verseNumber - b.verseNumber),
      }));
  }, [favorites]);

  const handleVersePress = (surahId: number, verseNumber: number) => {
    router.navigate({
      pathname: "/quran/reader/[id]",
      params: { id: surahId.toString(), verse: verseNumber.toString() },
    } as any);
  };

  const handleRemove = (surahId: number, verseNumber: number) => {
    setPendingRemove({ surahId, verseNumber });
  };

  const confirmRemove = () => {
    if (!pendingRemove) return;
    removeFromFavorites(pendingRemove.surahId, pendingRemove.verseNumber);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(t("quran.removedFromFavorites"));
    setPendingRemove(null);
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <Toast message={toast.message} visible={toast.visible} />

      <AlertDialog
        visible={!!pendingRemove}
        title={t("quran.confirmRemoveFavorite")}
        message={t("quran.confirmRemoveFavoriteDesc")}
        icon="bookmark-remove"
        iconColor="#EF4444"
        onDismiss={() => setPendingRemove(null)}
        buttons={[
          { text: t("common.cancel"), style: "default", onPress: () => setPendingRemove(null) },
          { text: t("quran.removeFromFavorites"), style: "destructive", onPress: confirmRemove },
        ]}
      />
      <FlatList
        className="flex-1"
        data={groupedFavorites}
        keyExtractor={(item) => item.surahId.toString()}
        ListHeaderComponent={
          <>
            <View
              className="rounded-b-4xl overflow-hidden"
              style={{ minHeight: 200 }}
            >
              <LinearGradient
                colors={appTheme.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1542813820-56b46215a3f8?w=800&q=80",
                }}
                style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}
                resizeMode="cover"
              />

              <View className="pt-14 px-6 flex-row items-center">
                <Pressable
                  onPress={() => router.back()}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <MaterialIconsRound
                    name="arrow-back"
                    size={20}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>

              <View className="px-6 pb-8 pt-4">
                <View className="flex-row items-center mb-2">
                  <MaterialIconsRound name="bookmark" size={24} color="#FFFFFF" />
                  <AppText
                    variant="h1"
                    className="text-white text-3xl font-outfit-bold ml-2"
                  >
                    {t("quran.favorites")}
                  </AppText>
                </View>
                <AppText variant="caption" className="text-white/70">
                  {favorites.length} {favorites.length === 1 ? t("quran.verseSaved") : t("quran.versesSaved")}
                </AppText>
              </View>
            </View>

            {groupedFavorites.length > 0 && (
              <View className="px-4 pt-4 pb-2">
                <AppText variant="h3">
                  {t("quran.allFavorites")} ({groupedFavorites.length})
                </AppText>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20 px-8">
            <MaterialIconsRound
              name="bookmark-border"
              size={64}
              color={isDark ? "#475569" : "#94A3B8"}
            />
            <AppText variant="h3" className="text-center mb-2 mt-4">
              {t("quran.noFavorites")}
            </AppText>
            <AppText
              variant="caption"
              className="text-center text-text-secondary-light dark:text-text-secondary-dark"
            >
              {t("quran.noFavoritesHint")}
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <View>
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row items-center">
                <Text
                  className="text-lg font-outfit-bold mr-2"
                  style={{ color: isDark ? "#5EEAD4" : appTheme.primary, fontFamily: "Amiri_400Regular" }}
                >
                  {item.surahName}
                </Text>
                <AppText variant="caption" className="text-text-secondary-light dark:text-text-secondary-dark">
                  ({item.surahTransliteration})
                </AppText>
              </View>
            </View>
            {item.verses.map((verse) => (
              <FavoriteVerseCard
                key={`${verse.surahId}-${verse.verseNumber}`}
                verse={verse}
                t={t}
                onPress={() => handleVersePress(verse.surahId, verse.verseNumber)}
                onRemove={() => handleRemove(verse.surahId, verse.verseNumber)}
              />
            ))}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
