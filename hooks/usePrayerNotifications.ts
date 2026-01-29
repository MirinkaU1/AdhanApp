import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";

import type { PrayerName } from "@/stores/useNotificationStore";
import usePrayerStore from "@/stores/usePrayerStore";

// Vérifier si on est dans Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Import conditionnel de expo-notifications pour éviter l'erreur SDK 53+
let Notifications: typeof import("expo-notifications") | null = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch (error) {
    console.warn("[Notifications] expo-notifications non disponible:", error);
  }
}

type PrayerTimes = Record<PrayerName, Date>;

const CHANNEL_ID = "prayer-notifications";
const DAILY_REMINDER_CHANNEL_ID = "daily-reminder";
const CATEGORY_ID = "prayer-reminder";

// Labels des prières en français et arabe
const prayerLabels: Record<PrayerName, { fr: string; ar: string }> = {
  fajr: { fr: "Fajr", ar: "الفجر" },
  dhuhr: { fr: "Dhuhr", ar: "الظهر" },
  asr: { fr: "Asr", ar: "العصر" },
  maghrib: { fr: "Maghrib", ar: "المغرب" },
  isha: { fr: "Isha", ar: "العشاء" },
};

// Messages motivants pour les notifications
const motivationalMessages: Record<PrayerName, string[]> = {
  fajr: [
    "Le meilleur moment pour commencer la journée 🌅",
    "Les anges assistent à cette prière 🤲",
    "Celui qui prie Fajr est sous la protection d'Allah",
  ],
  dhuhr: [
    "Pause spirituelle au milieu de la journée 🌤️",
    "Rechargez votre âme 🤲",
    "Un moment de paix dans votre journée",
  ],
  asr: [
    "La prière du milieu, ne la manquez pas ⏰",
    "Prenez un moment pour vous reconnecter 🤲",
    "La prière de l'après-midi vous attend",
  ],
  maghrib: [
    "Le soleil se couche, l'âme s'élève 🌅",
    "Gratitude pour cette journée 🤲",
    "Un moment de reconnaissance",
  ],
  isha: [
    "Terminez la journée en paix 🌙",
    "La dernière prière de la journée 🤲",
    "Confiez votre nuit à Allah",
  ],
};

const getRandomMessage = (prayer: PrayerName): string => {
  const messages = motivationalMessages[prayer];
  return messages[Math.floor(Math.random() * messages.length)];
};

const getNotificationId = (key: PrayerName, date: Date) => {
  const dayKey = date.toISOString().slice(0, 10);
  return `prayer-${key}-${dayKey}`;
};

