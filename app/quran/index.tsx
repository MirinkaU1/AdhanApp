import { useState, useEffect, useCallback, memo } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  ListRenderItem,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText, AppCard } from "@/components/ui";
import { ContinueReadingCard, SurahSkeleton } from "@/components/quran";
import { SurahCard } from "@/components/quran/SurahCard";
import {
  loadSurahIndex,
  SurahIndexInfo,
  getSurahIndexSync,
} from "@/utils/quranLoader";
import { useQuranStore } from "@/stores/useQuranStore";

export default function QuranListScreen() {
  const isDark = useIsDark();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // Détecter la langue actuelle
  const currentLanguage = i18n.language.startsWith("en") ? "en" : "fr";

  const cachedData = getSurahIndexSync(currentLanguage);
  const [surahList, setSurahList] = useState<SurahIndexInfo[]>(
    cachedData || [],
  );
  const [isLoading, setIsLoading] = useState(!cachedData);
  const favoriteVersesCount = useQuranStore(
    (state) => state.favoriteVerses.length,
  );

  // Charger la liste des sourates seulement si pas en cache
  useEffect(() => {
    // Si on a déjà des données pour cette langue, ne pas recharger
    const cached = getSurahIndexSync(currentLanguage);
    if (cached) {
      setSurahList(cached);
      setIsLoading(false);
      return;
    }

    // Sinon charger
    const loadSurahs = async () => {
      setIsLoading(true);
      const index = await loadSurahIndex(currentLanguage);
      setSurahList(index);
      setIsLoading(false);
    };

    loadSurahs();
  }, [currentLanguage]);

  const handleSurahPress = useCallback(
    (surahNumber: number) => {
      router.push({
        pathname: "/quran/reader/[id]",
        params: { id: surahNumber.toString() },
      });
    },
    [router],
  );

  const renderSurahItem: ListRenderItem<SurahIndexInfo> = useCallback(
    ({ item }) => <SurahCard surah={item} onPress={handleSurahPress} />,
    [handleSurahPress],
  );

  const keyExtractor = useCallback(
    (item: SurahIndexInfo) => item.id.toString(),
    [],
  );

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <FlatList
        className="flex-1"
        data={surahList}
        renderItem={isLoading ? undefined : renderSurahItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View
              className="rounded-b-4xl overflow-hidden"
              style={{ minHeight: 200 }}
            >
              <LinearGradient
                colors={["#115E59", "#0d4542"]}
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

              <View className="pt-14 px-6 flex-row items-center justify-between">
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
                <Pressable
                  onPress={() => router.push("/quran/favorites")}
                  className="flex-row items-center bg-white/10 w-10 h-10 justify-center rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <MaterialIconsRound
                    name="bookmark"
                    size={20}
                    color="#FFFFFF"
                  />
                  {favoriteVersesCount > 0 && (
                    <View className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full items-center justify-center border-2 border-teal-800">
                      <Text className="text-[8px] items-center font-outfit-bold text-white">
                        {favoriteVersesCount > 99 ? "99+" : favoriteVersesCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>

              <View className="px-6 pb-8 pt-4">
                <View className="flex-row items-center mb-2">
                  <AppText
                    variant="h1"
                    className="text-white text-4xl font-outfit-bold"
                  >
                    {t("quran.theQuran")}
                  </AppText>
                </View>
                <AppText
                  variant="caption"
                  className="text-white/70 text-sm font-outfit-regular"
                >
                  {t("quran.listSubtitle")}
                </AppText>
              </View>
            </View>

            <View className="px-4 -mt-6 mb-6">
              <ContinueReadingCard />
            </View>

            <View className="px-4">
              <AppText variant="h3" className="mb-4">
                {t("quran.allSurahs")} ({surahList.length})
              </AppText>
            </View>
          </>
        }
        ListFooterComponent={<View className="h-8" />}
        ListEmptyComponent={isLoading ? <SurahSkeleton count={8} /> : null}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
      />
      {isLoading && (
        <View
          className="absolute top-0 left-0 right-0"
          style={{ marginTop: 260 }}
        >
          <SurahSkeleton count={8} />
        </View>
      )}
    </View>
  );
}
