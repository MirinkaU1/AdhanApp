/**
 * SyncProvider - Composant qui gère la synchronisation des données avec Supabase
 *
 * Ce composant doit être placé dans le layout principal pour activer la sync.
 * Il ne rend rien visuellement mais gère :
 * - La synchronisation des logs de prière (daily_logs)
 * - La synchronisation du XP et niveau (profiles)
 * - Le calcul et sync de la streak
 * - La gestion offline-first avec queue de pending
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import { useSyncData } from "@/hooks/useSyncData";
import { useSyncDailyLogs } from "@/hooks/useSyncDailyLogs";
import useAuthStore from "@/stores/useAuthStore";
import usePrayerStore from "@/stores/usePrayerStore";
import useQuestStore from "@/stores/useQuestStore";
import { useQuranStore } from "@/stores/useQuranStore";
import { supabase } from "@/lib/supabase";

export default function SyncProvider() {
  const { user, isAuthenticated, updateXp, updateLevel } = useAuthStore();
  const { fetchFromSupabase, status, dateKey } = usePrayerStore();
  const { xp: questXp, level: questLevel, totalXpEarned } = useQuestStore();
  const { loadFromSupabase, syncWithSupabase } = useQuranStore();
  const appStateRef = useRef(AppState.currentState);
  const lastStreakSyncRef = useRef<string | null>(null);
  const lastQuranSyncRef = useRef<number>(0);

  // Hook de synchronisation réseau (gère online/offline)
  const { manualSync, hasPendingSync } = useSyncData();

  // Hook de synchronisation des logs quotidiens
  useSyncDailyLogs();

  // Charger la progression Quran au démarrage si connecté
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadFromSupabase();
    }
  }, [isAuthenticated, user?.id]);

  // Calculer et mettre à jour la streak côté serveur
  const updateStreak = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !supabase) return;

    try {
      // Appeler la fonction PostgreSQL pour calculer la streak
      const { data, error } = await supabase.rpc("calculate_streak", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("[SyncProvider] Failed to calculate streak:", error);
      } else {
        console.log("[SyncProvider] Streak calculated:", data);
      }
    } catch (error) {
      console.error("[SyncProvider] Streak calculation error:", error);
    }
  }, [isAuthenticated, user?.id]);

  // Sync quand l'app revient au premier plan
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // L'app revient au premier plan
        if (isAuthenticated && user?.id) {
          console.log("[SyncProvider] App active - checking for sync...");

          const netState = await NetInfo.fetch();
          if (netState.isConnected && netState.isInternetReachable) {
            // Rafraîchir les données depuis Supabase
            await fetchFromSupabase(user.id);

            // Sync les données locales non synchronisées
            if (hasPendingSync) {
              await manualSync();
            }

            // Recalculer la streak
            await updateStreak();

            // Charger la progression Quran depuis Supabase (toutes les 30 secondes max)
            const now = Date.now();
            if (now - lastQuranSyncRef.current > 30000) {
              lastQuranSyncRef.current = now;
              await loadFromSupabase();
            }
          }
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [
    isAuthenticated,
    user?.id,
    fetchFromSupabase,
    hasPendingSync,
    manualSync,
    updateStreak,
    loadFromSupabase,
  ]);

  // Calculer la streak quand le statut des prières change (toutes cochées)
  useEffect(() => {
    const allPrayed = Object.values(status).every(Boolean);
    const syncKey = `${dateKey}-${allPrayed}`;

    // Éviter les appels répétés pour le même état
    if (syncKey === lastStreakSyncRef.current) return;

    if (allPrayed && isAuthenticated && user?.id) {
      lastStreakSyncRef.current = syncKey;

      // Attendre que la sync des logs soit faite puis calculer la streak
      const timeoutId = setTimeout(async () => {
        const netState = await NetInfo.fetch();
        if (netState.isConnected && netState.isInternetReachable) {
          await updateStreak();
        }
      }, 3000); // Attendre 3s après sync des logs

      return () => clearTimeout(timeoutId);
    }
  }, [status, dateKey, isAuthenticated, user?.id, updateStreak]);

  // Synchroniser XP et Level de useQuestStore vers useAuthStore
  // Ceci permet de garder les deux stores en sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Mettre à jour useAuthStore avec les valeurs de useQuestStore
    if (user.xp !== questXp) {
      updateXp(questXp);
    }
    if (user.level !== questLevel) {
      updateLevel(questLevel);
    }
  }, [questXp, questLevel, isAuthenticated, user, updateXp, updateLevel]);

  // Sync XP et niveau vers Supabase quand ils changent
  useEffect(() => {
    const syncProfileToSupabase = async () => {
      if (!isAuthenticated || !user?.id || !supabase) return;

      // Utiliser les valeurs de useQuestStore (source de vérité)
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            xp: questXp,
            level: questLevel,
            total_xp_earned: totalXpEarned,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          console.error("[SyncProvider] Failed to sync profile:", error);
        } else {
          console.log("[SyncProvider] Profile synced (XP/Level/TotalXP):", {
            xp: questXp,
            level: questLevel,
            totalXpEarned,
          });
        }
      } catch (error) {
        console.error("[SyncProvider] Profile sync error:", error);
      }
    };

    // Débounce pour éviter trop d'appels
    const timeoutId = setTimeout(syncProfileToSupabase, 2000);

    return () => clearTimeout(timeoutId);
  }, [questXp, questLevel, totalXpEarned, user?.id, isAuthenticated]);

  // Rien à rendre visuellement
  return null;
}
