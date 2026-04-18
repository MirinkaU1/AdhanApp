import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  awardCoinsServer,
  type CoinAwardReason,
  fetchThemeInventory,
  grantCoinsServer,
} from "@/lib/themeEconomy";

interface CoinsState {
  coins: number;
  setCoins: (coins: number) => void;
  addCoins: (
    amount: number,
    options?: {
      reason?: string;
      referenceKey?: string;
      targetUserId?: string;
    },
  ) => Promise<boolean>;
  awardCoins: (
    reason: CoinAwardReason,
    referenceKey: string,
    userId?: string,
  ) => Promise<boolean>;
  spendCoins: (amount: number) => boolean;
  syncFromServer: (userId?: string) => Promise<void>;
  clearAllData: () => void;
}

const useCoinsStore = create<CoinsState>()(
  persist(
    (set, get) => ({
      coins: 0,

      setCoins: (coins) => set({ coins: Math.max(0, Math.floor(coins)) }),

      addCoins: async (amount, options) => {
        if (amount <= 0) return false;

        const newBalance = await grantCoinsServer(
          amount,
          options?.reason ?? "debug_grant",
          options?.referenceKey,
          options?.targetUserId,
        );

        if (newBalance === null) return false;
        set({ coins: newBalance });
        return true;
      },

      awardCoins: async (reason, referenceKey, userId) => {
        const newBalance = await awardCoinsServer(reason, referenceKey, userId);
        if (newBalance === null) return false;
        set({ coins: newBalance });
        return true;
      },

      spendCoins: (amount) => {
        if (get().coins < amount) return false;
        set((state) => ({ coins: state.coins - amount }));
        return true;
      },

      syncFromServer: async (userId) => {
        const inventory = await fetchThemeInventory(userId);
        if (!inventory) return;
        set({ coins: inventory.coins });
      },

      clearAllData: () => set({ coins: 0 }),
    }),
    {
      name: "coins-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useCoinsStore;
