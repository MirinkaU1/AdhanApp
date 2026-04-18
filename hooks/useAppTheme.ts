import { useMemo } from "react";
import useThemeStore from "@/stores/useThemeStore";
import { getThemeById, type AppTheme } from "@/constants/appThemes";

/**
 * Retourne le thème visuel actif (couleurs, gradient, etc.)
 * À utiliser dans tous les composants qui affichent des couleurs dynamiques.
 */
export function useAppTheme(): AppTheme {
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  return useMemo(() => getThemeById(activeThemeId), [activeThemeId]);
}
