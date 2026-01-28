import { useIsDark } from "@/components/useColorScheme";
import { lightColors, darkColors, ThemeColors } from "@/constants/theme";

/**
 * Hook pour obtenir les couleurs du thème actuel
 * Prend en compte le mode système, clair ou sombre
 */
export default function useThemeColors(): ThemeColors & { isDark: boolean } {
  const isDark = useIsDark();

  const colors = isDark ? darkColors : lightColors;

  return {
    ...colors,
    isDark,
  };
}

/**
 * Fonction utilitaire pour obtenir les couleurs sans hook
 * Utile pour les styles en dehors des composants
 */
export function getThemeColors(isDark: boolean): ThemeColors {
  return isDark ? darkColors : lightColors;
}
