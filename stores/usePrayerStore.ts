import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerTimes = Record<PrayerName, Date>;
export type PrayerStatus = Record<PrayerName, boolean>;
export type PrayerLogMap = Record<string, PrayerStatus>;
export type DirtyDateMap = Record<string, true>;

// Pending sync queue item
export interface PendingSyncItem {
  dateKey: string;
  status: PrayerStatus;
  timestamp: number;
}

export type LocationInfo = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
};

export type NextPrayerInfo = {
  name: PrayerName;
  time: Date;
  remainingMinutes: number;
};

export type CalculationMethodName =
  | "muslimWorldLeague"
  | "egyptian"
  | "karachi"
  | "northAmerica"
  | "ummAlQura"
  | "qatar"
  | "kuwait"
  | "dubai"
  | "singapore"
  | "tehran"
  | "turkey"
  | "moonsightingCommittee";

export type MadhabName = "shafi" | "hanafi";

type PrayerStoreState = {
  // Location
  location: LocationInfo | null;
  isLoadingLocation: boolean;

  // Prayer times
  dateKey: string;
  times: PrayerTimes | null;
  hijriDate: string;
  nextPrayer: NextPrayerInfo | null;

  // Status tracking
  status: PrayerStatus;
  logs: PrayerLogMap;
  dirtyDates: DirtyDateMap;

  // Sync queue (offline first)
  pendingSyncQueue: PendingSyncItem[];
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Settings
  calculationMethod: CalculationMethodName;
  madhab: MadhabName;
  hijriOffset: number;
  autoLocation: boolean;
  autoHijriSync: boolean;

  // Actions - Location
  setLocation: (location: LocationInfo) => void;
  setLoadingLocation: (loading: boolean) => void;

  // Actions - Prayer times
  setPrayerTimes: (date: Date, times: PrayerTimes) => void;
  setHijriDate: (hijri: string) => void;
  setNextPrayer: (next: NextPrayerInfo | null) => void;

  // Actions - Status
  togglePrayer: (name: PrayerName, userId?: string) => Promise<void>;
  resetForDate: (date: Date) => void;
  syncDate: (date?: Date) => void;
  getStatusForDate: (date: Date) => PrayerStatus;
  getStreak: (date?: Date) => number;
  getTotalPrayers: () => number;
  getDirtyDates: () => string[];
  markSyncedDates: (dates: string[]) => void;

  // Actions - Sync
  syncToSupabase: (userId: string) => Promise<void>;
  fetchFromSupabase: (userId: string) => Promise<void>;
  addToPendingQueue: (dateKey: string, status: PrayerStatus) => void;
  processPendingQueue: (userId: string) => Promise<void>;

  // Actions - Settings
  setCalculationMethod: (value: CalculationMethodName) => void;
  setMadhab: (value: MadhabName) => void;
  setHijriOffset: (value: number) => void;
  setAutoLocation: (value: boolean) => void;
  setAutoHijriSync: (value: boolean) => void;
  clearAllData: () => void;
};

const createDefaultStatus = (): PrayerStatus => ({
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
});

const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

const isComplete = (status: PrayerStatus) =>
  Object.values(status).every((value) => value);

