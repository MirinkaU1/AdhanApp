import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

interface RamadanState {
  isRamadanMode: boolean;
  moonCoins: number;
  hasSeenRamadanWelcome: boolean;
  toggleRamadanMode: () => void;
  setRamadanMode: (value: boolean) => void;
  markWelcomeSeen: () => void;
  addMoonCoins: (amount: number) => void;
  spendMoonCoins: (amount: number) => boolean;
  syncMoonCoins: () => Promise<void>;
  loadMoonCoins: () => Promise<void>;
}

export const useRamadanStore = create<RamadanState>()(
  persist(
    (set, get) => ({
      isRamadanMode: false,
      moonCoins: 0,
      hasSeenRamadanWelcome: false,

      toggleRamadanMode: () =>
        set((state) => ({
          isRamadanMode: !state.isRamadanMode,
          hasSeenRamadanWelcome: state.isRamadanMode
            ? false
            : state.hasSeenRamadanWelcome,
        })),

      setRamadanMode: (value) =>
        set((state) => ({
          isRamadanMode: value,
          hasSeenRamadanWelcome: value ? state.hasSeenRamadanWelcome : false,
        })),

      markWelcomeSeen: () => set({ hasSeenRamadanWelcome: true }),

      addMoonCoins: (amount) => {
        set((state) => ({ moonCoins: state.moonCoins + amount }));
        get().syncMoonCoins();
      },

      spendMoonCoins: (amount) => {
        const { moonCoins } = get();
        if (moonCoins < amount) return false;
        set({ moonCoins: moonCoins - amount });
        get().syncMoonCoins();
        return true;
      },

      syncMoonCoins: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from("ramadan_progress").upsert(
            {
              user_id: user.id,
              moon_coins: get().moonCoins,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        } catch {
          // Silencieux — la table sera créée plus tard
        }
      },

      loadMoonCoins: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data } = await supabase
            .from("ramadan_progress")
            .select("moon_coins")
            .eq("user_id", user.id)
            .single();
          if (data?.moon_coins !== undefined) {
            set({ moonCoins: Math.max(get().moonCoins, data.moon_coins) });
          }
        } catch {
          // Silencieux
        }
      },
    }),
    {
      name: "ramadan-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isRamadanMode: state.isRamadanMode,
        moonCoins: state.moonCoins,
        hasSeenRamadanWelcome: state.hasSeenRamadanWelcome,
      }),
    },
  ),
);

export default useRamadanStore;
