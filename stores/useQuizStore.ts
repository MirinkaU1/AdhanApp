import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

// =====================================================
// CONSTANTS
// =====================================================

export const COINS_PER_CORRECT = 2;

// =====================================================
// TYPES
// =====================================================

export interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  anecdote: string;
}

export interface QuizCategoryStats {
  played: number;
  bestScore: number;
  bestTotal: number;
  lastPlayedAt: number | null;
}

export interface QuizSession {
  category: string;
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  coinsEarned: number;
  answers: (number | null)[];
  startedAt: number;
  isComplete: boolean;
}

interface QuizStoreState {
  stats: Record<string, QuizCategoryStats>;
  session: QuizSession | null;

  startSession: (category: string, questions: QuizQuestion[]) => void;
  recordAnswer: (answerIndex: number | null) => void;
  nextQuestion: () => void;
  endSession: () => void;
  resetSession: () => void;
  syncWithSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  clearAllData: () => void;
}

function mergeQuizStats(
  localStats: Record<string, QuizCategoryStats>,
  remoteStats: Record<string, QuizCategoryStats>,
): Record<string, QuizCategoryStats> {
  const merged: Record<string, QuizCategoryStats> = {};
  const categories = new Set([
    ...Object.keys(localStats || {}),
    ...Object.keys(remoteStats || {}),
  ]);

  categories.forEach((category) => {
    const local = localStats[category];
    const remote = remoteStats[category];

    if (!local && remote) {
      merged[category] = remote;
      return;
    }

    if (!remote && local) {
      merged[category] = local;
      return;
    }

    if (local && remote) {
      const bestScore = Math.max(local.bestScore || 0, remote.bestScore || 0);
      const bestTotal =
        bestScore === (local.bestScore || 0)
          ? local.bestTotal || 0
          : remote.bestTotal || 0;
      const lastPlayedAtCandidate = Math.max(
        local.lastPlayedAt || 0,
        remote.lastPlayedAt || 0,
      );

      merged[category] = {
        played: Math.max(local.played || 0, remote.played || 0),
        bestScore,
        bestTotal,
        lastPlayedAt: lastPlayedAtCandidate > 0 ? lastPlayedAtCandidate : null,
      };
    }
  });

  return merged;
}

// =====================================================
// STORE
// =====================================================

const useQuizStore = create<QuizStoreState>()(
  persist(
    (set, get) => ({
      stats: {},
      session: null,

      startSession: (category, questions) => {
        set({
          session: {
            category,
            questions,
            currentIndex: 0,
            score: 0,
            coinsEarned: 0,
            answers: new Array(questions.length).fill(null),
            startedAt: Date.now(),
            isComplete: false,
          },
        });
      },

      recordAnswer: (answerIndex) => {
        const { session } = get();
        if (!session) return;

        const question = session.questions[session.currentIndex];
        const isCorrect =
          answerIndex !== null && answerIndex === question.correctIndex;

        const newAnswers = [...session.answers];
        newAnswers[session.currentIndex] = answerIndex;

        set({
          session: {
            ...session,
            answers: newAnswers,
            score: isCorrect ? session.score + 1 : session.score,
            coinsEarned: isCorrect
              ? session.coinsEarned + COINS_PER_CORRECT
              : session.coinsEarned,
          },
        });
      },

      nextQuestion: () => {
        const { session } = get();
        if (!session) return;

        const nextIndex = session.currentIndex + 1;

        if (nextIndex >= session.questions.length) {
          const { stats } = get();
          const categoryStats = stats[session.category] || {
            played: 0,
            bestScore: 0,
            bestTotal: 0,
            lastPlayedAt: null,
          };

          set({
            session: { ...session, isComplete: true },
            stats: {
              ...stats,
              [session.category]: {
                played: categoryStats.played + 1,
                bestScore:
                  session.score > categoryStats.bestScore
                    ? session.score
                    : categoryStats.bestScore,
                bestTotal: session.questions.length,
                lastPlayedAt: Date.now(),
              },
            },
          });
          void get().syncWithSupabase();
        } else {
          set({
            session: { ...session, currentIndex: nextIndex },
          });
        }
      },

      endSession: () => {
        const { session, stats } = get();
        if (!session || session.isComplete) return;

        const categoryStats = stats[session.category] || {
          played: 0,
          bestScore: 0,
          bestTotal: 0,
          lastPlayedAt: null,
        };

        set({
          session: { ...session, isComplete: true },
          stats: {
            ...stats,
            [session.category]: {
              played: categoryStats.played + 1,
              bestScore:
                session.score > categoryStats.bestScore
                  ? session.score
                  : categoryStats.bestScore,
              bestTotal: session.questions.length,
              lastPlayedAt: Date.now(),
            },
          },
        });
        void get().syncWithSupabase();
      },

      resetSession: () => {
        set({ session: null });
      },

      syncWithSupabase: async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          await supabase.from("quiz_progress").upsert(
            {
              user_id: user.id,
              stats: get().stats,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        } catch (error) {
          console.error("Erreur sync quiz:", error);
        }
      },

      loadFromSupabase: async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const localStats = get().stats;
          const { data, error } = await supabase
            .from("quiz_progress")
            .select("stats")
            .eq("user_id", user.id)
            .single();

          if (error && error.code !== "PGRST116") {
            throw error;
          }

          const remoteStats =
            (data?.stats as Record<string, QuizCategoryStats> | null) || {};
          const mergedStats = mergeQuizStats(localStats, remoteStats);

          set({ stats: mergedStats });

          if (
            Object.keys(localStats).length > 0 ||
            Object.keys(remoteStats).length > 0
          ) {
            await get().syncWithSupabase();
          }
        } catch (error) {
          console.error("Erreur load quiz:", error);
        }
      },

      clearAllData: () => {
        set({ stats: {}, session: null });
      },
    }),
    {
      name: "quiz-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ stats: state.stats }),
    },
  ),
);

export default useQuizStore;
