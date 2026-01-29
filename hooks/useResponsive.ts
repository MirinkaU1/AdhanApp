import { useWindowDimensions } from "react-native";

type ScreenSize = "sm" | "md" | "lg";

interface ResponsiveValue<T> {
  sm?: T;
  md?: T;
  lg?: T;
  default: T;
}

interface ResponsiveUtils {
  width: number;
  height: number;
  screenSize: ScreenSize;
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  // Fonction pour obtenir une valeur responsive
  rs: <T>(values: ResponsiveValue<T>) => T;
  // Fonction simplifiée: rs3(small, medium, large)
  rs3: <T>(sm: T, md: T, lg: T) => T;
  // Tailles de texte prédéfinies
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
    "4xl": number;
    "5xl": number;
  };
  // Tailles d'icônes prédéfinies
  iconSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  // Espacements prédéfinis
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// Breakpoints (basés sur les largeurs d'écran courantes)
const BREAKPOINTS = {
  sm: 360, // Petits téléphones
  lg: 414, // Grands téléphones / phablets
};

export default function useResponsive(): ResponsiveUtils {
  const { width, height } = useWindowDimensions();

  const screenSize: ScreenSize =
    width < BREAKPOINTS.sm ? "sm" : width >= BREAKPOINTS.lg ? "lg" : "md";

  const isSmall = screenSize === "sm";
  const isMedium = screenSize === "md";
  const isLarge = screenSize === "lg";

  // Fonction pour obtenir une valeur selon la taille d'écran
  const rs = <T>(values: ResponsiveValue<T>): T => {
    if (isSmall && values.sm !== undefined) return values.sm;
    if (isLarge && values.lg !== undefined) return values.lg;
    if (isMedium && values.md !== undefined) return values.md;
    return values.default;
  };

  // Fonction simplifiée: (small, medium, large)
  const rs3 = <T>(sm: T, md: T, lg: T): T => {
    if (isSmall) return sm;
    if (isLarge) return lg;
    return md;
  };

  // Tailles de texte responsives
  const fontSize = {
    xs: rs3(10, 11, 13),
    sm: rs3(11, 12, 14),
    base: rs3(13, 14, 16),
    lg: rs3(15, 16, 18),
    xl: rs3(17, 18, 21),
    "2xl": rs3(20, 22, 26),
    "3xl": rs3(26, 30, 36),
    "4xl": rs3(32, 36, 44),
    "5xl": rs3(38, 48, 58),
  };

  // Tailles d'icônes responsives
  const iconSize = {
    xs: rs3(14, 16, 18),
    sm: rs3(18, 20, 24),
    md: rs3(22, 24, 28),
    lg: rs3(28, 32, 38),
    xl: rs3(36, 40, 48),
  };

  // Espacements responsifs
  const spacing = {
    xs: rs3(4, 6, 8),
    sm: rs3(8, 10, 14),
    md: rs3(12, 16, 20),
    lg: rs3(18, 24, 32),
    xl: rs3(24, 32, 42),
  };

  return {
    width,
    height,
    screenSize,
    isSmall,
    isMedium,
    isLarge,
    rs,
    rs3,
    fontSize,
    iconSize,
    spacing,
  };
}
