import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { Switch } from "@/components/ui";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function GoalsScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const [dailyGoal, setDailyGoal] = useState(5);
  const [streakReminder, setStreakReminder] = useState(true);

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
              {t("goals.title")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("goals.subtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
          >
            <MaterialIconsRound
              name="track-changes"
              size={26}
              color="#3B82F6"
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Objectif quotidien */}
        <Text
          className="text-text-primary-light dark:text-text-primary-dark font-outfit-bold mb-4"
          style={{ fontSize: 18 }}
        >
          {t("goals.prayersPerDay")}
        </Text>

        <View className="bg-card-light dark:bg-card-dark rounded-3xl p-6 border border-border-light dark:border-border-dark items-center mb-6">
          <Text
            className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium mb-4"
            style={{ fontSize: 14 }}
          >
            {t("goals.obligatoryGoal")}
          </Text>

          <View className="flex-row items-center gap-6">
            <Pressable
              onPress={() => setDailyGoal(Math.max(1, dailyGoal - 1))}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}
            >
              <MaterialIconsRound
                name="remove"
                size={24}
                color={isDark ? "#F8FAFC" : "#1E293B"}
              />
            </Pressable>

            <View className="items-center">
              <Text
                className="font-outfit-bold"
                style={{ fontSize: 48, color: "#3B82F6" }}
              >
                {dailyGoal}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                style={{ fontSize: 14 }}
              >
                {t("goals.prayersDay")}
              </Text>
            </View>

            <Pressable
              onPress={() => setDailyGoal(Math.min(5, dailyGoal + 1))}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}
            >
              <MaterialIconsRound
                name="add"
                size={24}
                color={isDark ? "#F8FAFC" : "#1E293B"}
              />
            </Pressable>
          </View>

          {/* Indicateur visuel */}
          <View className="flex-row gap-2 mt-6">
            {[1, 2, 3, 4, 5].map((num) => (
              <View
                key={num}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    num <= dailyGoal
                      ? "#3B82F6"
                      : isDark
                        ? "#334155"
                        : "#E2E8F0",
                }}
              >
                <MaterialIconsRound
                  name="check"
                  size={20}
                  color={
                    num <= dailyGoal ? "#fff" : isDark ? "#94A3B8" : "#64748B"
                  }
                />
              </View>
            ))}
          </View>
        </View>

        {/* Options */}
        <Text
          className="text-text-primary-light dark:text-text-primary-dark font-outfit-bold mb-4"
          style={{ fontSize: 18 }}
        >
          {t("goals.options")}
        </Text>

        <View className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark">
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3.5">
              <View
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? "#334155" : "#FEF3C7" }}
              >
                <MaterialIconsRound
                  name="local-fire-department"
                  size={22}
                  color="#F59E0B"
                />
              </View>
              <View>
                <Text
                  className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                  style={{ fontSize: 16 }}
                >
                  {t("goals.maintainStreak")}
                </Text>
                <Text
                  className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                  style={{ fontSize: 13 }}
                >
                  {t("goals.maintainStreakDesc")}
                </Text>
              </View>
            </View>
            <Switch
              value={streakReminder}
              onValueChange={setStreakReminder}
              activeColor="#F59E0B"
            />
          </View>
        </View>

        {/* Info */}
        <View
          className="flex-row items-start gap-3 mt-6 p-4 rounded-2xl"
          style={{ backgroundColor: isDark ? "#1E3A5F" : "#EFF6FF" }}
        >
          <MaterialIconsRound name="info" size={20} color="#3B82F6" />
          <Text
            className="flex-1 font-outfit-regular"
            style={{
              fontSize: 13,
              color: isDark ? "#93C5FD" : "#1E40AF",
              lineHeight: 20,
            }}
          >
            {t("goals.info")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
