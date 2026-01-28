import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { useColorScheme as useRNColorScheme } from "react-native";
import useThemeStore from "@/stores/useThemeStore";

export { useColorScheme } from "nativewind";

/**
 * Hook qui retourne si le thème actuel est dark
 * Prend en compte le mode du store (light/dark/system)
 */
export function useIsDark(): boolean {
  const { colorScheme } = useNativeWindColorScheme();
  return colorScheme === "dark";
}

/**
 * Hook pour le thème système (react-native)
 */
export function useSystemColorScheme() {
  return useRNColorScheme();
}
