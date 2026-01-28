import { useEffect, useRef, useCallback } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import useAuthStore from "@/stores/useAuthStore";
import usePrayerStore from "@/stores/usePrayerStore";

/**
 * Hook that listens to network connectivity and syncs data when online.
 *
 * This implements the "Offline First" philosophy:
 * 1. All changes are saved locally immediately (AsyncStorage via Zustand)
 * 2. When online, changes are pushed to Supabase in the background
 * 3. When coming back online, pending changes are processed
 * 4. On initial load, data is fetched from Supabase to merge with local
 */
export function useSyncData() {
  const { user, isAuthenticated, refreshSession } = useAuthStore();
  const {
    pendingSyncQueue,
    processPendingQueue,
    fetchFromSupabase,
    syncToSupabase,
    getDirtyDates,
  } = usePrayerStore();

  const wasOfflineRef = useRef(false);
  const initialSyncDoneRef = useRef(false);

  // Process pending queue when coming back online
  const handleConnectivityChange = useCallback(
    async (state: NetInfoState) => {
      if (!user?.id) return;

      const isOnline = state.isConnected && state.isInternetReachable;

      if (isOnline && wasOfflineRef.current) {
        console.log("[Sync] Back online - processing pending queue...");

        // Process any items that were queued while offline
        if (pendingSyncQueue.length > 0) {
          try {
            await processPendingQueue(user.id);
            console.log("[Sync] Pending queue processed successfully");
          } catch (error) {
            console.error("[Sync] Failed to process pending queue:", error);
          }
        }

        // Also sync any dirty dates
        const dirtyDates = getDirtyDates();
        if (dirtyDates.length > 0) {
          try {
            await syncToSupabase(user.id);
            console.log("[Sync] Dirty dates synced successfully");
          } catch (error) {
            console.error("[Sync] Failed to sync dirty dates:", error);
          }
        }
      }

      wasOfflineRef.current = !isOnline;
    },
    [
      user?.id,
      pendingSyncQueue.length,
      processPendingQueue,
      syncToSupabase,
      getDirtyDates,
    ],
  );

  // Subscribe to network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    // Check initial state
    NetInfo.fetch().then((state) => {
      wasOfflineRef.current = !(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, [handleConnectivityChange]);

  // Initial sync when user is authenticated
  useEffect(() => {
    const performInitialSync = async () => {
      if (!isAuthenticated || !user?.id || initialSyncDoneRef.current) return;

      const state = await NetInfo.fetch();
      if (!state.isConnected || !state.isInternetReachable) return;

      console.log("[Sync] Performing initial sync...");

      try {
        // Refresh session first
        await refreshSession();

        // Fetch data from Supabase
        await fetchFromSupabase(user.id);

        // Push any local changes that weren't synced
        const dirtyDates = getDirtyDates();
        if (dirtyDates.length > 0) {
          await syncToSupabase(user.id);
        }

        // Process any pending queue items
        if (pendingSyncQueue.length > 0) {
          await processPendingQueue(user.id);
        }

        initialSyncDoneRef.current = true;
        console.log("[Sync] Initial sync completed");
      } catch (error) {
        console.error("[Sync] Initial sync failed:", error);
      }
    };

    performInitialSync();
  }, [isAuthenticated, user?.id]);

  // Manual sync function (can be called from UI)
  const manualSync = useCallback(async () => {
    if (!user?.id) return { success: false, error: "No user" };

    const state = await NetInfo.fetch();
    if (!state.isConnected || !state.isInternetReachable) {
      return { success: false, error: "No internet connection" };
    }

    try {
      await syncToSupabase(user.id);
      await fetchFromSupabase(user.id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user?.id, syncToSupabase, fetchFromSupabase]);

  return {
    manualSync,
    hasPendingSync: pendingSyncQueue.length > 0,
    pendingCount: pendingSyncQueue.length,
  };
}

export default useSyncData;
