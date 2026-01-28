import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { AlertDialog } from "@/components/ui";
import useThemeStore from "@/stores/useThemeStore";
import useAuthStore from "@/stores/useAuthStore";
import usePrayerStore from "@/stores/usePrayerStore";

// Configuration des préférences
interface PreferenceItem {
  id: string;
  icon: MaterialIconName;
  iconBgColor: string;
  iconColor: string;
  labelKey: string;
  valueKey?: string;
  isDestructive?: boolean;
  section?: string;
}

// Section "Prières & Rappels"
const PRAYER_PREFERENCES: PreferenceItem[] = [
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

// Section "Application"
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
];

// Section "Compte & Support"
const ACCOUNT_PREFERENCES: PreferenceItem[] = [
  {
    id: "account",
    icon: "account-circle",
    iconBgColor: "#E0E7FF",
    iconColor: "#6366F1",
    labelKey: "settings.profile",
  },
  {
    id: "support",
    icon: "favorite",
    iconBgColor: "#FCE7F3",
    iconColor: "#EC4899",
    labelKey: "settings.support",
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

export default function ProfileScreen() {
  const { t } = useTranslation();
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const colors = {
    bg: isDark ? "#0F172A" : "#F3F4F6",
    card: isDark ? "#1E293B" : "#FFFFFF",
    textPrimary: isDark ? "#F8FAFC" : "#1E293B",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    accent: "#D97706",
    tealDark: "#115E59",
    tealDeep: "#0d4542",
  };

  // Stats utilisateur (depuis le store)
  const prayerStore = usePrayerStore();
  const stats = {
    currentStreak: prayerStore.getStreak ? prayerStore.getStreak() : 0,
    totalPrayers: prayerStore.getTotalPrayers
      ? prayerStore.getTotalPrayers()
      : 0,
  };

  const handlePreferencePress = async (id: string) => {
    switch (id) {
      case "notifications":
        router.push("/settings/notifications");
        break;
      case "goals":
        router.push("/settings/goals");
        break;
      case "hijri":
        router.push("/settings/hijri");
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
      case "account":
        router.push("/auth/login");
        break;
      case "support":
        router.push("/support");
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
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header non connecté */}
          <View
            style={{
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              overflow: "hidden",
              minHeight: 320,
            }}
          >
            <LinearGradient
              colors={[colors.tealDark, colors.tealDeep]}
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

            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingTop: 48,
              }}
            >
              {/* Icône utilisateur */}
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <MaterialIconsRound
                  name="person"
                  size={50}
                  color="rgba(255,255,255,0.5)"
                />
              </View>

              {/* Statut */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#EF4444",
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Outfit_600SemiBold",
                    color: "#FCA5A5",
                  }}
                >
                  {t("settings.notConnected")}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Outfit_400Regular",
                  color: "rgba(255,255,255,0.6)",
                  textAlign: "center",
                }}
              >
                {t("settings.loginPrompt")}
              </Text>
            </View>
          </View>

          {/* Contenu principal */}
          <View style={{ paddingHorizontal: 16, marginTop: -20 }}>
            {/* Carte de connexion */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 24,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Outfit_700Bold",
                  color: colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                {t("auth.login")}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Outfit_400Regular",
                  color: colors.textSecondary,
                  marginBottom: 20,
                  lineHeight: 20,
                }}
              >
                {t("settings.loginPrompt")}
              </Text>

              {/* Bouton de connexion */}
              <Pressable
                onPress={() => router.push("/auth/login")}
                style={{
                  backgroundColor: colors.accent,
                  paddingVertical: 16,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <MaterialIconsRound name="login" size={22} color="#fff" />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Outfit_600SemiBold",
                    color: "#fff",
                  }}
                >
                  {t("settings.login")}
                </Text>
              </Pressable>
            </View>

            {/* Préférences - Prières & Rappels */}
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Outfit_700Bold",
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              {t("settings.prayerSection")}
            </Text>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 24,
              }}
            >
              {PRAYER_PREFERENCES.map((pref, index) => (
                <Pressable
                  key={pref.id}
                  onPress={() => handlePreferencePress(pref.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    borderBottomWidth:
                      index < PRAYER_PREFERENCES.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isDark ? "#334155" : pref.iconBgColor,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIconsRound
                        name={pref.icon}
                        size={22}
                        color={pref.iconColor}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Outfit_500Medium",
                        color: colors.textPrimary,
                      }}
                    >
                      {t(pref.labelKey)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {pref.valueKey && (
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Outfit_400Regular",
                          color: colors.textSecondary,
                        }}
                      >
                        {t(pref.valueKey)}
                      </Text>
                    )}
                    <MaterialIconsRound
                      name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Préférences - Application */}
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Outfit_700Bold",
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              {t("settings.appSection")}
            </Text>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 24,
              }}
            >
              {APP_PREFERENCES.map((pref, index) => (
                <Pressable
                  key={pref.id}
                  onPress={() => handlePreferencePress(pref.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    borderBottomWidth:
                      index < APP_PREFERENCES.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isDark ? "#334155" : pref.iconBgColor,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIconsRound
                        name={pref.icon}
                        size={22}
                        color={pref.iconColor}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Outfit_500Medium",
                        color: colors.textPrimary,
                      }}
                    >
                      {t(pref.labelKey)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {pref.valueKey && (
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Outfit_400Regular",
                          color: colors.textSecondary,
                        }}
                      >
                        {t(pref.valueKey)}
                      </Text>
                    )}
                    <MaterialIconsRound
                      name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Support */}
            <Pressable
              onPress={() => router.push("/support")}
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isDark ? "#334155" : "#FCE7F3",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIconsRound
                    name="favorite"
                    size={22}
                    color="#EC4899"
                  />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Outfit_500Medium",
                    color: colors.textPrimary,
                  }}
                >
                  {t("settings.supportDeveloper")}
                </Text>
              </View>
              <MaterialIconsRound
                name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>

            {/* Version */}
            <Text
              style={{
                textAlign: "center",
                fontSize: 12,
                fontFamily: "Outfit_400Regular",
                color: colors.textSecondary,
                marginTop: 32,
              }}
            >
              MaPrière v2.4.1
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Rendu pour utilisateur CONNECTÉ

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Modal de déconnexion */}
      <AlertDialog
        visible={showLogoutModal}
        title={t("settings.logout")}
        message="Êtes-vous sûr de vouloir vous déconnecter de votre compte ?"
        icon="logout"
        iconColor="#EF4444"
        onDismiss={() => setShowLogoutModal(false)}
        buttons={[
          {
            text: "Annuler",
            onPress: () => setShowLogoutModal(false),
            style: "default",
          },
          {
            text: "Déconnexion",
            onPress: handleLogoutConfirm,
            style: "destructive",
          },
        ]}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec photo de profil */}
        <View
          style={{
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
            overflow: "hidden",
            minHeight: 320,
            paddingTop: 36,
          }}
        >
          <LinearGradient
            colors={[colors.tealDark, colors.tealDeep]}
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

          {/* Photo et infos */}
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            {/* Avatar avec bordure */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: `${colors.accent}80`,
                padding: 3,
                marginBottom: 12,
              }}
            >
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 50,
                    borderWidth: 2,
                    borderColor: colors.tealDark,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 50,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: colors.tealDark,
                  }}
                >
                  <MaterialIconsRound
                    name="person"
                    size={40}
                    color="rgba(255,255,255,0.7)"
                  />
                </View>
              )}
              {/* Bouton edit */}
              <Pressable
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.tealDark,
                }}
              >
                <MaterialIconsRound name="edit" size={14} color="#fff" />
              </Pressable>
            </View>

            {/* Nom */}
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Outfit_700Bold",
                color: "#fff",
                marginBottom: 4,
              }}
            >
              {user?.name || "Utilisateur"}
            </Text>

            {/* Membre depuis */}
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Outfit_300Light",
                color: "rgba(255,255,255,0.6)",
                marginBottom: 16,
              }}
            >
              Membre depuis {user?.memberSince || "aujourd'hui"}
            </Text>

            {/* Bouton modifier */}
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.1)",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                gap: 8,
              }}
            >
              <MaterialIconsRound name="edit-note" size={18} color="#fff" />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Outfit_500Medium",
                  color: "#fff",
                }}
              >
                Modifier le profil
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Contenu principal */}
        <View style={{ paddingHorizontal: 16, marginTop: -20 }}>
          {/* Statistiques */}
          <View
            style={{
              flexDirection: "row",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Série actuelle */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 20,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#FFF7ED",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIconsRound
                  name="local-fire-department"
                  size={24}
                  color="#EA580C"
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Outfit_500Medium",
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                {t("settings.streak")}
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Outfit_700Bold",
                  color: colors.textPrimary,
                }}
              >
                {stats.currentStreak}{" "}
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Outfit_400Regular",
                    color: colors.textSecondary,
                  }}
                >
                  {t("settings.days")}
                </Text>
              </Text>
            </View>

            {/* Total prières */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 20,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#ECFDF5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIconsRound
                  name="check-circle"
                  size={24}
                  color="#14B8A6"
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Outfit_500Medium",
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                {t("settings.totalPrayers")}
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Outfit_700Bold",
                  color: colors.textPrimary,
                }}
              >
                {stats.totalPrayers}
              </Text>
            </View>
          </View>

          {/* Section de connexion pour les invités */}
          {user?.isGuest && (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 24,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.accent,
                shadowColor: colors.accent,
                shadowOpacity: 0.15,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#FEF3C7",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIconsRound
                    name="person-add"
                    size={24}
                    color={colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: "Outfit_700Bold",
                      color: colors.textPrimary,
                    }}
                  >
                    {t("settings.guestAccountTitle")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Outfit_400Regular",
                      color: colors.textSecondary,
                    }}
                  >
                    {t("settings.guestAccountSubtitle")}
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Outfit_400Regular",
                  color: colors.textSecondary,
                  marginBottom: 20,
                  lineHeight: 20,
                }}
              >
                {t("settings.guestAccountDescription")}
              </Text>

              {/* Bouton Créer un compte */}
              <Pressable
                onPress={() => router.push("/auth/register")}
                style={{
                  backgroundColor: colors.accent,
                  paddingVertical: 14,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <MaterialIconsRound name="person-add" size={20} color="#fff" />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Outfit_600SemiBold",
                    color: "#fff",
                  }}
                >
                  {t("settings.createAccount")}
                </Text>
              </Pressable>

              {/* Bouton Se connecter */}
              <Pressable
                onPress={() => router.push("/auth/login")}
                style={{
                  backgroundColor: "transparent",
                  paddingVertical: 14,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <MaterialIconsRound
                  name="login"
                  size={20}
                  color={colors.textPrimary}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Outfit_600SemiBold",
                    color: colors.textPrimary,
                  }}
                >
                  {t("settings.loginExisting")}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Préférences - Prières & Rappels */}
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Outfit_700Bold",
              color: colors.textPrimary,
              marginBottom: 16,
            }}
          >
            {t("settings.prayerSection")}
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
          >
            {PRAYER_PREFERENCES.map((pref, index) => (
              <Pressable
                key={pref.id}
                onPress={() => handlePreferencePress(pref.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth:
                    index < PRAYER_PREFERENCES.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? "#334155" : pref.iconBgColor,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIconsRound
                      name={pref.icon}
                      size={22}
                      color={pref.iconColor}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Outfit_500Medium",
                      color: colors.textPrimary,
                    }}
                  >
                    {t(pref.labelKey)}
                  </Text>
                </View>

                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  {pref.valueKey && (
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Outfit_400Regular",
                        color: colors.textSecondary,
                      }}
                    >
                      {t(pref.valueKey)}
                    </Text>
                  )}
                  <MaterialIconsRound
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Préférences - Application */}
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Outfit_700Bold",
              color: colors.textPrimary,
              marginBottom: 16,
            }}
          >
            {t("settings.appSection")}
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
          >
            {APP_PREFERENCES.map((pref, index) => (
              <Pressable
                key={pref.id}
                onPress={() => handlePreferencePress(pref.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth: index < APP_PREFERENCES.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? "#334155" : pref.iconBgColor,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIconsRound
                      name={pref.icon}
                      size={22}
                      color={pref.iconColor}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Outfit_500Medium",
                      color: colors.textPrimary,
                    }}
                  >
                    {t(pref.labelKey)}
                  </Text>
                </View>

                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  {pref.valueKey && (
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Outfit_400Regular",
                        color: colors.textSecondary,
                      }}
                    >
                      {t(pref.valueKey)}
                    </Text>
                  )}
                  <MaterialIconsRound
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Préférences - Compte & Support */}
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Outfit_700Bold",
              color: colors.textPrimary,
              marginBottom: 16,
            }}
          >
            {t("settings.aboutSection")}
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {ACCOUNT_PREFERENCES.map((pref, index) => (
              <Pressable
                key={pref.id}
                onPress={() => handlePreferencePress(pref.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth:
                    index < ACCOUNT_PREFERENCES.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? "#334155" : pref.iconBgColor,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIconsRound
                      name={pref.icon}
                      size={22}
                      color={pref.iconColor}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Outfit_500Medium",
                      color: pref.isDestructive
                        ? "#EF4444"
                        : colors.textPrimary,
                    }}
                  >
                    {t(pref.labelKey)}
                  </Text>
                </View>

                {!pref.isDestructive && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {pref.valueKey && (
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Outfit_400Regular",
                          color: colors.textSecondary,
                        }}
                      >
                        {t(pref.valueKey)}
                      </Text>
                    )}
                    <MaterialIconsRound
                      name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Version */}
          <Text
            style={{
              textAlign: "center",
              fontSize: 12,
              fontFamily: "Outfit_400Regular",
              color: colors.textSecondary,
              marginTop: 32,
            }}
          >
            MaPrière v0.10.1
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
