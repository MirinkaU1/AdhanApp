import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";

type LoaderVariant = "fullscreen" | "overlay" | "inline";
type LoaderSize = "small" | "medium" | "large";

interface AppLoaderProps {
  /**
   * fullscreen — gradient teal plein écran (ex: splash, page de chargement)
   * overlay   — fond semi-transparent par-dessus le contenu
   * inline    — spinner seul, sans fond (intégré dans une vue)
   */
  variant?: LoaderVariant;
  size?: LoaderSize;
  /** Message optionnel sous le spinner */
  message?: string;
}

const RN_SIZE: Record<LoaderSize, "small" | "large"> = {
  small: "small",
  medium: "small",
  large: "large",
};

export default function AppLoader({
  variant = "fullscreen",
  size = "large",
  message,
}: AppLoaderProps) {
  const isDark = useIsDark();
  const appTheme = useAppTheme();

  // ── Inline ───────────────────────────────────────────────────────────────
  if (variant === "inline") {
    return (
      <View className="items-center justify-center gap-2">
        <ActivityIndicator
          size={RN_SIZE[size]}
          color={isDark ? "#2DD4BF" : appTheme.primary}
        />
        {message && (
          <Text className={`font-outfit-regular text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {message}
          </Text>
        )}
      </View>
    );
  }

  // ── Overlay ──────────────────────────────────────────────────────────────
  if (variant === "overlay") {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        className="absolute inset-0 z-50 items-center justify-center"
        style={{
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.75)"
            : "rgba(243, 244, 246, 0.80)",
        }}
      >
        <View
          className={`rounded-2xl p-6 items-center gap-3 ${isDark ? "bg-card-dark" : "bg-card-light"}`}
          style={{ minWidth: 96, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        >
          <ActivityIndicator
            size={RN_SIZE[size]}
            color={isDark ? "#2DD4BF" : appTheme.primary}
          />
          {message && (
            <Text className={`font-outfit-medium text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {message}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  }

  // ── Fullscreen (default) ─────────────────────────────────────────────────
  return (
    <View className="flex-1 items-center justify-center">
      <LinearGradient
        colors={appTheme.headerGradient}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <ActivityIndicator size={RN_SIZE[size]} color="#ffffff" />
      {message && (
        <Text className="font-outfit-regular text-white/70 text-base mt-4">
          {message}
        </Text>
      )}
    </View>
  );
}
