import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Vérifier si on est dans Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Imports conditionnels pour éviter les erreurs dans Expo Go (SDK 53+)
let Notifications: typeof import("expo-notifications") | null = null;
let TaskManager: typeof import("expo-task-manager") | null = null;
let BackgroundFetch: typeof import("expo-background-fetch") | null = null;

// Charger les modules seulement si on n'est pas dans Expo Go
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
    TaskManager = require("expo-task-manager");
    BackgroundFetch = require("expo-background-fetch");
  } catch (error) {
    console.warn("[BackgroundTask] Modules non disponibles:", error);
  }
}

// Nom de la tâche en arrière-plan
export const DAILY_REMINDER_TASK = "daily-prayer-reminder";
const DAILY_REMINDER_CHANNEL_ID = "daily-reminder";
const DAILY_REMINDER_ID = "daily-progress-reminder";

// Clé pour stocker le statut des prières (synchronisé avec le store)
const PRAYER_STATUS_KEY = "prayer-store";

// Messages pour le rappel quotidien selon le nombre de prières manquées
const dailyReminderMessages = {
  allMissed: [
    "Vous n'avez pas encore prié aujourd'hui 🤲 Il n'est jamais trop tard !",
    "5 prières vous attendent 🕌 Commencez maintenant !",
    "La journée n'est pas terminée, rattrapez vos prières 💪",
  ],
  mostMissed: [
    "Il vous reste des prières à rattraper 🤲",
    "Ne laissez pas la journée se terminer sans prier 🕌",
    "Quelques minutes pour votre âme 💫",
  ],
  someMissed: [
    "Bon effort ! Il reste quelques prières à faire 👍",
    "Vous êtes sur la bonne voie, continuez 🌟",
    "Terminez la journée en beauté 🤲",
  ],
};

const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

const getDailyReminderContent = (
  prayersDone: number,
): { title: string; body: string } | null => {
  // Ne pas envoyer si 3 prières ou plus sont faites
  if (prayersDone >= 3) {
    return null;
  }

  if (prayersDone === 0) {
    return {
      title: "🔔 Rappel de prière",
      body: getRandomMessage(dailyReminderMessages.allMissed),
    };
  } else if (prayersDone <= 2) {
    return {
      title: `📿 ${prayersDone}/5 prières accomplies`,
      body: getRandomMessage(dailyReminderMessages.mostMissed),
    };
  }

  return {
    title: `✨ ${prayersDone}/5 prières accomplies`,
    body: getRandomMessage(dailyReminderMessages.someMissed),
  };
};

// Fonction exécutée par la tâche en arrière-plan
const checkPrayerStatus = async (): Promise<number> => {
  try {
    console.log("[BackgroundTask] Vérification du statut des prières...");

    // Récupérer le statut des prières depuis AsyncStorage
    const storedData = await AsyncStorage.getItem(PRAYER_STATUS_KEY);
    if (!storedData) {
      console.log("[BackgroundTask] Aucune donnée de prière trouvée");
      return 1; // NoData
    }

    const parsedData = JSON.parse(storedData);
    const status = parsedData?.state?.status || {};

    // Compter les prières effectuées
    const prayersDone = Object.values(status).filter(Boolean).length;
    console.log(`[BackgroundTask] Prières effectuées: ${prayersDone}/5`);

    // Obtenir le contenu de la notification
    const content = getDailyReminderContent(prayersDone);

    if (!content) {
      console.log("[BackgroundTask] Assez de prières faites, pas de rappel");
      return 1; // NoData
    }

    // Vérifier que Notifications est disponible
    if (!Notifications) {
      console.log("[BackgroundTask] Notifications non disponibles");
      return 1; // NoData
    }

    // Créer le canal pour Android si nécessaire
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        DAILY_REMINDER_CHANNEL_ID,
        {
          name: "Rappel Quotidien",
          description: "Rappel quotidien de votre progression",
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: "default",
          vibrationPattern: [0, 250],
          lightColor: "#115E59",
        },
      );
    }

    // Envoyer la notification immédiatement
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: content.title,
        body: content.body,
        sound: true,
        data: { type: "daily-reminder", prayersDone },
        ...(Platform.OS === "android" && {
          color: "#115E59",
        }),
      },
      trigger: null, // Immédiat
    });

    console.log("[BackgroundTask] Notification de rappel envoyée");
    return 2; // NewData
  } catch (error) {
    console.error("[BackgroundTask] Erreur:", error);
    return 3; // Failed
  }
};