// Configurer le comportement des notifications (afficher même si l'app est ouverte)
// Seulement si Notifications est disponible (pas dans Expo Go)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const usePrayerNotifications = (options: {
  times: PrayerTimes | null;
  enabled: boolean;
  preferences: Record<PrayerName, boolean>;
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const responseListenerRef = useRef<{ remove: () => void } | null>(null);

  // Si Notifications n'est pas disponible (Expo Go), retourner des no-ops
  const isAvailable = Notifications !== null;

  // Demander les permissions
  const requestPermissions = useCallback(async () => {
    if (!Notifications) return false;

    const settings = await Notifications.getPermissionsAsync();
    if (settings.status !== "granted") {
      const request = await Notifications.requestPermissionsAsync();
      setPermissionStatus(request.status);
      return request.status === "granted";
    }

    setPermissionStatus(settings.status);
    return true;
  }, []);

  // Créer le canal de notification (Android)
  const ensureChannel = useCallback(async () => {
    if (!Notifications) return;

    if (Platform.OS === "android") {
      // Canal principal pour les prières (avec adhan)
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Rappels de Prière",
        description: "Notifications pour les heures de prière",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "adhan", // Son personnalisé de l'adhan (res/raw/adhan.mp3)
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#115E59",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        enableVibrate: true,
        enableLights: true,
      });

      // Canal pour le rappel quotidien (son par défaut)
      await Notifications.setNotificationChannelAsync(
        DAILY_REMINDER_CHANNEL_ID,
        {
          name: "Rappel Quotidien",
          description: "Rappel quotidien de votre progression",
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: "default",
          vibrationPattern: [0, 250],
          lightColor: "#115E59",
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
          enableVibrate: true,
          enableLights: true,
        },
      );
    }
  }, []);

  // Créer la catégorie avec les boutons d'action
  const setupNotificationCategory = useCallback(async () => {
    if (!Notifications) return;

    await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
      {
        identifier: "MARK_DONE",
        buttonTitle: "✅ J'ai prié",
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: "REMIND_LATER",
        buttonTitle: "⏰ +10min",
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  }, []);

  // Gérer les réponses aux actions de notification
  const handleNotificationResponse = useCallback(
    (response: {
      actionIdentifier: string;
      notification: { request: { identifier: string } };
    }) => {
      if (!Notifications) return;

      const actionId = response.actionIdentifier;
      const notificationId = response.notification.request.identifier;

      // Extraire le nom de la prière depuis l'ID (format: prayer-{name}-{date})
      const match = notificationId.match(/^(?:prayer|reminder)-(\w+)-/);
      if (!match) return;

      const prayerName = match[1] as PrayerName;

      if (actionId === "MARK_DONE") {
        // Marquer la prière comme faite dans le store
        const state = usePrayerStore.getState();
        // Vérifier si la prière n'est pas déjà faite avant de toggle
        if (!state.status[prayerName]) {
          state.togglePrayer(prayerName);
        }
        console.log(
          `Prière ${prayerName} marquée comme faite via notification`,
        );
      } else if (actionId === "REMIND_LATER") {
        // Programmer un rappel dans 10 minutes
        const reminderDate = new Date(Date.now() + 10 * 60 * 1000);
        Notifications.scheduleNotificationAsync({
          identifier: `reminder-${prayerName}-${Date.now()}`,
          content: {
            title: `⏰ Rappel: ${prayerLabels[prayerName].fr}`,
            body: `N'oubliez pas de prier ${prayerLabels[prayerName].fr}`,
            sound: Platform.OS === "android" ? "adhan" : true,
            categoryIdentifier: CATEGORY_ID,
            data: { prayer: prayerName, isReminder: true },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
            channelId: CHANNEL_ID,
          },
        });
        console.log(`Rappel programmé pour ${prayerName} dans 10 minutes`);
      }
    },
    [],
  );

  // Setup du listener de réponse aux notifications
  useEffect(() => {
    if (!Notifications) return;

    setupNotificationCategory();

    // Listener pour les réponses (quand l'utilisateur appuie sur un bouton)
    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );

    return () => {
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, [handleNotificationResponse, setupNotificationCategory]);

  // Programmer les notifications
  const scheduleNotifications = useCallback(async () => {
    if (!Notifications || !options.times || !options.enabled) {
      return;
    }

    const times = options.times;

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }

    await ensureChannel();
    await setupNotificationCategory();

    // Annuler les anciennes notifications de prière
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = existing
      .map((item) => item.identifier)
      .filter((id) => id.startsWith("prayer-"));

    await Promise.all(
      toCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );

    const now = new Date();

    // Programmer les nouvelles notifications
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
            title: `🕌 ${prayerLabels[key].fr} - ${prayerLabels[key].ar}`,
            body: getRandomMessage(key),
            sound: Platform.OS === "android" ? "adhan" : true, // Son personnalisé Android, default iOS
            categoryIdentifier: CATEGORY_ID,
            data: { prayer: key },
            // Android spécifique
            ...(Platform.OS === "android" && {
              color: "#115E59",
            }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
            channelId: CHANNEL_ID,
          },
        });
      }),
    );
    // Note: Le rappel quotidien est géré par la tâche en arrière-plan (utils/backgroundTasks.ts)
  }, [
    ensureChannel,
    options.enabled,
    options.preferences,
    options.times,
    requestPermissions,
    setupNotificationCategory,
  ]);

  // Reprogrammer quand les paramètres changent
  useEffect(() => {
    scheduleNotifications();
  }, [scheduleNotifications]);

  return {
    permissionStatus,
    requestPermissions,
    reschedule: scheduleNotifications,
  };
};
