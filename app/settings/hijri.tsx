import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function HijriScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const [adjustment, setAdjustment] = useState(0);

  // Simulation de la date Hijri
  const getHijriDate = (adj: number) => {
    const day = 15 + adj;
    return `${day} Rajab 1447`;
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <LinearGradient
        colors={appTheme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: 48,
          paddingBottom: 24,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-white font-outfit-bold"
              style={{ fontSize: 24 }}
            >
              {t("hijri.title")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("hijri.subtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(217, 119, 6, 0.2)" }}
          >
            <MaterialIconsRound name="date-range" size={26} color="#D97706" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date actuelle */}
        <View className="bg-card-light dark:bg-card-dark rounded-3xl p-6 border border-border-light dark:border-border-dark items-center mb-6">
          <Text
            className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium mb-2"
            style={{ fontSize: 14 }}
          >
            {t("hijri.currentDate")}
          </Text>
          <Text
            className="font-outfit-bold mb-2"
            style={{ fontSize: 28, color: "#D97706" }}
          >
            {getHijriDate(adjustment)}
          </Text>
          <Text
            className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
            style={{ fontSize: 14 }}
          >
            {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Ajustement */}
        <Text
          className="text-text-primary-light dark:text-text-primary-dark font-outfit-bold mb-4"
          style={{ fontSize: 18 }}
        >
          {t("hijri.adjustment")}
        </Text>

        <View className="bg-card-light dark:bg-card-dark rounded-3xl p-6 border border-border-light dark:border-border-dark items-center">
          <View className="flex-row items-center gap-8">
            <Pressable
              onPress={() => setAdjustment(Math.max(-3, adjustment - 1))}
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}
            >
              <MaterialIconsRound
                name="remove"
                size={28}
                color={isDark ? "#F8FAFC" : "#1E293B"}
              />
            </Pressable>

            <View className="items-center" style={{ minWidth: 100 }}>
              <Text
                className="font-outfit-bold"
                style={{
                  fontSize: 56,
                  color:
                    adjustment === 0
                      ? isDark
                        ? "#94A3B8"
                        : "#64748B"
                      : "#D97706",
                }}
              >
                {adjustment > 0 ? `+${adjustment}` : adjustment}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                style={{ fontSize: 14 }}
              >
                {adjustment === 0
                  ? t("hijri.noAdjustment")
                  : adjustment === 1 || adjustment === -1
                    ? t("hijri.day")
                    : t("hijri.days")}
              </Text>
            </View>

            <Pressable
              onPress={() => setAdjustment(Math.min(3, adjustment + 1))}
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}
            >
              <MaterialIconsRound
                name="add"
                size={28}
                color={isDark ? "#F8FAFC" : "#1E293B"}
              />
            </Pressable>
          </View>

          {/* Bouton reset */}
          {adjustment !== 0 && (
            <Pressable
              onPress={() => setAdjustment(0)}
              className="mt-6 px-5 py-2.5 rounded-full"
              style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}
            >
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium"
                style={{ fontSize: 14 }}
              >
                {t("hijri.reset")}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Info */}
        <View
          className="flex-row items-start gap-3 mt-6 p-4 rounded-2xl"
          style={{ backgroundColor: isDark ? "#422006" : "#FEF3C7" }}
        >
          <MaterialIconsRound name="info" size={20} color="#D97706" />
          <Text
            className="flex-1 font-outfit-regular"
            style={{
              fontSize: 13,
              color: isDark ? "#FCD34D" : "#92400E",
              lineHeight: 20,
            }}
          >
            {t("hijri.info")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
