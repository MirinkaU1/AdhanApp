import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
} from "react-native";
import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppText } from "@/components/ui";
import type { PrayerName } from "@/stores/useNotificationStore";
import useQuestStore from "@/stores/useQuestStore";
import useAuthStore from "@/stores/useAuthStore";
import useCoinsStore from "@/stores/useCoinsStore";
import {
  triggerDailyReminderManually,
  getDailyReminderTaskStatus,
} from "@/utils/backgroundTasks";

// Vérifier si on est dans Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Import conditionnel de expo-notifications pour éviter l'erreur SDK 53+
let Notifications: typeof import("expo-notifications") | null = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch (error) {
    console.warn("[Debug] expo-notifications non disponible:", error);
  }
}

// Configuration des prières pour le debug
const PRAYERS: {
  id: PrayerName;
  nameKey: string;
  arabicName: string;
  icon: MaterialIconName;
}[] = [
  {
    id: "fajr",
    nameKey: "prayers.fajr",
    arabicName: "الفجر",
    icon: "wb-twilight",
  },
  {
    id: "dhuhr",
    nameKey: "prayers.dhuhr",
    arabicName: "الظهر",
    icon: "light-mode",
  },
  { id: "asr", nameKey: "prayers.asr", arabicName: "العصر", icon: "wb-cloudy" },
  {
    id: "maghrib",
    nameKey: "prayers.maghrib",
    arabicName: "المغرب",
    icon: "nights-stay",
  },
  {
    id: "isha",
    nameKey: "prayers.isha",
    arabicName: "العشاء",
    icon: "dark-mode",
  },
];

// Messages de test
const testMessages: Record<PrayerName, string> = {
  fajr: "Le meilleur moment pour commencer la journée 🌅",
  dhuhr: "Pause spirituelle au milieu de la journée 🌤️",
  asr: "La prière du milieu, ne la manquez pas ⏰",
  maghrib: "Le soleil se couche, l'âme s'élève 🌅",
  isha: "Terminez la journée en paix 🌙",
};

