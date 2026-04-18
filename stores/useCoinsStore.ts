import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CoinsState {
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
}

const useCoinsStore = create<CoinsState>()(
  persist(
    (set, get) => ({
      coins: 0,

      addCoins: (amount) =>
        set((state) => ({ coins: state.coins + amount })),

      spendCoins: (amount) => {
        if (get().coins < amount) return false;
        set((state) => ({ coins: state.coins - amount }));
        return true;
      },
    }),
    {
      name: "coins-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useCoinsStore;