// Définir la tâche en arrière-plan (seulement si les modules sont disponibles)
if (TaskManager && !isExpoGo) {
  TaskManager.defineTask(DAILY_REMINDER_TASK, async () => {
    return await checkPrayerStatus();
  });
}

// Enregistrer la tâche en arrière-plan
export const registerDailyReminderTask = async (): Promise<void> => {
  if (isExpoGo || !TaskManager || !BackgroundFetch) {
    console.log(
      "[BackgroundTask] Tâches en arrière-plan non disponibles dans Expo Go",
    );
    return;
  }

  try {
    // Vérifier si la tâche est déjà enregistrée
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(DAILY_REMINDER_TASK);

    if (isRegistered) {
      console.log("[BackgroundTask] Tâche déjà enregistrée");
      return;
    }

    // Enregistrer la tâche de background fetch
    await BackgroundFetch.registerTaskAsync(DAILY_REMINDER_TASK, {
      minimumInterval: 60 * 60 * 4, // Minimum 4 heures entre les exécutions
      stopOnTerminate: false, // Continuer même si l'app est fermée
      startOnBoot: true, // Démarrer au démarrage de l'appareil
    });

    console.log("[BackgroundTask] Tâche enregistrée avec succès");
  } catch (error) {
    console.error("[BackgroundTask] Erreur lors de l'enregistrement:", error);
  }
};

// Annuler la tâche en arrière-plan
export const unregisterDailyReminderTask = async (): Promise<void> => {
  if (isExpoGo || !TaskManager || !BackgroundFetch) {
    return;
  }

  try {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(DAILY_REMINDER_TASK);

    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(DAILY_REMINDER_TASK);
      console.log("[BackgroundTask] Tâche désactivée");
    }
  } catch (error) {
    console.error("[BackgroundTask] Erreur lors de la désactivation:", error);
  }
};

// Vérifier le statut de la tâche
export const getDailyReminderTaskStatus = async (): Promise<{
  isRegistered: boolean;
  status: number | null;
}> => {
  if (isExpoGo || !TaskManager || !BackgroundFetch) {
    return { isRegistered: false, status: null };
  }

  try {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(DAILY_REMINDER_TASK);
    const status = await BackgroundFetch.getStatusAsync();
    return { isRegistered, status };
  } catch (error) {
    console.error("[BackgroundTask] Erreur lors de la vérification:", error);
    return { isRegistered: false, status: null };
  }
};

// Programmer un rappel à une heure spécifique (21h30)
// Note: BackgroundFetch ne permet pas de choisir l'heure exacte
// On utilise donc une notification programmée comme backup
export const scheduleEveningReminder = async (): Promise<void> => {
  // Vérifier que Notifications est disponible
  if (!Notifications) {
    console.log("[BackgroundTask] Notifications non disponibles (Expo Go)");
    return;
  }

  try {
    // Annuler l'ancien rappel
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    await Notifications.cancelScheduledNotificationAsync(
      `${DAILY_REMINDER_ID}-scheduled`,
    );

    // Calculer 21h30 aujourd'hui ou demain
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(21, 30, 0, 0);

    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    // Créer le canal pour Android si nécessaire
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        DAILY_REMINDER_CHANNEL_ID,
        {
          name: "Rappel Quotidien",
          description: "Rappel quotidien de votre progression",
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: "default",
          vibrationPattern: [0, 250],
          lightColor: "#115E59",
        },
      );
    }

    // Programmer une notification qui sera envoyée à 21h30
    await Notifications.scheduleNotificationAsync({
      identifier: `${DAILY_REMINDER_ID}-scheduled`,
      content: {
        title: "🌙 Rappel de fin de journée",
        body: "N'oubliez pas de vérifier vos prières du jour",
        sound: true,
        data: { type: "daily-reminder-scheduled" },
        ...(Platform.OS === "android" && {
          color: "#115E59",
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
        channelId: DAILY_REMINDER_CHANNEL_ID,
      },
    });

    console.log(
      `[BackgroundTask] Rappel du soir programmé pour ${reminderTime.toLocaleString()}`,
    );
  } catch (error) {
    console.error("[BackgroundTask] Erreur programmation rappel:", error);
  }
};

// Exécuter manuellement la vérification (pour le debug)
export const triggerDailyReminderManually = async (): Promise<void> => {
  await checkPrayerStatus();
};
