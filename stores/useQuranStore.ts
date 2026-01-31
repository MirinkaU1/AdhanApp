// Store de progression Quran avec sync Supabase
import { ReactNode } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export interface FavoriteVerse {
  surahId: number;
  surahName: string;
  surahTransliteration: string;
  verseNumber: number;
  verseText: string;
  verseTranslation: string;
  addedAt: string;
}

export interface SurahProgress {
  transliteration: string;
  translation: string;
  surahId: number;
  surahName: string;
  currentVerse: number;
  totalVerses: number;
  percentage: number;
  lastReadAt: string;
  isCompleted: boolean;
  versesRead: number[];
}

export interface QuranStats {
  totalReadingTime: number;
  totalVersesRead: number;
  totalSurahsRead: number;
  currentStreak: number;
  lastReadDate: string | null;
}

interface QuranState {
  progress: Record<number, SurahProgress>;
  favoriteVerses: FavoriteVerse[];
  stats: QuranStats;
  lastPosition: {
    surahId: number;
    verseId: number;
    timestamp: string;
  } | null;

  updateProgress: (
    surahId: number,
    verseId: number,
    totalVerses: number,
    surahName: string,
  ) => void;
  unmarkVerse: (surahId: number, verseId: number) => void;
  markAsCompleted: (surahId: number) => void;
  getSurahProgress: (surahId: number) => SurahProgress | null;
  getLastReading: () => SurahProgress | null;
  addReadingTime: (minutes: number) => void;
  resetProgress: () => void;
  addToFavorites: (verse: Omit<FavoriteVerse, "addedAt">) => void;
  removeFromFavorites: (surahId: number, verseNumber: number) => void;
  isFavorite: (surahId: number, verseNumber: number) => boolean;
  getAllFavorites: () => FavoriteVerse[];
  syncWithSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
}

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      progress: {},
      favoriteVerses: [],
      stats: {
        totalReadingTime: 0,
        totalVersesRead: 0,
        totalSurahsRead: 0,
        currentStreak: 0,
        lastReadDate: null,
      },
      lastPosition: null,

      updateProgress: (surahId, verseId, totalVerses, surahName) => {
        const now = new Date().toISOString();
        const currentProgress = get().progress[surahId];

        const versesRead = currentProgress
          ? [...new Set([...currentProgress.versesRead, verseId])]
          : [verseId];

        const progress: SurahProgress = {
          surahId,
          surahName,
          currentVerse: verseId,
          totalVerses,
          percentage: Math.round((versesRead.length / totalVerses) * 100),
          lastReadAt: now,
          isCompleted: versesRead.length >= totalVerses,
          versesRead,
          transliteration: currentProgress?.transliteration || "",
          translation: currentProgress?.translation || "",
        };

        const today = new Date().toDateString();
        const lastReadDate = get().stats.lastReadDate;
        const isNewDay = lastReadDate !== today;

        const newStats = {
          ...get().stats,
          totalVersesRead:
            get().stats.totalVersesRead +
            (currentProgress?.versesRead.includes(verseId) ? 0 : 1),
          currentStreak: isNewDay
            ? lastReadDate === new Date(Date.now() - 86400000).toDateString()
              ? get().stats.currentStreak + 1
              : 1
            : get().stats.currentStreak,
          lastReadDate: today,
        };

        if (progress.isCompleted && !currentProgress?.isCompleted) {
          newStats.totalSurahsRead += 1;
        }

        set({
          progress: { ...get().progress, [surahId]: progress },
          stats: newStats,
          lastPosition: { surahId, verseId, timestamp: now },
        });

        get().syncWithSupabase();
      },

      unmarkVerse: (surahId, verseId) => {
        const currentProgress = get().progress[surahId];
        if (!currentProgress) return;

        const newVersesRead = currentProgress.versesRead.filter(
          (v) => v !== verseId,
        );

        const progress: SurahProgress = {
          ...currentProgress,
          versesRead: newVersesRead,
          percentage: Math.round(
            (newVersesRead.length / currentProgress.totalVerses) * 100,
          ),
          isCompleted: false,
        };

        set({
          progress: { ...get().progress, [surahId]: progress },
        });

        get().syncWithSupabase();
      },

      markAsCompleted: (surahId) => {
        const currentProgress = get().progress[surahId];
        if (!currentProgress) return;

        const progress: SurahProgress = {
          ...currentProgress,
          isCompleted: true,
          percentage: 100,
          versesRead: Array.from(
            { length: currentProgress.totalVerses },
            (_, i) => i + 1,
          ),
          lastReadAt: new Date().toISOString(),
        };

        const newStats = {
          ...get().stats,
          totalSurahsRead: currentProgress.isCompleted
            ? get().stats.totalSurahsRead
            : get().stats.totalSurahsRead + 1,
        };

        set({
          progress: { ...get().progress, [surahId]: progress },
          stats: newStats,
        });

        get().syncWithSupabase();
      },

      getSurahProgress: (surahId) => {
        return get().progress[surahId] || null;
      },

      getLastReading: () => {
        const { lastPosition, progress } = get();
        if (!lastPosition) return null;
        return progress[lastPosition.surahId] || null;
      },

      addReadingTime: (minutes) => {
        set({
          stats: {
            ...get().stats,
            totalReadingTime: get().stats.totalReadingTime + minutes,
          },
        });
        get().syncWithSupabase();
      },

      resetProgress: () => {
        set({
          progress: {},
          favoriteVerses: [],
          stats: {
            totalReadingTime: 0,
            totalVersesRead: 0,
            totalSurahsRead: 0,
            currentStreak: 0,
            lastReadDate: null,
          },
          lastPosition: null,
        });
      },

      addToFavorites: (verse) => {
        const favorites = get().favoriteVerses;
        const exists = favorites.some(
          (v) => v.surahId === verse.surahId && v.verseNumber === verse.verseNumber,
        );
        if (exists) return;

        const newFavorite: FavoriteVerse = {
          ...verse,
          addedAt: new Date().toISOString(),
        };

        set({ favoriteVerses: [...favorites, newFavorite] });
        get().syncWithSupabase();
      },

      removeFromFavorites: (surahId, verseNumber) => {
        const favorites = get().favoriteVerses;
        const filtered = favorites.filter(
          (v) => !(v.surahId === surahId && v.verseNumber === verseNumber),
        );
        set({ favoriteVerses: filtered });
        get().syncWithSupabase();
      },

      isFavorite: (surahId, verseNumber) => {
        return get().favoriteVerses.some(
          (v) => v.surahId === surahId && v.verseNumber === verseNumber,
        );
      },

      getAllFavorites: () => {
        return get().favoriteVerses;
      },

      syncWithSupabase: async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const state = get();

          await supabase.from("quran_progress").upsert(
            {
              user_id: user.id,
              progress: state.progress,
              stats: state.stats,
              last_position: state.lastPosition,
              favorite_verses: state.favoriteVerses,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            },
          );
        } catch (error) {
          console.error("Erreur sync Quran:", error);
        }
      },

      loadFromSupabase: async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { data } = await supabase
            .from("quran_progress")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (data) {
            set({
              progress: data.progress || {},
              favoriteVerses: data.favorite_verses || [],
              stats: data.stats || get().stats,
              lastPosition: data.last_position || null,
            });
          }
        } catch (error) {
          console.error("Erreur load Quran:", error);
        }
      },
    }),
    {
      name: "quran-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
