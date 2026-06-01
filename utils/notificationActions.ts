import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { format } from "date-fns";

import type { PrayerName } from "@/stores/useNotificationStore";

// Vérifier si on est dans Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Imports conditionnels (SDK 53+ : indisponibles dans Expo Go)
let Notifications: typeof import("expo-notifications") | null = null;
let TaskManager: typeof import("expo-task-manager") | null = null;

if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
    TaskManager = require("expo-task-manager");
  } catch (error) {
    console.warn("[NotifAction] Modules non disponibles:", error);
  }
}

export const NOTIFICATION_ACTION_TASK = "notification-action-task";
const CATEGORY_ID = "prayer-reminder";
const CHANNEL_ID = "prayer-notifications";
const PRAYER_STORE_KEY = "prayer-store";

const prayerLabels: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const isPrayerName = (value: unknown): value is PrayerName =>
  typeof value === "string" && value in prayerLabels;

/**
 * Marque une prière comme faite en écrivant directement dans le store persisté
 * (AsyncStorage). Utilisé quand l'app est tuée : Zustand réhydratera cet état
 * au prochain lancement, et dirtyDates déclenchera la sync Supabase.
 */
const markPrayerDoneHeadless = async (prayer: PrayerName): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_STORE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const state = parsed.state ?? {};
    const todayKey = format(new Date(), "yyyy-MM-dd");

    const logs = { ...(state.logs ?? {}) };
    const dayLog = {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
      ...(logs[todayKey] ?? {}),
      [prayer]: true,
    };
    logs[todayKey] = dayLog;

    state.logs = logs;
    state.dateKey = todayKey;
    state.status = dayLog;
    state.dirtyDates = { ...(state.dirtyDates ?? {}), [todayKey]: true };

    parsed.state = state;
    await AsyncStorage.setItem(PRAYER_STORE_KEY, JSON.stringify(parsed));
    console.log(`[NotifAction] ${prayer} marquée (headless)`);
  } catch (error) {
    console.error("[NotifAction] Erreur markPrayerDoneHeadless:", error);
  }
};

/** Programme un rappel +10min. Fonctionne en headless. */
const scheduleReminderHeadless = async (prayer: PrayerName): Promise<void> => {
  if (!Notifications) return;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Rappels de Prière",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "adhan",
      });
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `reminder-${prayer}-snooze`,
      content: {
        title: `⏰ Rappel: ${prayerLabels[prayer]}`,
        body: `N'oubliez pas de prier ${prayerLabels[prayer]}`,
        sound: Platform.OS === "android" ? "adhan" : true,
        categoryIdentifier: CATEGORY_ID,
        data: { prayer, isReminder: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + 10 * 60 * 1000),
        channelId: CHANNEL_ID,
      },
    });
    console.log(`[NotifAction] Rappel +10min programmé pour ${prayer}`);
  } catch (error) {
    console.error("[NotifAction] Erreur scheduleReminderHeadless:", error);
  }
};

// Forme minimale d'une réponse de notification (NotificationResponse)
type ActionPayload = {
  actionIdentifier?: string;
  notification?: {
    request?: {
      identifier?: string;
      content?: { data?: Record<string, unknown> | null };
    };
  };
};

const extractPrayer = (payload: ActionPayload): PrayerName | null => {
  const data = payload.notification?.request?.content?.data;
  const fromData = data?.prayer;
  if (isPrayerName(fromData)) return fromData;

  const id = payload.notification?.request?.identifier;
  if (typeof id === "string") {
    const match = id.match(/^(?:prayer|reminder)-(\w+)-/);
    if (match && isPrayerName(match[1])) return match[1];
  }
  return null;
};

// Définir la tâche au niveau module (requis pour le lancement headless)
if (TaskManager && !isExpoGo) {
  TaskManager.defineTask(
    NOTIFICATION_ACTION_TASK,
    async ({ data, executionInfo }: { data: any; executionInfo?: any }) => {
      try {
        const payload = data as ActionPayload;
        const actionId = payload?.actionIdentifier;

        // Seuls nos boutons custom sont traités ici. Le tap par défaut
        // (DEFAULT_ACTION_IDENTIFIER) ouvre l'app et est géré côté UI.
        if (actionId !== "MARK_DONE" && actionId !== "REMIND_LATER") return;

        // Si l'app est au premier plan, le listener JS s'en charge déjà.
        if (executionInfo?.appState === "active") return;

        const prayer = extractPrayer(payload);
        if (!prayer) return;

        if (actionId === "MARK_DONE") {
          await markPrayerDoneHeadless(prayer);
          const notifId = payload.notification?.request?.identifier;
          if (notifId && Notifications) {
            await Notifications.dismissNotificationAsync(notifId).catch(
              () => {},
            );
          }
        } else if (actionId === "REMIND_LATER") {
          await scheduleReminderHeadless(prayer);
        }
      } catch (error) {
        console.error("[NotifAction] Erreur tâche:", error);
      }
    },
  );
}

/** Enregistre la tâche de traitement des actions de notification. */
export const registerNotificationActionTask = async (): Promise<void> => {
  if (isExpoGo || !Notifications || !TaskManager) return;
  try {
    await Notifications.registerTaskAsync(NOTIFICATION_ACTION_TASK);
    console.log("[NotifAction] Tâche d'action enregistrée");
  } catch (error) {
    console.error("[NotifAction] Erreur enregistrement tâche:", error);
  }
};
