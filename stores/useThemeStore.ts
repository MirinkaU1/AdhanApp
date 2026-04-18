import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FREE_THEME_IDS } from "@/constants/appThemes";
import useCoinsStore from "@/stores/useCoinsStore";
import {
  fetchThemeInventory,
  purchaseThemeServer,
  setActiveThemeServer,
} from "@/lib/themeEconomy";

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
  setActiveTheme: (id: string, userId?: string) => Promise<boolean>;
  unlockTheme: (id: string) => void;
  purchaseTheme: (
    id: string,
    price: number,
    userId?: string,
  ) => Promise<boolean>;
  syncFromServer: (userId?: string) => Promise<void>;
  isThemeUnlocked: (id: string) => boolean;
  clearAllData: () => void;
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

      setActiveTheme: async (id, userId) => {
        if (!get().isThemeUnlocked(id)) return false;

        set({ activeThemeId: id });
        const success = await setActiveThemeServer(id, userId);
        return success;
      },

      unlockTheme: (id) => {
        if (!get().unlockedThemeIds.includes(id)) {
          set((state) => ({
            unlockedThemeIds: [...state.unlockedThemeIds, id],
          }));
        }
      },

      purchaseTheme: async (id, _price, userId) => {
        if (get().isThemeUnlocked(id)) return false;

        const result = await purchaseThemeServer(
          id,
          userId,
          `theme_purchase:${id}`,
        );
        if (!result || !result.success) return false;

        const unlockedThemeIds = Array.from(
          new Set([...FREE_THEME_IDS, ...result.unlockedThemeIds]),
        );

        set({
          activeThemeId: unlockedThemeIds.includes(result.activeThemeId)
            ? result.activeThemeId
            : "default",
          unlockedThemeIds,
        });
        useCoinsStore.getState().setCoins(result.newBalance);

        return true;
      },

      syncFromServer: async (userId) => {
        const inventory = await fetchThemeInventory(userId);
        if (!inventory) return;

        const unlockedThemeIds = Array.from(
          new Set([...FREE_THEME_IDS, ...inventory.unlockedThemeIds]),
        );
        const activeThemeId = unlockedThemeIds.includes(inventory.activeThemeId)
          ? inventory.activeThemeId
          : "default";

        set({
          activeThemeId,
          unlockedThemeIds,
        });
        useCoinsStore.getState().setCoins(inventory.coins);
      },

      isThemeUnlocked: (id) => get().unlockedThemeIds.includes(id),

      clearAllData: () =>
        set({
          activeThemeId: "default",
          unlockedThemeIds: [...FREE_THEME_IDS],
        }),
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
            missing.forEach((id) => state.unlockTheme(id));
          }
        }
      },
    },
  ),
);

export default useThemeStore;
