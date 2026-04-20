/**
 * useRamadanQuestTracker
 *
 * Observe les changements de lecture (useQuranStore.readingTracking)
 * et met à jour automatiquement la progression des quêtes Ramadan hebdomadaires.
 *
 * À monter une seule fois dans le layout racine (_layout.tsx).
 */

import { useEffect } from "react";
import { useQuranStore } from "@/stores/useQuranStore";
import useQuestStore from "@/stores/useQuestStore";

export function useRamadanQuestTracker() {
  const readingTracking = useQuranStore((s) => s.readingTracking);
  const updateRamadanQuestProgress = useQuestStore((s) => s.updateRamadanQuestProgress);
  const checkAndResetWeeklyQuests   = useQuestStore((s) => s.checkAndResetWeeklyQuests);

  // Réinitialiser les quêtes hebdomadaires si on est dans une nouvelle semaine
  useEffect(() => {
    checkAndResetWeeklyQuests();
  }, [readingTracking.weekKey]);

  // Quête : Juz de la semaine (240 versets)
  useEffect(() => {
    updateRamadanQuestProgress(
      "ramadan_week_juz",
      readingTracking.weeklyVersesRead,
    );
  }, [readingTracking.weeklyVersesRead]);

  // Quête : Tour du Coran — 10 sourates différentes
  useEffect(() => {
    updateRamadanQuestProgress(
      "ramadan_week_surahs",
      readingTracking.weeklyDistinctSurahs.length,
    );
  }, [readingTracking.weeklyDistinctSurahs.length]);
}
