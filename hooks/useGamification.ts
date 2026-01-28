/**
 * useGamification - Hook pour gérer le système de gamification
 *
 * Gère :
 * - Gain d'XP lors des prières (anti-doublon intégré)
 * - Mise à jour des quêtes
 * - Vérification des séries
 */

import { useCallback } from "react";
import useQuestStore, { PrayerNameXp } from "@/stores/useQuestStore";
import usePrayerStore, { PrayerName } from "@/stores/usePrayerStore";

export function useGamification() {
  const {
    addPrayerXp,
    addFajrBonusXp,
    addAllFiveBonusXp,
    updateQuestProgress,
    checkAndResetDailyQuests,
  } = useQuestStore();

  /**
   * Appelé quand une prière est marquée comme faite
   */
  const onPrayerCompleted = useCallback(
    (prayerName: PrayerName, wasCompleted: boolean) => {
      // Si on décoche une prière, pas de récompense
      if (!wasCompleted) return;

      // Reset daily quests si nouveau jour
      checkAndResetDailyQuests();

      // IMPORTANT: Lire les valeurs fraîches depuis les stores
      // Car les valeurs du hook React ne sont pas encore mises à jour
      const freshPrayerStatus = usePrayerStore.getState().status;
      const freshQuests = useQuestStore.getState().dailyQuests;

      // 1. XP de base pour la prière (vérifie automatiquement les doublons)
      addPrayerXp(prayerName as PrayerNameXp);

      // 2. Bonus Fajr (vérifie automatiquement les doublons)
      if (prayerName === "fajr") {
        addFajrBonusXp();

        // Update quest: pray_fajr
        if (freshQuests.pray_fajr.status === "active") {
          updateQuestProgress("pray_fajr", 1);
        }
      }

      // 3. Compter les prières accomplies (valeur fraîche après toggle)
      const todayPrayers =
        Object.values(freshPrayerStatus).filter(Boolean).length;

      // 4. Vérifier si c'est la première prière du jour
      if (
        todayPrayers === 1 &&
        freshQuests.first_prayer_today.status === "active"
      ) {
        updateQuestProgress("first_prayer_today", 1);
      }

      // 5. Mettre à jour la quête "pray_all_5"
      if (freshQuests.pray_all_5.status === "active") {
        updateQuestProgress("pray_all_5", todayPrayers);
      }

      // 6. Vérifier si toutes les 5 prières sont complètes (bonus anti-doublon)
      if (todayPrayers === 5) {
        addAllFiveBonusXp();
      }

      // 7. Mettre à jour les quêtes de série
      const currentStreak = usePrayerStore.getState().getStreak();

      if (
        currentStreak >= 3 &&
        freshQuests.complete_streak_3.status === "active"
      ) {
        updateQuestProgress("complete_streak_3", currentStreak);
      }

      if (
        currentStreak >= 7 &&
        freshQuests.complete_streak_7.status === "active"
      ) {
        updateQuestProgress("complete_streak_7", currentStreak);
      }
    },
    [
      addPrayerXp,
      addFajrBonusXp,
      addAllFiveBonusXp,
      updateQuestProgress,
      checkAndResetDailyQuests,
    ],
  );

  /**
   * Marge en minutes pour considérer une prière "à l'heure"
   * La prière doit être cochée dans les 30 minutes après son heure de début
   */
  const ON_TIME_MARGIN_MINUTES = 30;

  /**
   * Vérifie si une prière est faite à l'heure et met à jour la quête
   * @param prayerTime - L'heure officielle de la prière
   */
  const checkPrayerOnTime = useCallback(
    (prayerTime: Date | null) => {
      if (!prayerTime) return;

      const now = new Date();
      const diffMs = now.getTime() - prayerTime.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      // La prière est "à l'heure" si elle est cochée dans les X minutes après son début
      // et pas avant l'heure (diffMinutes >= 0)
      if (diffMinutes >= 0 && diffMinutes <= ON_TIME_MARGIN_MINUTES) {
        const freshQuests = useQuestStore.getState().dailyQuests;
        if (freshQuests.pray_on_time.status === "active") {
          const current = freshQuests.pray_on_time.progress;
          updateQuestProgress("pray_on_time", current + 1);
        }
      }
    },
    [updateQuestProgress],
  );

  return {
    onPrayerCompleted,
    checkPrayerOnTime,
  };
}

export default useGamification;
