import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FREE_THEME_IDS } from "@/constants/appThemes";
import useCoinsStore from "@/stores/useCoinsStore";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  // Apparence claire/sombre (existant)
  mode: ThemeMode;
  _hasHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setHasHydrated: (state: boolean) => void;

  // Système de thèmes visuels (nouveau)
  activeThemeId: string;
  unlockedThemeIds: string[];
  setActiveTheme: (id: string) => void;
  unlockTheme: (id: string) => void;
  purchaseTheme: (id: string, price: number) => boolean;
  isThemeUnlocked: (id: string) => boolean;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      _hasHydrated: false,
      setMode: (mode) => set({ mode }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      activeThemeId: "default",
      unlockedThemeIds: [...FREE_THEME_IDS],

      setActiveTheme: (id) => {
        if (get().isThemeUnlocked(id)) set({ activeThemeId: id });
      },

      unlockTheme: (id) => {
        if (!get().unlockedThemeIds.includes(id)) {
          set((state) => ({
            unlockedThemeIds: [...state.unlockedThemeIds, id],
          }));
        }
      },

      purchaseTheme: (id, price) => {
        if (get().isThemeUnlocked(id)) return false;
        const spent = useCoinsStore.getState().spendCoins(price);
        if (!spent) return false;
        get().unlockTheme(id);
        return true;
      },

      isThemeUnlocked: (id) => get().unlockedThemeIds.includes(id),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mode: state.mode,
        activeThemeId: state.activeThemeId,
        unlockedThemeIds: state.unlockedThemeIds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // S'assurer que les thèmes gratuits sont toujours débloqués
        if (state) {
          const missing = FREE_THEME_IDS.filter(
            (id) => !state.unlockedThemeIds.includes(id),
          );
          if (missing.length > 0) {
            state.unlockedThemeIds = [...state.unlockedThemeIds, ...missing];
          }
        }
      },
    },
  ),
);

export default useThemeStore;