export default function DebugScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const enqueueXpToast = useQuestStore((s) => s.enqueueXpToast);
  const enqueueLevelUpToast = useQuestStore((s) => s.enqueueLevelUpToast);
  const level = useQuestStore((s) => s.level);
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const { addCoins, coins } = useCoinsStore();

  // Guard : seuls dev et tester peuvent accéder
  useEffect(() => {
    if (!hasHydrated) return;

    if (
      !isAuthenticated ||
      !user ||
      (user.role !== "dev" && user.role !== "tester")
    ) {
      router.replace("/settings");
    }
  }, [hasHydrated, isAuthenticated, user]);

  // Afficher une notification de test
  const showTestNotification = async (prayerId: PrayerName) => {
    // Vérifier si les notifications sont disponibles
    if (!Notifications) {
      Alert.alert(
        "Non disponible",
        "Les notifications ne fonctionnent pas dans Expo Go (SDK 53+). Utilisez un development build.",
      );
      return;
    }

    try {
      // Demander les permissions si nécessaire
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            t("debug.permissionDenied"),
            t("debug.permissionDeniedDesc"),
          );
          return;
        }
      }

      // Créer la catégorie avec les boutons d'action
      await Notifications.setNotificationCategoryAsync("prayer-reminder", [
        {
          identifier: "MARK_DONE",
          buttonTitle: "✅ J'ai prié",
          options: { opensAppToForeground: false },
        },
        {
          identifier: "REMIND_LATER",
          buttonTitle: "⏰ +10min",
          options: { opensAppToForeground: false },
        },
      ]);

      const prayer = PRAYERS.find((p) => p.id === prayerId);
      if (!prayer) return;

      // Afficher la notification immédiatement
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕌 ${t(prayer.nameKey)} - ${prayer.arabicName}`,
          body: testMessages[prayerId],
          sound: Platform.OS === "android" ? "adhan" : true,
          categoryIdentifier: "prayer-reminder",
          data: { prayer: prayerId, isTest: true },
        },
        trigger: null, // Afficher immédiatement
      });

      Alert.alert(
        t("debug.notificationSent"),
        t("debug.notificationSentDesc", { prayer: t(prayer.nameKey) }),
      );
    } catch (error) {
      console.error("Erreur envoi notification test:", error);
      Alert.alert(t("debug.error"), String(error));
    }
  };

  // Afficher toutes les notifications
  const showAllNotifications = async () => {
    for (const prayer of PRAYERS) {
      await showTestNotification(prayer.id);
      // Petit délai entre chaque notification
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  // Afficher une notification de rappel quotidien (utilise la vraie logique)
  const showDailyReminderTest = async () => {
    // Vérifier si les notifications sont disponibles
    if (!Notifications) {
      Alert.alert(
        "Non disponible",
        "Les notifications ne fonctionnent pas dans Expo Go (SDK 53+). Utilisez un development build.",
      );
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            t("debug.permissionDenied"),
            t("debug.permissionDeniedDesc"),
          );
          return;
        }
      }

      // Utiliser la vraie fonction de vérification du background task
      await triggerDailyReminderManually();

      Alert.alert(
        t("debug.notificationSent"),
        t("debug.dailyReminderTriggered"),
      );
    } catch (error) {
      console.error("Erreur envoi rappel quotidien test:", error);
      Alert.alert(t("debug.error"), String(error));
    }
  };

  // Vérifier le statut de la tâche en arrière-plan
  const checkBackgroundTaskStatus = async () => {
    try {
      const { isRegistered, status } = await getDailyReminderTaskStatus();
      const statusText =
        status === 3
          ? "Disponible"
          : status === 2
            ? "Restreint"
            : status === 1
              ? "Refusé"
              : "Inconnu";

      Alert.alert(
        t("debug.backgroundTaskStatus"),
        `Tâche enregistrée: ${isRegistered ? "Oui ✅" : "Non ❌"}\nStatut: ${statusText}`,
      );
    } catch (error) {
      Alert.alert(t("debug.error"), String(error));
    }
  };

  // Toast XP - Quête accomplie
  const showQuestCompletedToast = () => {
    enqueueXpToast(50, "quest_debug");
  };

  // Toast Level Up (sans XP toast)
  const showLevelUpToast = () => {
    enqueueLevelUpToast(level + 1);
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <LinearGradient
        colors={appTheme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: 48,
          paddingBottom: 24,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-white font-outfit-bold"
              style={{ fontSize: 24 }}
            >
              {t("debug.title")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("debug.subtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
          >
            <MaterialIconsRound name="bug-report" size={26} color="#EF4444" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Notifications */}
        <AppText variant="h3" className="mb-4">
          {t("debug.notifications")}
        </AppText>

        <View className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark mb-6">
          {/* Bouton pour toutes les notifications */}
          <Pressable
            onPress={showAllNotifications}
            className="p-4 flex-row items-center gap-3 active:opacity-70"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#334155" : "#F1F5F9",
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#FEF3C7" }}
            >
              <MaterialIconsRound
                name="notifications-active"
                size={22}
                color="#F59E0B"
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                style={{ fontSize: 16 }}
              >
                {t("debug.sendAllNotifications")}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                style={{ fontSize: 13 }}
              >
                {t("debug.sendAllNotificationsDesc")}
              </Text>
            </View>
            <MaterialIconsRound
              name="send"
              size={20}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>

          {/* Bouton pour le rappel quotidien */}
          <Pressable
            onPress={showDailyReminderTest}
            className="p-4 flex-row items-center gap-3 active:opacity-70"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#334155" : "#F1F5F9",
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#DCFCE7" }}
            >
              <MaterialIconsRound
                name="event-repeat"
                size={22}
                color="#22C55E"
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                style={{ fontSize: 16 }}
              >
                {t("debug.dailyReminder")}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                style={{ fontSize: 13 }}
              >
                {t("debug.dailyReminderDesc")}
              </Text>
            </View>
            <MaterialIconsRound
              name="send"
              size={20}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>

          {/* Bouton pour vérifier le statut de la tâche en arrière-plan */}
          <Pressable
            onPress={checkBackgroundTaskStatus}
            className="p-4 flex-row items-center gap-3 active:opacity-70"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#334155" : "#F1F5F9",
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#E0E7FF" }}
            >
              <MaterialIconsRound
                name="settings-backup-restore"
                size={22}
                color="#6366F1"
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                style={{ fontSize: 16 }}
              >
                {t("debug.backgroundTask")}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                style={{ fontSize: 13 }}
              >
                {t("debug.backgroundTaskDesc")}
              </Text>
            </View>
            <MaterialIconsRound
              name="info"
              size={20}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>

          {/* Liste des prières */}
          {PRAYERS.map((prayer, index) => (
            <Pressable
              key={prayer.id}
              onPress={() => showTestNotification(prayer.id)}
              className="p-4 flex-row items-center gap-3 active:opacity-70"
              style={{
                borderBottomWidth: index < PRAYERS.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? "#334155" : "#F1F5F9",
              }}
            >
              <View
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? "#334155" : "#F3E8FF" }}
              >
                <MaterialIconsRound
                  name={prayer.icon}
                  size={22}
                  color="#A855F7"
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                  style={{ fontSize: 16 }}
                >
                  {t(prayer.nameKey)}
                </Text>
                <Text
                  className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                  style={{ fontSize: 13 }}
                >
                  {prayer.arabicName}
                </Text>
              </View>
              <MaterialIconsRound
                name="notifications"
                size={20}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </Pressable>
          ))}
        </View>

        {/* Section Toasts */}
        <AppText variant="h3" className="mb-4">
          {t("debug.toasts")}
        </AppText>

        <View className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark mb-6">
          {/* Toast XP - Quête accomplie */}
          <Pressable
            onPress={showQuestCompletedToast}
            className="p-4 flex-row items-center gap-3 active:opacity-70"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#334155" : "#F1F5F9",
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#FEF3C7" }}
            >
              <MaterialIconsRound name="star" size={22} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text
                className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                style={{ fontSize: 16 }}
              >
                {t("debug.testQuestToast")}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                style={{ fontSize: 13 }}
              >
                {t("debug.testQuestToastDesc")}
              </Text>
            </View>
            <MaterialIconsRound
              name="play-arrow"
              size={20}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>

          {/* Toast Level Up */}
          <Pressable
            onPress={showLevelUpToast}
            className="p-4 flex-row items-center gap-3 active:opacity-70"
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#EDE9FE" }}
            >
              <MaterialIconsRound
                name="emoji-events"
                size={22}
                color="#7C3AED"
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                style={{ fontSize: 16 }}
              >
                {t("debug.testLevelUpToast")}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                style={{ fontSize: 13 }}
              >
                {t("debug.testLevelUpToastDesc")}
              </Text>
            </View>
            <MaterialIconsRound
              name="play-arrow"
              size={20}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </Pressable>
        </View>

        {/* Section Coins */}
        <AppText variant="h3" className="mb-4">
          {t("debug.coins")}
        </AppText>

        <View className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark mb-6">
          <Pressable
            onPress={() => {
              void addCoins(10, {
                reason: "debug_manual",
                referenceKey: `debug_manual:${Date.now()}`,
              });
            }}
            className="p-4 flex-row items-center gap-3 active:opacity-70"
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#FEF3C7" }}
            >
              <MaterialIconsRound name="toll" size={22} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text
                className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                style={{ fontSize: 16 }}
              >
                {t("debug.addCoins")}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                style={{ fontSize: 13 }}
              >
                {t("debug.addCoinsDesc", { coins })}
              </Text>
            </View>
            <View
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: isDark ? "#78350F" : "#FDE68A" }}
            >
              <MaterialIconsRound name="add" size={16} color="#D97706" />
              <Text
                className="font-outfit-bold text-sm"
                style={{ color: "#D97706" }}
              >
                10
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Info */}
        <View
          className="flex-row items-start gap-3 p-4 rounded-2xl"
          style={{ backgroundColor: isDark ? "#1E3A5F" : "#EFF6FF" }}
        >
          <MaterialIconsRound name="info" size={20} color="#3B82F6" />
          <Text
            className="flex-1 font-outfit-regular"
            style={{
              fontSize: 13,
              color: isDark ? "#93C5FD" : "#1E40AF",
              lineHeight: 20,
            }}
          >
            {t("debug.info")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
