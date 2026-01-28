import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';

import type { PrayerName } from '@/stores/useNotificationStore';

type PrayerTimes = Record<PrayerName, Date>;

const CHANNEL_ID = 'prayer-notifications';

const prayerLabels: Record<PrayerName, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

const getNotificationId = (key: PrayerName, date: Date) => {
  const dayKey = date.toISOString().slice(0, 10);
  return `prayer-${key}-${dayKey}`;
};

export const usePrayerNotifications = (options: {
  times: PrayerTimes | null;
  enabled: boolean;
  preferences: Record<PrayerName, boolean>;
}) => {
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(
    null
  );

  const requestPermissions = useCallback(async () => {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.status !== 'granted') {
      const request = await Notifications.requestPermissionsAsync();
      setPermissionStatus(request.status);
      return request.status === 'granted';
    }

    setPermissionStatus(settings.status);
    return true;
  }, []);

  const ensureChannel = useCallback(async () => {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Prières',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }, []);

  const scheduleNotifications = useCallback(async () => {
    if (!options.times || !options.enabled) {
      return;
    }

    const times = options.times;

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }

    await ensureChannel();

    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = existing
      .map((item) => item.identifier)
      .filter((id) => id.startsWith('prayer-'));

    await Promise.all(toCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

    const now = new Date();
    await Promise.all(
      (Object.keys(times) as PrayerName[]).map(async (key) => {
        if (!options.preferences[key]) {
          return;
        }

        const date = times[key];
        if (date <= now) {
          return;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: getNotificationId(key, date),
          content: {
            title: `Prière ${prayerLabels[key]}`,
            body: `C'est l'heure de ${prayerLabels[key]}.`,
            sound: 'default',
          },
          trigger: {
            date,
            channelId: CHANNEL_ID,
          },
        });
      })
    );
  }, [ensureChannel, options.enabled, options.preferences, options.times, requestPermissions]);

  useEffect(() => {
    scheduleNotifications();
  }, [scheduleNotifications]);

  return {
    permissionStatus,
    requestPermissions,
    reschedule: scheduleNotifications,
  };
};
