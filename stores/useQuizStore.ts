import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      },

      resetSession: () => {
        set({ session: null });
      },
    }),
    {
      name: "quiz-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ stats: state.stats }),
    }
  )
);

export default useQuizStore;
