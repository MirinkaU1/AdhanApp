import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  _hasHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setHasHydrated: (state: boolean) => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      _hasHydrated: false,
      setMode: (mode) => set({ mode }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useThemeStore;
