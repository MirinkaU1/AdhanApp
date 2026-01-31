import React, { useEffect, useState } from "react";
import { View, Pressable, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText } from "@/components/ui";
import {
  DailyVerse,
  getDailyVerseByDay,
  getRandomDailyVerse,
} from "@/constants/QuranData";

interface DailyVerseCardProps {
  onPress?: () => void;
  mode?: "daily" | "random";
  onRefresh?: () => void;
}

export function DailyVerseCard({
  onPress,
  mode = "daily",
  onRefresh,
}: DailyVerseCardProps) {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const isDark = useIsDark();

  useEffect(() => {
    const selectedVerse =
      mode === "daily" ? getDailyVerseByDay() : getRandomDailyVerse();
    setVerse(selectedVerse);
  }, [mode]);

  const handleRefresh = () => {
    const newVerse = getRandomDailyVerse();
    setVerse(newVerse);
    onRefresh?.();
  };

  if (!verse) return null;

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={isDark ? ["#1f2937", "#111827"] : ["#fef3c7", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: isDark ? "#334155" : "#fde68a",
        }}
      >
        {/* Header with badge */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: isDark
                  ? "rgba(217, 119, 6, 0.2)"
                  : "rgba(217, 119, 6, 0.15)",
              }}
            >
              <MaterialIconsRound
                name="menu-book"
                size={20}
                color="#D97706"
              />
            </View>
            <AppText
              variant="bodyMedium"
              className="text-amber-600 dark:text-amber-400"
            >
              Verset du Jour
            </AppText>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: isDark
                ? "rgba(17, 94, 89, 0.2)"
                : "rgba(17, 94, 89, 0.1)",
            }}
          >
            <Text
              className="text-xs font-outfit-semibold"
              style={{ color: isDark ? "#5EEAD4" : "#115E59" }}
            >
              {verse.surahName} : {verse.ayahNumber}
            </Text>
          </View>
        </View>

        {/* Arabic Text with Amiri font */}
        <View
          className="mb-3 pb-3"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#334155" : "#E2E8F0",
          }}
        >
          <Text
            className="text-center text-xl leading-loose"
            style={{
              fontFamily: "Amiri_400Regular",
              writingDirection: "rtl",
              color: isDark ? "#F8FAFC" : "#1E293B",
            }}
          >
            {verse.arabicText}
          </Text>
        </View>

        {/* French Translation */}
        <Text
          className="text-sm leading-6 font-outfit-regular mb-3"
          style={{ color: isDark ? "#cbd5e1" : "#475569" }}
        >
          « {verse.frenchText} »
        </Text>

        {/* Footer with theme tag and actions */}
        <View className="flex-row items-center justify-between">
          <View
            className="px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: isDark
                ? "rgba(17, 94, 89, 0.15)"
                : "rgba(17, 94, 89, 0.08)",
            }}
          >
            <Text
              className="text-xs font-outfit-medium"
              style={{ color: isDark ? "#5EEAD4" : "#115E59" }}
            >
              {verse.theme}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleRefresh}
              className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <MaterialIconsRound
                name="refresh"
                size={16}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </Pressable>
            <Pressable
              className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <MaterialIconsRound
                name="share"
                size={16}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default DailyVerseCard;
