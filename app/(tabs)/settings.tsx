import { useState, useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { AlertDialog, AppText, AppButtonGroup } from "@/components/ui";
import type { ButtonGroupItem } from "@/components/ui/AppButtonGroup";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import useAuthStore from "@/stores/useAuthStore";
import usePrayerStore from "@/stores/usePrayerStore";
import { getAvatarSource } from "@/lib/avatarService";

interface PreferenceItem {
  id: string;
  icon: MaterialIconName;
  iconBgColor: string;
  iconColor: string;
  labelKey: string;
  isDestructive?: boolean;
}

const PRAYER_PREFERENCES: PreferenceItem[] = [
  {
    id: "prayer",
    icon: "calculate",
    iconBgColor: "#D1FAE5",
    iconColor: "#10B981",
    labelKey: "settings.prayer",
  },
  {
    id: "location",
    icon: "location-on",
    iconBgColor: "#DCFCE7",
    iconColor: "#16A34A",
    labelKey: "settings.location",
  },
  {
    id: "goals",
    icon: "track-changes",
    iconBgColor: "#EFF6FF",
    iconColor: "#3B82F6",
    labelKey: "settings.goals",
  },
  {
    id: "notifications",
    icon: "notifications-active",
    iconBgColor: "#F3E8FF",
    iconColor: "#A855F7",
    labelKey: "settings.notifications",
  },
];

const APP_PREFERENCES: PreferenceItem[] = [
  {
    id: "language",
    icon: "translate",
    iconBgColor: "#ECFDF5",
    iconColor: "#22C55E",
    labelKey: "settings.language",
  },
  {
    id: "theme",
    icon: "dark-mode",
    iconBgColor: "#FEF3C7",
    iconColor: "#F59E0B",
    labelKey: "settings.theme",
  },
  {
    id: "themes",
    icon: "palette",
    iconBgColor: "#F3E8FF",
    iconColor: "#9333EA",
    labelKey: "settings.themes",
  },
];

const ACCOUNT_PREFERENCES: PreferenceItem[] = [
  {
    id: "support",
    icon: "favorite",
    iconBgColor: "#FCE7F3",
    iconColor: "#EC4899",
    labelKey: "settings.support",
  },
  {
    id: "password",
    icon: "lock",
    iconBgColor: "#EFF6FF",
    iconColor: "#3B82F6",
    labelKey: "settings.password",
  },
  {
    id: "debug",
    icon: "bug-report",
    iconBgColor: "#FEF2F2",
    iconColor: "#EF4444",
    labelKey: "settings.debug",
  },
  {
    id: "logout",
    icon: "logout",
    iconBgColor: "#FEF2F2",
    iconColor: "#EF4444",
    labelKey: "settings.logout",
    isDestructive: true,
  },
];

/**
 * Section avec titre et AppButtonGroup
 */
function SettingsSection({
  title,
  items,
  onItemPress,
}: {
  title: string;
  items: PreferenceItem[];
  onItemPress: (id: string) => void;
}) {
  const { t } = useTranslation();

  const buttonGroupItems: ButtonGroupItem[] = items.map((item) => ({
    id: item.id,
    icon: item.icon,
    iconBgColor: item.iconBgColor,
    iconColor: item.iconColor,
    label: t(item.labelKey),
    isDestructive: item.isDestructive,
    onPress: () => onItemPress(item.id),
  }));

  return (
    <View className="mb-6">
      <AppText variant="label" className="mb-3 px-1">
        {title}
      </AppText>
      <AppButtonGroup items={buttonGroupItems} />
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Récupérer logs et les fonctions de calcul du store
  const { logs, getStreak, getTotalPrayers } = usePrayerStore();

  // Calculer les stats de manière réactive (se met à jour quand logs change)
  const stats = useMemo(() => {
    const localStreak = getStreak();
    const localTotalPrayers = getTotalPrayers();

    return {
      // Prendre le max entre serveur et local pour avoir la valeur la plus à jour
      currentStreak: Math.max(user?.streakCurrent ?? 0, localStreak),
      streakBest: user?.streakBest ?? 0,
      totalPrayers: Math.max(user?.totalPrayers ?? 0, localTotalPrayers),
    };
  }, [
    logs,
    user?.streakCurrent,
    user?.streakBest,
    user?.totalPrayers,
    getStreak,
    getTotalPrayers,
  ]);

  const avatarSource = useMemo(
    () => getAvatarSource(user?.avatar_id, user?.avatar_url),
    [user?.avatar_id, user?.avatar_url],
  );

  const handlePreferencePress = async (id: string) => {
    switch (id) {
      case "prayer":
        router.push("/settings/prayer");
        break;
      case "notifications":
        router.push("/settings/notifications");
        break;
      case "goals":
        router.push("/settings/goals");
        break;
      case "location":
        router.push("/settings/location");
        break;
      case "language":
        router.push("/settings/language");
        break;
      case "theme":
        router.push("/settings/theme");
        break;
      case "themes":
        router.push("/themes");
        break;
      case "support":
        router.push("/support");
        break;
      case "password":
        router.push("/settings/password");
        break;
      case "debug":
        router.push("/settings/debug");
        break;
      case "logout":
        setShowLogoutModal(true);
        break;
      default:
        console.log("Preference pressed:", id);
    }
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    setTimeout(() => {
      router.replace("/auth/login");
    }, 100);
  };

  // Rendu pour utilisateur NON connecté
  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-bg-light dark:bg-bg-dark">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header non connecté */}
          <View
            className="rounded-b-4xl overflow-hidden"
            style={{ minHeight: 320 }}
          >
            <LinearGradient
              colors={appTheme.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdQO7DmBVbuu03IH4BocFKDFkHmlUe2HE1SMJ8hEEP0N9z-aKcbbSzlGU3DVcXn-D1v-uxMZ2Q_WWZudOeijOi0hrg4Jk0GT83F2Mo31sUwByC3xc1deVXN2ubGgZVyVREHzB26yPLeEwviGWxhQcpIR25bjDWHkZbfz8f7Mbm_HNa368vc9k55RodXtXsFNZZm_u91vUH82knn_hPTGfdAi0dWm0qcPJBjs1uyWZUCGthXhCIpJKfERne5HKVvMzjBkZIEfHly_w",
              }}
              style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}
              resizeMode="cover"
            />

            <View className="flex-1 items-center justify-center px-4 pt-12">
              {/* Icône utilisateur */}
              <View className="w-25 h-25 rounded-full bg-white/10 items-center justify-center mb-4 border-2 border-white/20">
                <MaterialIconsRound
                  name="person"
                  size={50}
                  color="rgba(255,255,255,0.5)"
                />
              </View>

              {/* Statut */}
              <View className="flex-row items-center bg-red-500/20 px-4 py-2 rounded-full gap-2 mb-3">
                <View className="w-2 h-2 rounded-full bg-red-500" />
                <Text className="text-sm font-outfit-semibold text-red-300">
                  {t("settings.notConnected")}
                </Text>
              </View>

              <Text className="text-sm font-outfit-regular text-white/60 text-center">
                {t("settings.loginPrompt")}
              </Text>
            </View>
          </View>

          {/* Contenu principal */}
          <View className="px-4 -mt-5">
            {/* Carte invité avec deux boutons */}
            {user?.isGuest && (
              <View
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 mb-6 border border-accent"
                style={{
                  shadowColor: "#D97706",
                  shadowOpacity: 0.15,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                {/* En-tête avec icône */}
                <View className="flex-row items-center mb-3 gap-3">
                  <View className="w-11 h-11 rounded-full bg-amber-100 items-center justify-center">
                    <MaterialIconsRound
                      name="person-add"
                      size={24}
                      color="#D97706"
                    />
                  </View>
                  <View className="flex-1">
                    <AppText variant="h3" className="mb-0.5">
                      {t("settings.guestAccountTitle")}
                    </AppText>
                    <AppText
                      variant="caption"
                      className="text-text-secondary-light dark:text-text-secondary-dark"
                    >
                      {t("settings.guestAccountSubtitle")}
                    </AppText>
                  </View>
                </View>

                {/* Description */}
                <AppText variant="caption" className="mb-5 leading-5">
                  {t("settings.guestAccountDescription")}
                </AppText>

                {/* Bouton Créer un compte */}
                <Pressable
                  onPress={() => router.push("/auth/register")}
                  className="bg-accent px-6 py-3.5 rounded-2xl flex-row items-center justify-center gap-2.5 mb-3 active:opacity-80"
                >
                  <MaterialIconsRound
                    name="person-add"
                    size={20}
                    color="#fff"
                  />
                  <Text className="text-white font-outfit-semibold text-base">
                    {t("settings.createAccount")}
                  </Text>
                </Pressable>

                {/* Bouton Se connecter */}
                <Pressable
                  onPress={() => router.push("/auth/login")}
                  className="bg-transparent px-6 py-3.5 rounded-2xl flex-row items-center justify-center gap-2.5 border border-border-light dark:border-border-dark active:opacity-60"
                >
                  <MaterialIconsRound
                    name="login"
                    size={20}
                    color={isDark ? "#F8FAFC" : "#12201F"}
                  />
                  <Text className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold text-base">
                    {t("settings.loginExisting")}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Préférences disponibles */}
            <SettingsSection
              title={t("settings.application")}
              items={APP_PREFERENCES}
              onItemPress={handlePreferencePress}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Rendu pour utilisateur CONNECTÉ
  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header connecté */}
        <View
          className="rounded-b-4xl overflow-hidden"
          style={{ minHeight: 320, paddingTop: 36 }}
        >
          <LinearGradient
            colors={appTheme.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdQO7DmBVbuu03IH4BocFKDFkHmlUe2HE1SMJ8hEEP0N9z-aKcbbSzlGU3DVcXn-D1v-uxMZ2Q_WWZudOeijOi0hrg4Jk0GT83F2Mo31sUwByC3xc1deVXN2ubGgZVyVREHzB26yPLeEwviGWxhQcpIR25bjDWHkZbfz8f7Mbm_HNa368vc9k55RodXtXsFNZZm_u91vUH82knn_hPTGfdAi0dWm0qcPJBjs1uyWZUCGthXhCIpJKfERne5HKVvMzjBkZIEfHly_w",
            }}
            style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}
            resizeMode="cover"
          />

          <View className="items-center py-5">
            {/* Avatar avec bordure accent et bouton edit */}
            <View
              className="mb-3"
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: "rgba(217,119,6,0.5)",
                padding: 3,
              }}
            >
              <View
                className="w-full h-full rounded-full bg-white/10 items-center justify-center"
                style={{ borderWidth: 2, borderColor: appTheme.primary }}
              >
                {avatarSource ? (
                  <Image
                    source={avatarSource}
                    style={{ width: "100%", height: "100%", borderRadius: 50 }}
                  />
                ) : (
                  <MaterialIconsRound
                    name="person"
                    size={40}
                    color="rgba(255,255,255,0.7)"
                  />
                )}
              </View>
            </View>

            {/* Nom */}
            <Text
              className="text-white font-outfit-bold mb-4 text-center"
              style={{ fontSize: 24 }}
            >
              {user?.name || t("settings.guest")}
            </Text>

            {/* Bouton modifier le profil */}
            <Pressable
              onPress={() => router.push("/settings/profile")}
              className="flex-row items-center bg-white/10 px-5 py-2.5 rounded-full border border-white/20 gap-2 active:opacity-70"
            >
              <MaterialIconsRound name="edit-note" size={18} color="#fff" />
              <Text
                className="text-white font-outfit-medium"
                style={{ fontSize: 14 }}
              >
                {t("settings.editProfile")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Cartes de statistiques */}
        <View className="px-4 -mt-10 flex-row gap-4 mb-6">
          {/* Série actuelle */}
          <View
            className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-4 items-center border border-border-light dark:border-border-dark"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: isDark ? "#334155" : "#FFF7ED" }}
            >
              <MaterialIconsRound
                name="local-fire-department"
                size={24}
                color="#EA580C"
              />
            </View>
            <Text
              className="text-text-secondary-light font-outfit-regular dark:text-text-secondary-dark uppercase mb-1"
              style={{ fontSize: 10, letterSpacing: 1 }}
            >
              {t("settings.streak")}
            </Text>
            <Text className="text-text-primary-light dark:text-text-primary-dark font-outfit-bold text-2xl">
              {stats.currentStreak}{" "}
              <Text className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular text-xs">
                {t("settings.days")}
              </Text>
            </Text>
          </View>

          {/* Total prières */}
          <View
            className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-4 items-center border border-border-light dark:border-border-dark"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: isDark ? "#334155" : "#ECFDF5" }}
            >
              <MaterialIconsRound
                name="check-circle"
                size={24}
                color="#14B8A6"
              />
            </View>
            <Text
              className="text-text-secondary-light font-outfit-regular dark:text-text-secondary-dark uppercase mb-1"
              style={{ fontSize: 10, letterSpacing: 1 }}
            >
              {t("settings.totalPrayers")}
            </Text>
            <Text className="text-text-primary-light dark:text-text-primary-dark font-outfit-bold text-2xl">
              {stats.totalPrayers}
            </Text>
          </View>
        </View>

        {/* Contenu principal */}
        <View className="px-4">
          {/* Carte Lier mon compte (pour utilisateurs invités connectés) */}
          {user?.isGuest && (
            <View
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 mb-6 border border-accent"
              style={{
                shadowColor: "#D97706",
                shadowOpacity: 0.15,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              {/* En-tête avec icône */}
              <View className="flex-row items-center mb-3 gap-3">
                <View className="w-11 h-11 rounded-full bg-amber-100 items-center justify-center">
                  <MaterialIconsRound name="link" size={24} color="#D97706" />
                </View>
                <View className="flex-1">
                  <AppText variant="h3" className="mb-0.5">
                    {t("settings.guestAccountTitle")}
                  </AppText>
                  <AppText
                    variant="caption"
                    className="text-text-secondary-light dark:text-text-secondary-dark"
                  >
                    {t("settings.guestAccountSubtitle")}
                  </AppText>
                </View>
              </View>

              {/* Description */}
              <AppText variant="caption" className="mb-5 leading-5">
                {t("settings.linkAccountDescription")}
              </AppText>

              {/* Bouton Lier mon compte */}
              <Pressable
                onPress={() => router.push("/auth/link-account")}
                className="bg-accent px-6 py-3.5 rounded-2xl flex-row items-center justify-center gap-2.5 mb-3 active:opacity-80"
              >
                <MaterialIconsRound name="link" size={20} color="#fff" />
                <Text className="text-white font-outfit-semibold text-base">
                  {t("settings.linkAccount")}
                </Text>
              </Pressable>

              {/* Bouton Se connecter (compte existant) */}
              <Pressable
                onPress={() => router.push("/auth/login")}
                className="bg-transparent px-6 py-3.5 rounded-2xl flex-row items-center justify-center gap-2.5 border border-border-light dark:border-border-dark active:opacity-60"
              >
                <MaterialIconsRound
                  name="login"
                  size={20}
                  color={isDark ? "#F8FAFC" : "#12201F"}
                />
                <Text className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold text-base">
                  {t("settings.loginExisting")}
                </Text>
              </Pressable>
            </View>
          )}

          <SettingsSection
            title={t("settings.prayersReminders")}
            items={PRAYER_PREFERENCES}
            onItemPress={handlePreferencePress}
          />

          <SettingsSection
            title={t("settings.application")}
            items={APP_PREFERENCES}
            onItemPress={handlePreferencePress}
          />

          <SettingsSection
            title={t("settings.accountSupport")}
            items={ACCOUNT_PREFERENCES.filter((item) => {
              if (item.id === "password" && user?.isGuest) return false;
              if (item.id === "debug" && user?.role !== "dev" && user?.role !== "tester") return false;
              return true;
            })}
            onItemPress={handlePreferencePress}
          />

          {/* Version */}
          <Text className="text-center font-outfit-bold text-xs text-text-secondary-light dark:text-text-secondary-dark mt-6">
            Version 0.10.1 (test)
          </Text>
        </View>
      </ScrollView>

      {/* Modal de déconnexion */}
      <AlertDialog
        visible={showLogoutModal}
        title={t("settings.confirmLogout")}
        message={t("settings.confirmLogoutDesc")}
        buttons={[
          {
            text: t("common.cancel"),
            onPress: () => setShowLogoutModal(false),
            style: "default",
          },
          {
            text: t("common.confirm"),
            onPress: handleLogoutConfirm,
            style: "destructive",
          },
        ]}
        onDismiss={() => setShowLogoutModal(false)}
      />
    </View>
  );
}
