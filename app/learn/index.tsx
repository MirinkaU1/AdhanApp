import { Pressable, ScrollView, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText } from "@/components/ui";
import { AppCard } from "@/components/ui";
import useQuizStore from "@/stores/useQuizStore";
import quizData from "@/assets/data/quizQuestions.json";

export default function LearnScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = useIsDark();
  const stats = useQuizStore((s) => s.stats);

  const categoryCounts = quizData.categories.map((cat) => ({
    ...cat,
    count: quizData.questions.filter((q) => q.category === cat.id).length,
  }));

  const handleCategoryPress = (categoryId: string) => {
    router.push({
      pathname: "/learn/quiz" as any,
      params: { category: categoryId },
    });
  };

  const getBestScoreLabel = (categoryId: string) => {
    const s = stats[categoryId];
    if (!s || s.played === 0) return null;
    return `${s.bestScore}/${s.bestTotal}`;
  };

  const getStars = (categoryId: string) => {
    const s = stats[categoryId];
    if (!s || s.played === 0) return 0;
    const ratio = s.bestScore / s.bestTotal;
    if (ratio >= 0.9) return 3;
    if (ratio >= 0.7) return 2;
    if (ratio >= 0.5) return 1;
    return 0;
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="rounded-b-4xl min-h-52 overflow-hidden">
          <LinearGradient
            colors={["#7C3AED", "#5B21B6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { opacity: 0.07, backgroundColor: "transparent" },
            ]}
          />

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-14 left-5 w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <MaterialIconsRound name="arrow-back" size={22} color="#fff" />
          </Pressable>

          <View className="px-6 pt-32 pb-8">
            <View className="flex-row items-center gap-3 mb-2">
              <AppText
                variant="h1"
                className="text-white text-4xl font-outfit-bold"
              >
                {t("quiz.title")}
              </AppText>
            </View>
            <AppText variant="caption" className="text-white/70 mt-1">
              {t("quiz.subtitle")}
            </AppText>
          </View>
        </View>

        {/* Info bar */}
        <View className="mx-4 -mt-5 mb-6">
          <AppCard className="flex-row items-center gap-3 p-4">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: "#7C3AED15" }}
            >
              <MaterialIconsRound name="info" size={18} color="#7C3AED" />
            </View>
            <AppText variant="caption" className="flex-1 leading-5">
              {t("quiz.infoBar", { count: 10 })}
            </AppText>
          </AppCard>
        </View>

        {/* Categories */}
        <View className="px-4">
          {/* Mode aléatoire — carte featured */}
          <Pressable
            onPress={() => handleCategoryPress("random")}
            className="active:scale-95 transition-transform mb-5"
          >
            <LinearGradient
              colors={["#7C3AED", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <AppText
                        variant="label"
                        style={{ color: "#fff", fontSize: 10 }}
                      >
                        {t("quiz.randomBadge")}
                      </AppText>
                    </View>
                  </View>
                  <AppText
                    variant="h2"
                    style={{
                      color: "#fff",
                      fontFamily: "Outfit_700Bold",
                      marginBottom: 4,
                    }}
                  >
                    {t("quiz.categories.random")}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {t("quiz.randomDesc", { count: quizData.questions.length })}
                  </AppText>
                </View>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 16,
                  }}
                >
                  <MaterialIconsRound name="shuffle" size={28} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          <AppText variant="h3" className="mb-4">
            {t("quiz.chooseCategory")}
          </AppText>

          <View className="gap-3">
            {categoryCounts.map((category) => {
              const bestLabel = getBestScoreLabel(category.id);
              const stars = getStars(category.id);
              const catStats = stats[category.id];

              return (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategoryPress(category.id)}
                  className="active:scale-95 transition-transform"
                >
                  <AppCard className="p-4">
                    <View className="flex-row items-center gap-4">
                      {/* Icon */}
                      <LinearGradient
                        colors={category.gradient as [string, string]}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialIconsRound
                          name={category.icon as any}
                          size={26}
                          color="#fff"
                        />
                      </LinearGradient>

                      {/* Info */}
                      <View className="flex-1">
                        <AppText
                          variant="bodyMedium"
                          style={{ color: category.color }}
                        >
                          {t(`quiz.categories.${category.id}`)}
                        </AppText>
                        <AppText variant="label" className="mt-0.5">
                          {t("quiz.questionsCount", { count: category.count })}
                        </AppText>

                        {/* Stars */}
                        {stars > 0 && (
                          <View className="flex-row gap-0.5 mt-1">
                            {[1, 2, 3].map((i) => (
                              <MaterialIconsRound
                                key={i}
                                name="star"
                                size={14}
                                color={
                                  i <= stars
                                    ? "#F59E0B"
                                    : isDark
                                      ? "#334155"
                                      : "#E2E8F0"
                                }
                              />
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Best score badge */}
                      {bestLabel ? (
                        <View
                          className="px-3 py-1.5 rounded-xl"
                          style={{ backgroundColor: category.color + "18" }}
                        >
                          <AppText
                            variant="caption"
                            style={{ color: category.color, fontWeight: "600" }}
                          >
                            {bestLabel}
                          </AppText>
                          <AppText
                            variant="label"
                            style={{
                              color: category.color + "99",
                              fontSize: 9,
                              textAlign: "center",
                            }}
                          >
                            {t("quiz.best")}
                          </AppText>
                        </View>
                      ) : (
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                          }}
                        >
                          <MaterialIconsRound
                            name="play-arrow"
                            size={18}
                            color={category.color}
                          />
                        </View>
                      )}
                    </View>

                    {/* Played count */}
                    {catStats && catStats.played > 0 && (
                      <View
                        className="mt-3 pt-3"
                        style={{
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: isDark ? "#334155" : "#E2E8F0",
                        }}
                      >
                        <AppText variant="label" className="text-xs">
                          {t("quiz.playedCount", { count: catStats.played })}
                        </AppText>
                      </View>
                    )}
                  </AppCard>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
