import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import usePrayerStore, { PrayerStatus } from '@/stores/usePrayerStore';
import { supabase } from '@/lib/supabase';

const createDefaultStatus = (): PrayerStatus => ({
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
});

export const useSyncDailyLogs = () => {
  const syncInProgress = useRef(false);
  const { logs, getDirtyDates, markSyncedDates } = usePrayerStore();

  const sync = useCallback(async () => {
    if (!supabase || syncInProgress.current) {
      return;
    }

    const dirtyDates = getDirtyDates();
    if (!dirtyDates.length) {
      return;
    }

    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) {
      return;
    }

    syncInProgress.current = true;
    const payload = dirtyDates.map((date) => {
      const status = logs[date] ?? createDefaultStatus();
      return {
        user_id: data.user!.id,
        date,
        ...status,
      };
    });

    const { error } = await supabase
      .from('daily_logs')
      .upsert(payload, { onConflict: 'user_id,date' });

    if (!error) {
      markSyncedDates(dirtyDates);
    }

    syncInProgress.current = false;
  }, [getDirtyDates, logs, markSyncedDates]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
      }
    });

    const interval = setInterval(sync, 60_000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [sync]);
};
