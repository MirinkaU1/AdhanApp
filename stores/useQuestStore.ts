/**
 * useQuestStore - Store pour le système de quêtes et gamification
 *
 * Gère :
 * - XP et niveaux
 * - Quêtes journalières
 * - Historique des récompenses
 * - Tracking des XP déjà gagnés (évite les doubles)
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import useCoinsStore from "@/stores/useCoinsStore";
import useThemeStore from "@/stores/useThemeStore";
import { APP_THEMES } from "@/constants/appThemes";
import type { CoinAwardReason } from "@/lib/themeEconomy";

// =====================================================
// TYPES
// =====================================================

export type PrayerNameXp = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type QuestId =
  | "pray_fajr"
  | "pray_all_5"
  | "complete_streak_3"
  | "complete_streak_7"
  | "pray_on_time"
  | "first_prayer_today";

export type QuestStatus = "locked" | "active" | "completed" | "claimed";

export interface Quest {
  id: QuestId;
  titleKey: string;
  descriptionKey: string;
  xpReward: number;
  icon: string;
  requirement: number;
  progress: number;
  status: QuestStatus;
  isDaily: boolean;
}

export interface XpGain {
  amount: number;
  reason: string;
  timestamp: number;
}

export interface LevelUpNotification {
  newLevel: number;
  levelName: string;
  timestamp: number;
}

// Tracking des XP gagnés par jour pour éviter les doubles
export interface DailyXpTracking {
  dateKey: string;
  prayersRewarded: Record<PrayerNameXp, boolean>;
  allFiveBonus: boolean;
  fajrBonus: boolean;
}

interface QuestStoreState {
  // XP & Level
  xp: number;
  level: number;
  xpToNextLevel: number;
  totalXpEarned: number;

  // Daily Quests
  dailyQuests: Record<QuestId, Quest>;
  lastQuestResetDate: string;

  // Daily XP Tracking (évite les doubles)
  dailyXpTracking: DailyXpTracking;

  // XP History (for toast notifications)
  pendingXpGains: XpGain[];
  xpHistory: XpGain[];

  // Level Up notifications
  pendingLevelUp: LevelUpNotification | null;

  // Hydration
  _hasHydrated: boolean;

  // Actions
  addXp: (amount: number, reason: string, showToast?: boolean) => void;
  // Debug / test (n'altère pas l'XP)
  enqueueXpToast: (amount: number, reason: string) => void;
  enqueueLevelUpToast: (level?: number) => void;
  addPrayerXp: (prayerName: PrayerNameXp) => boolean;
  addAllFiveBonusXp: () => boolean;
  addFajrBonusXp: () => boolean;
  claimQuestReward: (questId: QuestId) => boolean;
  updateQuestProgress: (questId: QuestId, progress: number) => void;
  completeQuest: (questId: QuestId) => void;
  resetDailyQuests: () => void;
  checkAndResetDailyQuests: () => void;
  consumePendingXpGain: () => XpGain | null;
  consumePendingLevelUp: () => LevelUpNotification | null;
  getUnclaimedQuestsCount: () => number;
  syncFromServer: (
    serverXp: number,
    serverLevel: number,
    serverTotalXpEarned?: number,
  ) => void;
  rebuildDailyXpTrackingFromLogs: (
    todayLogs: {
      fajr: boolean;
      dhuhr: boolean;
      asr: boolean;
      maghrib: boolean;
      isha: boolean;
    } | null,
  ) => void;
  clearAllData: () => void;

  // Helpers
  getLevelFromXp: (xp: number) => {
    level: number;
    xpInLevel: number;
    xpToNext: number;
  };
  getXpForLevel: (level: number) => number;
}

// =====================================================
// CONSTANTS
// =====================================================

const XP_PER_LEVEL_BASE = 100;
const XP_MULTIPLIER = 1.5;

export const XP_REWARDS = {
  PRAYER_COMPLETED: 2,
  ALL_PRAYERS_COMPLETED: 50,
  STREAK_DAY: 20,
  QUEST_BONUS: 25,
  FAJR_BONUS: 10,
};

const QUEST_COIN_REWARD_REASONS: Record<QuestId, CoinAwardReason> = {
  first_prayer_today: "quest_first_prayer_today",
  pray_fajr: "quest_pray_fajr",
  pray_all_5: "quest_pray_all_5",
  pray_on_time: "quest_pray_on_time",
  complete_streak_3: "quest_complete_streak_3",
  complete_streak_7: "quest_complete_streak_7",
};

// Noms des niveaux (rangs)
export const LEVEL_NAMES: Record<number, string> = {
  1: "Débutant",
  2: "Apprenti",
  3: "Pratiquant",
  4: "Assidu",
  5: "Dévoué",
  6: "Pieux",
  7: "Vertueux",
  8: "Exemplaire",
  9: "Sage",
  10: "Maître",
  11: "Érudit",
  12: "Guide",
  13: "Lumière",
  14: "Étoile",
  15: "Légende",
};

// Obtenir le nom du niveau (avec fallback)
export const getLevelName = (level: number): string => {
  if (level <= 15) return LEVEL_NAMES[level] || `Niveau ${level}`;
  return `Légende ${level - 14}`; // Après niveau 15: Légende 1, Légende 2, etc.
};

const getDateKey = () => format(new Date(), "yyyy-MM-dd");

const createDefaultDailyXpTracking = (): DailyXpTracking => ({
  dateKey: getDateKey(),
  prayersRewarded: {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  },
  allFiveBonus: false,
  fajrBonus: false,
});

const createDefaultDailyQuests = (): Record<QuestId, Quest> => ({
  first_prayer_today: {
    id: "first_prayer_today",
    titleKey: "quests.firstPrayer.title",
    descriptionKey: "quests.firstPrayer.description",
    xpReward: 15,
    icon: "wb-sunny",
    requirement: 1,
    progress: 0,
    status: "active",
    isDaily: true,
  },
  pray_fajr: {
    id: "pray_fajr",
    titleKey: "quests.prayFajr.title",
    descriptionKey: "quests.prayFajr.description",
    xpReward: 25,
    icon: "dark-mode",
    requirement: 1,
    progress: 0,
    status: "active",
    isDaily: true,
  },
  pray_all_5: {
    id: "pray_all_5",
    titleKey: "quests.prayAll5.title",
    descriptionKey: "quests.prayAll5.description",
    xpReward: 75,
    icon: "star",
    requirement: 5,
    progress: 0,
    status: "active",
    isDaily: true,
  },
  pray_on_time: {
    id: "pray_on_time",
    titleKey: "quests.prayOnTime.title",
    descriptionKey: "quests.prayOnTime.description",
    xpReward: 30,
    icon: "schedule",
    requirement: 3,
    progress: 0,
    status: "active",
    isDaily: true,
  },
  complete_streak_3: {
    id: "complete_streak_3",
    titleKey: "quests.streak3.title",
    descriptionKey: "quests.streak3.description",
    xpReward: 100,
    icon: "local-fire-department",
    requirement: 3,
    progress: 0,
    status: "active",
    isDaily: false,
  },
  complete_streak_7: {
    id: "complete_streak_7",
    titleKey: "quests.streak7.title",
    descriptionKey: "quests.streak7.description",
    xpReward: 250,
    icon: "emoji-events",
    requirement: 7,
    progress: 0,
    status: "locked",
    isDaily: false,
  },
});

// =====================================================
// STORE
// =====================================================

const useQuestStore = create<QuestStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      xp: 0,
      level: 1,
      xpToNextLevel: XP_PER_LEVEL_BASE,
      totalXpEarned: 0,
      dailyQuests: createDefaultDailyQuests(),
      lastQuestResetDate: getDateKey(),
      dailyXpTracking: createDefaultDailyXpTracking(),
      pendingXpGains: [],
      xpHistory: [],
      pendingLevelUp: null,
      _hasHydrated: false,

      getLevelFromXp: (totalXp: number) => {
        let level = 1;
        let xpRequired = XP_PER_LEVEL_BASE;
        let xpSpent = 0;

        while (totalXp >= xpSpent + xpRequired) {
          xpSpent += xpRequired;
          level++;
          xpRequired = Math.floor(
            XP_PER_LEVEL_BASE * Math.pow(XP_MULTIPLIER, level - 1),
          );
        }

        return {
          level,
          xpInLevel: totalXp - xpSpent,
          xpToNext: xpRequired,
        };
      },

      getXpForLevel: (level: number) => {
        return Math.floor(
          XP_PER_LEVEL_BASE * Math.pow(XP_MULTIPLIER, level - 1),
        );
      },

      // Add XP interne (showToast = false par défaut pour les XP silencieux)
      addXp: (amount: number, reason: string, showToast: boolean = false) => {
        const state = get();
        const previousLevel = state.level;
        const newTotalXp = state.xp + amount;
        const { level, xpInLevel, xpToNext } = state.getLevelFromXp(newTotalXp);

        const xpGain: XpGain = {
          amount,
          reason,
          timestamp: Date.now(),
        };

        // Détecter le passage de niveau
        const hasLeveledUp = level > previousLevel;
        const levelUpNotification: LevelUpNotification | null = hasLeveledUp
          ? {
              newLevel: level,
              levelName: getLevelName(level),
              timestamp: Date.now(),
            }
          : null;

        set({
          xp: newTotalXp,
          level,
          xpToNextLevel: xpToNext,
          totalXpEarned: state.totalXpEarned + amount,
          pendingXpGains: showToast
            ? [...state.pendingXpGains, xpGain]
            : state.pendingXpGains,
          xpHistory: [xpGain, ...state.xpHistory.slice(0, 49)],
          pendingLevelUp: levelUpNotification || state.pendingLevelUp,
        });

        // Récompenses au passage de niveau
        if (hasLeveledUp) {
          void useCoinsStore
            .getState()
            .awardCoins("level_up", `level_up:${level}`);
          // Débloquer les thèmes dont le niveau requis est atteint
          const themeStore = useThemeStore.getState();
          APP_THEMES.forEach((theme) => {
            if (
              theme.unlock.type === "level" &&
              level >= theme.unlock.level &&
              !themeStore.isThemeUnlocked(theme.id)
            ) {
              themeStore.unlockTheme(theme.id);
            }
          });
        }
      },

      // Debug: déclencher un toast XP sans modifier l'XP
      enqueueXpToast: (amount: number, reason: string) => {
        const xpGain: XpGain = {
          amount,
          reason,
          timestamp: Date.now(),
        };
        set((state) => ({
          pendingXpGains: [...state.pendingXpGains, xpGain],
          xpHistory: [xpGain, ...state.xpHistory.slice(0, 49)],
        }));
      },

      // Debug: déclencher un toast Level Up sans modifier l'XP
      enqueueLevelUpToast: (level?: number) => {
        const state = get();
        const newLevel = level ?? state.level + 1;
        const levelUpNotification: LevelUpNotification = {
          newLevel,
          levelName: getLevelName(newLevel),
          timestamp: Date.now(),
        };
        set((s) => ({
          pendingLevelUp: levelUpNotification || s.pendingLevelUp,
        }));
      },

      // Add prayer XP avec vérification anti-doublon
      addPrayerXp: (prayerName: PrayerNameXp) => {
        const state = get();
        const today = getDateKey();

        // Reset tracking si nouveau jour
        let tracking = state.dailyXpTracking;
        if (tracking.dateKey !== today) {
          tracking = createDefaultDailyXpTracking();
          set({ dailyXpTracking: tracking });
        }

        // Vérifier si déjà récompensé
        if (tracking.prayersRewarded[prayerName]) {
          return false;
        }

        // Marquer comme récompensé
        set({
          dailyXpTracking: {
            ...tracking,
            dateKey: today,
            prayersRewarded: {
              ...tracking.prayersRewarded,
              [prayerName]: true,
            },
          },
        });

        state.addXp(XP_REWARDS.PRAYER_COMPLETED, "prayer_completed");
        return true;
      },

      // Bonus 5/5 avec vérification
      addAllFiveBonusXp: () => {
        const state = get();
        const today = getDateKey();

        let tracking = state.dailyXpTracking;
        if (tracking.dateKey !== today) {
          tracking = createDefaultDailyXpTracking();
          set({ dailyXpTracking: tracking });
        }

        if (tracking.allFiveBonus) {
          return false;
        }

        set({
          dailyXpTracking: {
            ...tracking,
            dateKey: today,
            allFiveBonus: true,
          },
        });

        state.addXp(XP_REWARDS.ALL_PRAYERS_COMPLETED, "all_prayers_completed");
        return true;
      },

      // Bonus Fajr avec vérification
      addFajrBonusXp: () => {
        const state = get();
        const today = getDateKey();

        let tracking = state.dailyXpTracking;
        if (tracking.dateKey !== today) {
          tracking = createDefaultDailyXpTracking();
          set({ dailyXpTracking: tracking });
        }

        if (tracking.fajrBonus) {
          return false;
        }

        set({
          dailyXpTracking: {
            ...tracking,
            dateKey: today,
            fajrBonus: true,
          },
        });

        state.addXp(XP_REWARDS.FAJR_BONUS, "fajr_bonus");
        return true;
      },

      consumePendingXpGain: () => {
        const state = get();
        if (state.pendingXpGains.length === 0) return null;

        const [first, ...rest] = state.pendingXpGains;
        set({ pendingXpGains: rest });
        return first;
      },

      consumePendingLevelUp: () => {
        const state = get();
        if (!state.pendingLevelUp) return null;

        const levelUp = state.pendingLevelUp;
        set({ pendingLevelUp: null });
        return levelUp;
      },

      getUnclaimedQuestsCount: () => {
        const state = get();
        return Object.values(state.dailyQuests).filter(
          (quest) => quest.status === "completed",
        ).length;
      },

      updateQuestProgress: (questId: QuestId, progress: number) => {
        set((state) => {
          const quest = state.dailyQuests[questId];
          if (
            !quest ||
            quest.status === "completed" ||
            quest.status === "claimed"
          ) {
            return state;
          }

          const newProgress = Math.min(progress, quest.requirement);
          const isCompleted = newProgress >= quest.requirement;

          return {
            dailyQuests: {
              ...state.dailyQuests,
              [questId]: {
                ...quest,
                progress: newProgress,
                status: isCompleted ? "completed" : quest.status,
              },
            },
          };
        });
      },

      completeQuest: (questId: QuestId) => {
        set((state) => {
          const quest = state.dailyQuests[questId];
          if (!quest || quest.status !== "active") return state;

          return {
            dailyQuests: {
              ...state.dailyQuests,
              [questId]: {
                ...quest,
                progress: quest.requirement,
                status: "completed",
              },
            },
          };
        });
      },

      // Claim avec vérification anti-doublon
      claimQuestReward: (questId: QuestId) => {
        // Utiliser set avec callback pour garantir l'atomicité
        let xpToAdd = 0;
        let shouldUnlockNext = false;

        set((state) => {
          const quest = state.dailyQuests[questId];

          // Vérification stricte - DOIT être "completed", pas autre chose
          if (!quest || quest.status !== "completed") {
            return state; // Pas de changement
          }

          // Capturer l'XP à ajouter
          xpToAdd = quest.xpReward;
          shouldUnlockNext = questId === "complete_streak_3";

          // Marquer IMMEDIATEMENT comme claimed
          return {
            dailyQuests: {
              ...state.dailyQuests,
              [questId]: {
                ...quest,
                status: "claimed" as const,
              },
            },
          };
        });

        // Si xpToAdd > 0, c'est qu'on a bien fait le claim
        if (xpToAdd > 0) {
          get().addXp(xpToAdd, `quest_${questId}`, true);
          const coinReason = QUEST_COIN_REWARD_REASONS[questId];
          if (coinReason) {
            void useCoinsStore
              .getState()
              .awardCoins(coinReason, `quest:${questId}:${getDateKey()}`);
          }

          // Débloquer quête suivante
          if (shouldUnlockNext) {
            set((s) => ({
              dailyQuests: {
                ...s.dailyQuests,
                complete_streak_7: {
                  ...s.dailyQuests.complete_streak_7,
                  status: "active",
                },
              },
            }));
          }
          return true;
        }

        return false;
      },

      // Synchroniser les données depuis le serveur (au login)
      // Prend le max entre local et serveur pour éviter de perdre des données
      syncFromServer: (
        serverXp: number,
        serverLevel: number,
        serverTotalXpEarned?: number,
      ) => {
        const state = get();
        const localXp = state.xp;
        const localLevel = state.level;
        const localTotalXpEarned = state.totalXpEarned;

        // Prendre le maximum pour ne pas perdre de progression
        const finalXp = Math.max(localXp, serverXp);
        const finalLevel = Math.max(localLevel, serverLevel);
        const finalTotalXpEarned = Math.max(
          localTotalXpEarned,
          serverTotalXpEarned || 0,
        );

        console.log("[QuestStore] syncFromServer:", {
          serverXp,
          serverLevel,
          serverTotalXpEarned,
          localXp,
          localLevel,
          localTotalXpEarned,
          finalXp,
          finalLevel,
          finalTotalXpEarned,
        });

        // Mettre à jour seulement si nécessaire
        if (
          finalXp !== localXp ||
          finalLevel !== localLevel ||
          finalTotalXpEarned !== localTotalXpEarned
        ) {
          set({
            xp: finalXp,
            level: finalLevel,
            xpToNextLevel: state.getXpForLevel(finalLevel),
            totalXpEarned: finalTotalXpEarned,
          });
        }

        // Debloquer les themes conditionnes par niveau meme sans nouveau level-up local
        const themeStore = useThemeStore.getState();
        APP_THEMES.forEach((theme) => {
          if (
            theme.unlock.type === "level" &&
            finalLevel >= theme.unlock.level &&
            !themeStore.isThemeUnlocked(theme.id)
          ) {
            themeStore.unlockTheme(theme.id);
          }
        });
      },

      resetDailyQuests: () => {
        const defaultQuests = createDefaultDailyQuests();
        const state = get();

        const newQuests = { ...defaultQuests };

        // Préserver les quêtes de série
        if (state.dailyQuests.complete_streak_3.status === "claimed") {
          newQuests.complete_streak_3 = state.dailyQuests.complete_streak_3;
        }
        if (state.dailyQuests.complete_streak_7.status !== "locked") {
          newQuests.complete_streak_7 = {
            ...state.dailyQuests.complete_streak_7,
            status:
              state.dailyQuests.complete_streak_7.status === "claimed"
                ? "claimed"
                : "active",
          };
        }

        set({
          dailyQuests: newQuests,
          lastQuestResetDate: getDateKey(),
          dailyXpTracking: createDefaultDailyXpTracking(),
        });
      },

      checkAndResetDailyQuests: () => {
        const state = get();
        const today = getDateKey();

        if (state.lastQuestResetDate !== today) {
          state.resetDailyQuests();
        }
      },

      // Reconstruire dailyXpTracking à partir des logs du jour (évite XP infini)
      // Appelé après fetchFromSupabase pour synchroniser le tracking avec les données serveur
      rebuildDailyXpTrackingFromLogs: (todayLogs) => {
        const today = getDateKey();

        if (!todayLogs) {
          // Pas de logs pour aujourd'hui, reset le tracking
          console.log(
            "[QuestStore] No logs for today, resetting dailyXpTracking",
          );
          set({ dailyXpTracking: createDefaultDailyXpTracking() });
          return;
        }

        // Reconstruire le tracking basé sur les prières déjà cochées
        const prayersRewarded = {
          fajr: todayLogs.fajr,
          dhuhr: todayLogs.dhuhr,
          asr: todayLogs.asr,
          maghrib: todayLogs.maghrib,
          isha: todayLogs.isha,
        };

        // Compter les prières cochées
        const prayerCount = Object.values(todayLogs).filter(Boolean).length;
        const allFiveCompleted = prayerCount === 5;

        console.log("[QuestStore] Rebuilding dailyXpTracking from logs:", {
          todayLogs,
          prayersRewarded,
          allFiveCompleted,
        });

        set({
          dailyXpTracking: {
            dateKey: today,
            prayersRewarded,
            allFiveBonus: allFiveCompleted,
            fajrBonus: todayLogs.fajr,
          },
        });
      },

      // Réinitialiser toutes les données (appelé lors du logout)
      clearAllData: () => {
        console.log("[QuestStore] Clearing all data...");
        set({
          xp: 0,
          level: 1,
          xpToNextLevel: XP_PER_LEVEL_BASE,
          totalXpEarned: 0,
          dailyQuests: createDefaultDailyQuests(),
          lastQuestResetDate: getDateKey(),
          dailyXpTracking: createDefaultDailyXpTracking(),
          pendingXpGains: [],
          xpHistory: [],
          pendingLevelUp: null,
        });
      },
    }),
    {
      name: "quest-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        xpToNextLevel: state.xpToNextLevel,
        totalXpEarned: state.totalXpEarned,
        dailyQuests: state.dailyQuests,
        lastQuestResetDate: state.lastQuestResetDate,
        dailyXpTracking: state.dailyXpTracking,
        xpHistory: state.xpHistory,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    },
  ),
);

export default useQuestStore;
