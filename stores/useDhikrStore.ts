import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

export type DhikrType =
  | "SubhanAllah"
  | "AlHamdulilah"
  | "AllahuAkbar"
  | "Astaghfirullah";

export const DHIKR_OPTIONS: {
  label: string;
  value: DhikrType;
  arabic: string;
}[] = [
  { label: "SubhanAllah", value: "SubhanAllah", arabic: "سُبْحَانَ ٱللَّهِ" },
  { label: "AlHamdulilah", value: "AlHamdulilah", arabic: "ٱلْحَمْدُ لِلَّهِ" },
  { label: "AllahuAkbar", value: "AllahuAkbar", arabic: "ٱللَّهُ أَكْبَرُ" },
  {
    label: "Astaghfirullah",
    value: "Astaghfirullah",
    arabic: "أَسْتَغْفِرُ ٱللَّهَ",
  },
];

export type TargetCount = 33 | 99 | 0;

interface DhikrState {
  count: number;
  target: TargetCount;
  currentDhikr: DhikrType;
  totalLifetimeCount: number;
  completedCycles: number;

  increment: () => void;
  reset: () => void;
  setTarget: (target: TargetCount) => void;
  setDhikr: (dhikr: DhikrType) => void;
}

export const useDhikrStore = create<DhikrState>()(
  persist(
    (set, get) => ({
      count: 0,
      target: 33,
      currentDhikr: "SubhanAllah",
      totalLifetimeCount: 0,
      completedCycles: 0,

      increment: () => {
        const { count, target, totalLifetimeCount, completedCycles } = get();
        const newCount = count + 1;

        if (target > 0 && newCount >= target) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          set({
            count: 0,
            totalLifetimeCount: totalLifetimeCount + 1,
            completedCycles: completedCycles + 1,
          });
        } else {
          set({ count: newCount, totalLifetimeCount: totalLifetimeCount + 1 });
        }
      },

      reset: () => {
        set({ count: 0, totalLifetimeCount: 0, completedCycles: 0 });
      },

      setTarget: (target: TargetCount) => {
        set({ target, count: 0 });
      },

      setDhikr: (dhikr: DhikrType) => {
        set({ currentDhikr: dhikr, count: 0 });
      },
    }),
    {
      name: "dhikr-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useDhikrStore;
