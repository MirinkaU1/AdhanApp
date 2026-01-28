import React from "react";
import { View, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsDark } from "@/components/useColorScheme";

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Additional className for the container */
  className?: string;
  /** Use SafeAreaView (default: true) */
  useSafeArea?: boolean;
  /** StatusBar style override */
  statusBarStyle?: "light" | "dark" | "auto";
}

/**
 * ScreenWrapper - Wrapper pour les écrans avec SafeAreaView et StatusBar
 * Gère automatiquement le thème sombre/clair
 */
export default function ScreenWrapper({
  children,
  className = "",
  useSafeArea = true,
  statusBarStyle = "auto",
}: ScreenWrapperProps) {
  const isDark = useIsDark();

  // Déterminer le style de la StatusBar
  const barStyle =
    statusBarStyle === "auto"
      ? isDark
        ? "light-content"
        : "dark-content"
      : statusBarStyle === "dark"
        ? "dark-content"
        : "light-content";

  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <>
      <StatusBar
        barStyle={barStyle}
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />
      <Container
        className={`flex-1 bg-bg-light dark:bg-bg-dark ${className}`}
        style={{ flex: 1 }}
      >
        {children}
      </Container>
    </>
  );
}
