import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText, AppCard } from "@/components/ui";

interface HadithCardProps {
  text: string;
  source: string;
  variant?: "gradient" | "card";
  className?: string;
}

export function HadithCard({
  text,
  source,
  variant = "gradient",
  className = "",
}: HadithCardProps) {
  const isDark = useIsDark();

  const content = (
    <View className="flex-row items-start gap-3">
      <View
        className="w-10 h-10 rounded-full items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isDark
            ? "rgba(217, 119, 6, 0.2)"
            : "rgba(217, 119, 6, 0.1)",
        }}
      >
        <MaterialIconsRound name="format-quote" size={20} color="#D97706" />
      </View>
      <View className="flex-1">
        <AppText
          variant="bodyMedium"
          className="mb-2 text-amber-600 dark:text-amber-400"
        >
          Hadith du Jour
        </AppText>
        <Text
          className="text-sm leading-6 font-outfit-regular"
          style={{ color: isDark ? "#cbd5e1" : "#475569" }}
        >
          « {text} »
        </Text>
        <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2 text-right font-outfit-medium">
          — {source}
        </Text>
      </View>
    </View>
  );

  if (variant === "gradient") {
    return (
      <LinearGradient
        colors={isDark ? ["#1f2937", "#111827"] : ["#f0fdfa", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: isDark ? "#334155" : "#ccfbf1",
        }}
        className={className}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <AppCard variant="default" className={className}>
      {content}
    </AppCard>
  );
}

export default HadithCard;
