import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface WidgetState {
  /** ID du thème appliqué aux widgets. `null` = suivre le thème actif de l'app. */
  widgetThemeId: string | null;
  setWidgetThemeId: (id: string | null) => void;
}

const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      widgetThemeId: null,
      setWidgetThemeId: (id) => set({ widgetThemeId: id }),
    }),
    {
      name: "widget-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useWidgetStore;
