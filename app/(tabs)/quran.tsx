import { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText, AppCard } from "@/components/ui";
import { SurahReaderDrawer, ContinueReadingCard } from "@/components/quran";

const QURAN_ACTIVITIES = [
  {
    id: "read",
    title: "readQuran",
    subtitle: "essentialSurahs",
    icon: "menu-book",
    color: "#115E59", // Fallback — remplacé dynamiquement par appTheme.primary dans le rendu
  },
  {
    id: "dhikr",
    title: "dhikr",
    subtitle: "invocations",
    icon: "self-improvement",
    color: "#059669",
  },
  {
    id: "learn",
    title: "learn",
    subtitle: "learnQuran",
    icon: "school",
    color: "#7C3AED",
  },
  {
    id: "quests",
    title: "quests",
    subtitle: "dailyQuests",
    icon: "military-tech",
    color: "#EA580C",
  },
];

export default function QuranScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const appTheme = useAppTheme();
  const { width } = useWindowDimensions();
  const [showSurahReader, setShowSurahReader] = useState(false);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(67);
  const [targetVerse, setTargetVerse] = useState<number | undefined>(undefined);

  useEffect(() => {
    router.prefetch("/quran");
    router.prefetch("/quran/favorites");
  }, [router]);

  const handleActivityPress = (activityId: string) => {
    switch (activityId) {
      case "read":
        router.push("/quran");
        break;
      case "hadith":
        break;
      case "dhikr":
        router.push("/quran/dhikr");
        break;
      case "learn":
        break;
      case "quests":
        router.push("/quests");
        break;
    }
  };

  const handleSurahPress = (surahNumber: number) => {
    setSelectedSurahNumber(surahNumber);
    setTargetVerse(undefined);
    setShowSurahReader(true);
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER ===== */}
        <View className="rounded-b-4xl min-h-52 overflow-hidden">
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

          <View className="px-6 pt-20 pb-8">
            <AppText
              variant="h1"
              className="text-white text-4xl font-outfit-bold mb-2"
            >
              Al-Quran
            </AppText>
            <AppText variant="caption" className="text-white/70">
              {t("quran.subtitle")}
            </AppText>
          </View>
        </View>

        <View className="px-4 -mt-6">
          <ContinueReadingCard />
        </View>

        <View className="px-4 mt-6">
          <AppText variant="h3" className="mb-4">
            {t("quran.activities")}
          </AppText>

          <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
            {QURAN_ACTIVITIES.map((activity) => {
              const activityColor = activity.id === "read" ? appTheme.primary : activity.color;
              return (
              <View
                key={activity.id}
                style={{ width: "50%", paddingHorizontal: 6, marginBottom: 12 }}
              >
                <Pressable
                  onPress={() => handleActivityPress(activity.id)}
                  className="active:scale-95 transition-transform"
                  style={{ height: 140 }}
                >
                  <AppCard className="p-4 h-full justify-between">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                      style={{ backgroundColor: activityColor + "15" }}
                    >
                      <MaterialIconsRound
                        name={activity.icon as any}
                        size={24}
                        color={activityColor}
                      />
                    </View>
                    <View>
                      <AppText
                        variant="bodyMedium"
                        style={{ color: activityColor }}
                      >
                        {activity.id === "dhikr"
                          ? t("dhikr.title")
                          : t(`quran.${activity.title}`)}
                      </AppText>
                      <AppText variant="label" className="mt-1">
                        {t(`quran.${activity.subtitle}`)}
                      </AppText>
                    </View>
                  </AppCard>
                </Pressable>
              </View>
              );
            })}
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>

      <SurahReaderDrawer
        isVisible={showSurahReader}
        onClose={() => setShowSurahReader(false)}
        surahNumber={selectedSurahNumber}
        targetVerseNumber={targetVerse}
      />
    </View>
  );
}
