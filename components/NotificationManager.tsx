import usePrayerStore from "@/stores/usePrayerStore";
import useNotificationStore, {
  PrayerName,
} from "@/stores/useNotificationStore";
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications";

/**
 * Composant qui utilise le hook de notifications.
 * Séparé pour permettre le lazy loading et éviter les erreurs dans Expo Go.
 */
export default function NotificationManager() {
  const times = usePrayerStore((state) => state.times);
  const { enabled, preferences } = useNotificationStore();

  // Convertir les times du store au format attendu par le hook
  const prayerTimes = times
    ? ({
        fajr: times.fajr,
        dhuhr: times.dhuhr,
        asr: times.asr,
        maghrib: times.maghrib,
        isha: times.isha,
      } as Record<PrayerName, Date>)
    : null;

  // Utiliser le hook de notifications
  usePrayerNotifications({
    times: prayerTimes,
    enabled,
    preferences,
  });

  // Rien à rendre visuellement
  return null;
}