const usePrayerStore = create<PrayerStoreState>()(
  persist(
    (set, get) => ({
      // Location
      location: null,
      isLoadingLocation: true,

      // Prayer times
      dateKey: getDateKey(new Date()),
      times: null,
      hijriDate: "",
      nextPrayer: null,

      // Status tracking
      status: createDefaultStatus(),
      logs: {
        [getDateKey(new Date())]: createDefaultStatus(),
      },
      dirtyDates: {},

      // Sync queue
      pendingSyncQueue: [],
      isSyncing: false,
      lastSyncedAt: null,

      // Settings
      calculationMethod: "muslimWorldLeague",
      madhab: "shafi",
      hijriOffset: 0,
      autoLocation: true,
      autoHijriSync: false,

      // Actions - Location
      setLocation: (location) => set({ location, isLoadingLocation: false }),
      setLoadingLocation: (isLoadingLocation) => set({ isLoadingLocation }),

      // Actions - Prayer times
      setHijriDate: (hijriDate) => set({ hijriDate }),
      setNextPrayer: (nextPrayer) => set({ nextPrayer }),

      setPrayerTimes: (date, times) =>
        set((state) => {
          const dateKey = getDateKey(date);
          const shouldReset = state.dateKey !== dateKey;
          const logs = state.logs[dateKey]
            ? state.logs
            : {
                ...state.logs,
                [dateKey]: createDefaultStatus(),
              };

          return {
            dateKey,
            times,
            status: shouldReset ? createDefaultStatus() : state.status,
            logs,
          };
        }),

      // Toggle prayer with optimistic update + background sync
      togglePrayer: async (name, userId) => {
        const state = get();
        const newStatus = {
          ...state.status,
          [name]: !state.status[name],
        };

        // 1. Optimistic Update - UI updates immediately
        set({
          status: newStatus,
          logs: {
            ...state.logs,
            [state.dateKey]: newStatus,
          },
          dirtyDates: {
            ...state.dirtyDates,
            [state.dateKey]: true,
          },
        });

        // 2. Check network and sync
        if (userId) {
          try {
            const netState = await NetInfo.fetch();

            if (netState.isConnected && netState.isInternetReachable) {
              // 3. Online: Sync to Supabase immediately
              await get().syncToSupabase(userId);
            } else {
              // 4. Offline: Add to pending queue
              get().addToPendingQueue(state.dateKey, newStatus);
            }
          } catch (error) {
            // On error, add to pending queue for later retry
            console.warn("Sync error, queued for later:", error);
            get().addToPendingQueue(state.dateKey, newStatus);
          }
        }
      },

      resetForDate: (date) =>
        set((state) => ({
          dateKey: getDateKey(date),
          times: null,
          status: createDefaultStatus(),
          logs: {
            ...state.logs,
            [getDateKey(date)]: createDefaultStatus(),
          },
          dirtyDates: {
            ...state.dirtyDates,
            [getDateKey(date)]: true,
          },
        })),
      syncDate: (date = new Date()) => {
        const currentKey = getDateKey(date);
        const state = get();

        if (state.dateKey === currentKey) {
          return;
        }

        const nextStatus = state.logs[currentKey] ?? createDefaultStatus();

        set({
          dateKey: currentKey,
          status: nextStatus,
          times: null,
          logs: {
            ...state.logs,
            [currentKey]: nextStatus,
          },
        });
      },
      getDirtyDates: () => {
        const state = get();
        return Object.keys(state.dirtyDates);
      },
      markSyncedDates: (dates) =>
        set((state) => {
          if (!dates.length) {
            return state;
          }

          const nextDirty = { ...state.dirtyDates };
          dates.forEach((date) => {
            delete nextDirty[date];
          });

          return { ...state, dirtyDates: nextDirty };
        }),
      setCalculationMethod: (value) => set({ calculationMethod: value }),
      setMadhab: (value) => set({ madhab: value }),
      setHijriOffset: (value) => set({ hijriOffset: value }),
      setAutoLocation: (value) => set({ autoLocation: value }),
      setAutoHijriSync: (value) => set({ autoHijriSync: value }),
      getStatusForDate: (date) => {
        const dateKey = getDateKey(date);
        const state = get();
        return state.logs[dateKey] ?? createDefaultStatus();
      },
      getStreak: (date = new Date()) => {
        const state = get();
        let streak = 0;
        let cursor = new Date(date);

        while (true) {
          const key = getDateKey(cursor);
          const status = state.logs[key];
          if (!status || !isComplete(status)) {
            break;
          }
          streak += 1;
          cursor = new Date(cursor);
          cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
      },

      getTotalPrayers: () => {
        const state = get();
        let total = 0;

        Object.values(state.logs).forEach((status) => {
          if (status.fajr) total++;
          if (status.dhuhr) total++;
          if (status.asr) total++;
          if (status.maghrib) total++;
          if (status.isha) total++;
        });

        return total;
      },

      // === SYNC ENGINE ===

      // Add item to pending sync queue (for offline mode)
      addToPendingQueue: (dateKey, status) =>
        set((state) => {
          // Remove existing entry for same date
          const filtered = state.pendingSyncQueue.filter(
            (item) => item.dateKey !== dateKey,
          );
          return {
            pendingSyncQueue: [
              ...filtered,
              { dateKey, status, timestamp: Date.now() },
            ],
          };
        }),

      // Sync current dirty dates to Supabase
      syncToSupabase: async (userId) => {
        const state = get();
        const dirtyDates = state.getDirtyDates();

        if (!dirtyDates.length || state.isSyncing) return;

        set({ isSyncing: true });

        try {
          const records = dirtyDates.map((dateKey) => ({
            user_id: userId,
            date: dateKey,
            fajr: state.logs[dateKey]?.fajr ?? false,
            dhuhr: state.logs[dateKey]?.dhuhr ?? false,
            asr: state.logs[dateKey]?.asr ?? false,
            maghrib: state.logs[dateKey]?.maghrib ?? false,
            isha: state.logs[dateKey]?.isha ?? false,
            synced_at: new Date().toISOString(),
          }));

          const { error } = await supabase.from("daily_logs").upsert(records, {
            onConflict: "user_id,date",
            ignoreDuplicates: false,
          });

          if (error) {
            console.error("Sync to Supabase failed:", error);
            throw error;
          }

          // Mark as synced
          state.markSyncedDates(dirtyDates);
          set({
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          set({ isSyncing: false });
          throw error;
        }
      },

      // Fetch logs from Supabase (initial load or refresh)
      fetchFromSupabase: async (userId) => {
        try {
          const { data, error } = await supabase
            .from("daily_logs")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .limit(60); // Last 60 days

          if (error) {
            console.error("Fetch from Supabase failed:", error);
            return;
          }

          if (data && data.length > 0) {
            const newLogs: PrayerLogMap = {};
            const todayKey = new Date().toISOString().split("T")[0];

            data.forEach((row) => {
              newLogs[row.date] = {
                fajr: row.fajr ?? false,
                dhuhr: row.dhuhr ?? false,
                asr: row.asr ?? false,
                maghrib: row.maghrib ?? false,
                isha: row.isha ?? false,
              };
            });

            // Déterminer si le local est "vide" (pas de données pour aujourd'hui)
            const state = get();
            const hasLocalDataForToday =
              state.logs[todayKey] &&
              Object.values(state.logs[todayKey]).some((v) => v === true);

            set((prevState) => {
              // Si pas de données locales pour aujourd'hui, serveur prend la priorité
              // Sinon, local prend la priorité (pour ne pas perdre les modifications offline)
              const mergedLogs = hasLocalDataForToday
                ? { ...newLogs, ...prevState.logs }
                : { ...prevState.logs, ...newLogs };

              // Mettre à jour le status du jour avec les données fusionnées
              const todayStatus = mergedLogs[todayKey] || createDefaultStatus();

              return {
                logs: mergedLogs,
                status: todayStatus,
                lastSyncedAt: new Date().toISOString(),
              };
            });

            console.log(
              "[fetchFromSupabase] Loaded",
              data.length,
              "days from server",
            );
          }
        } catch (error) {
          console.error("Fetch error:", error);
        }
      },

      // Process pending queue when back online
      processPendingQueue: async (userId) => {
        const state = get();
        const queue = state.pendingSyncQueue;

        if (!queue.length || state.isSyncing) return;

        set({ isSyncing: true });

        try {
          const records = queue.map((item) => ({
            user_id: userId,
            date: item.dateKey,
            fajr: item.status.fajr,
            dhuhr: item.status.dhuhr,
            asr: item.status.asr,
            maghrib: item.status.maghrib,
            isha: item.status.isha,
            synced_at: new Date().toISOString(),
          }));

          const { error } = await supabase.from("daily_logs").upsert(records, {
            onConflict: "user_id,date",
            ignoreDuplicates: false,
          });

          if (error) {
            console.error("Process queue failed:", error);
            throw error;
          }

          // Clear processed queue
          set({
            pendingSyncQueue: [],
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          set({ isSyncing: false });
          // Keep queue for retry
        }
      },

      // Réinitialiser toutes les données utilisateur (appelé lors du logout)
      clearAllData: () => {
        console.log("[PrayerStore] Clearing all data...");
        const today = format(new Date(), "yyyy-MM-dd");
        set({
          // Reset prayer tracking
          dateKey: today,
          status: createDefaultStatus(),
          logs: {},
          dirtyDates: {},

          // Reset sync
          pendingSyncQueue: [],
          lastSyncedAt: null,

          // Garder les paramètres de calcul (ne pas réinitialiser)
          // calculationMethod, madhab, hijriOffset, autoLocation, autoHijriSync
        });
      },
    }),
    {
      name: "prayer-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Location (persisté pour fallback offline)
        location: state.location,

        // Prayer tracking
        dateKey: state.dateKey,
        status: state.status,
        logs: state.logs,
        dirtyDates: state.dirtyDates,
        hijriDate: state.hijriDate,

        // Sync queue (offline first)
        pendingSyncQueue: state.pendingSyncQueue,
        lastSyncedAt: state.lastSyncedAt,

        // Settings
        calculationMethod: state.calculationMethod,
        hijriOffset: state.hijriOffset,
        autoLocation: state.autoLocation,
        autoHijriSync: state.autoHijriSync,
      }),
    },
  ),
);

export default usePrayerStore;
