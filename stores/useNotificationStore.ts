import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

type PrayerPreferences = Record<PrayerName, boolean>;

type NotificationState = {
  enabled: boolean;
  preferences: PrayerPreferences;
  toggleAll: () => void;
  togglePrayer: (name: PrayerName) => void;
  setEnabled: (value: boolean) => void;
};

const createDefaultPreferences = (): PrayerPreferences => ({
  fajr: true,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
});

const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      enabled: true,
      preferences: createDefaultPreferences(),
      toggleAll: () =>
        set((state) => ({
          enabled: !state.enabled,
        })),
      togglePrayer: (name) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [name]: !state.preferences[name],
          },
        })),
      setEnabled: (value) => {
        set({ enabled: value });
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useNotificationStore;
