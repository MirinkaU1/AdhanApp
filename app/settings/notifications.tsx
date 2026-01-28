import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import useThemeStore from "@/stores/useThemeStore";
import { ModernSwitch } from "@/components/ui";

interface PrayerNotification {
  id: string;
  name: string;
  arabicName: string;
  icon: MaterialIconName;
  enabled: boolean;
  adhanEnabled: boolean;
}

const INITIAL_PRAYERS: PrayerNotification[] = [
  {
    id: "fajr",
    name: "Fajr",
    arabicName: "الفجر",
    icon: "wb-twilight",
    enabled: true,
    adhanEnabled: true,
  },
  {
    id: "sunrise",
    name: "Lever du soleil",
    arabicName: "الشروق",
    icon: "wb-sunny",
    enabled: false,
    adhanEnabled: false,
  },
  {
    id: "dhuhr",
    name: "Dhuhr",
    arabicName: "الظهر",
    icon: "light-mode",
    enabled: true,
    adhanEnabled: true,
  },
  {
    id: "asr",
    name: "Asr",
    arabicName: "العصر",
    icon: "wb-cloudy",
    enabled: true,
    adhanEnabled: true,
  },
  {
    id: "maghrib",
    name: "Maghrib",
    arabicName: "المغرب",
    icon: "nights-stay",
    enabled: true,
    adhanEnabled: true,
  },
  {
    id: "isha",
    name: "Isha",
    arabicName: "العشاء",
    icon: "dark-mode",
    enabled: true,
    adhanEnabled: true,
  },
];

export default function NotificationsScreen() {
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [prayers, setPrayers] = useState(INITIAL_PRAYERS);

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const colors = {
    bg: isDark ? "#0F172A" : "#F3F4F6",
    card: isDark ? "#1E293B" : "#FFFFFF",
    textPrimary: isDark ? "#F8FAFC" : "#1E293B",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    accent: "#A855F7",
    tealDark: "#115E59",
    tealDeep: "#0d4542",
  };

  const togglePrayerNotification = (id: string) => {
    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    );
  };

  const togglePrayerAdhan = (id: string) => {
    setPrayers((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, adhanEnabled: !p.adhanEnabled } : p,
      ),
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.tealDark, colors.tealDeep]}
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Outfit_700Bold",
                color: "#fff",
              }}
            >
              Notifications
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Outfit_400Regular",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Gérez vos rappels de prière
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(168, 85, 247, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound
              name="notifications-active"
              size={26}
              color={colors.accent}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Activation globale */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              flex: 1,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDark ? "#334155" : "#F3E8FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIconsRound
                name="notifications"
                size={24}
                color={colors.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Outfit_600SemiBold",
                  color: colors.textPrimary,
                }}
                numberOfLines={1}
              >
                Activer les notifications
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Outfit_400Regular",
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                Recevoir des rappels pour les prières
              </Text>
            </View>
          </View>
          <ModernSwitch
            value={globalEnabled}
            onValueChange={setGlobalEnabled}
            activeColor={colors.accent}
          />
        </View>

        {/* Liste des prières */}
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Outfit_700Bold",
            color: colors.textPrimary,
            marginBottom: 16,
          }}
        >
          Prières
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
            opacity: globalEnabled ? 1 : 0.5,
          }}
          pointerEvents={globalEnabled ? "auto" : "none"}
        >
          {prayers.map((prayer, index) => (
            <View
              key={prayer.id}
              style={{
                padding: 16,
                borderBottomWidth: index < prayers.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              {/* Ligne principale */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark
                        ? "#334155"
                        : prayer.enabled
                          ? "#F3E8FF"
                          : "#F1F5F9",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIconsRound
                      name={prayer.icon}
                      size={22}
                      color={
                        prayer.enabled ? colors.accent : colors.textSecondary
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Outfit_600SemiBold",
                        color: colors.textPrimary,
                      }}
                      numberOfLines={1}
                    >
                      {prayer.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: "Outfit_400Regular",
                        color: colors.textSecondary,
                      }}
                      numberOfLines={1}
                    >
                      {prayer.arabicName}
                    </Text>
                  </View>
                </View>
                <ModernSwitch
                  value={prayer.enabled}
                  onValueChange={() => togglePrayerNotification(prayer.id)}
                  activeColor={colors.accent}
                />
              </View>

              {/* Option Adhan (si notification activée et pas sunrise) */}
              {prayer.enabled && prayer.id !== "sunrise" && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    marginLeft: 58,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <MaterialIconsRound
                      name="volume-up"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Outfit_500Medium",
                        color: colors.textSecondary,
                      }}
                    >
                      Jouer l'Adhan
                    </Text>
                  </View>
                  <ModernSwitch
                    value={prayer.adhanEnabled}
                    onValueChange={() => togglePrayerAdhan(prayer.id)}
                    activeColor="#14B8A6"
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            marginTop: 24,
            padding: 16,
            backgroundColor: isDark ? "#1E3A5F" : "#EFF6FF",
            borderRadius: 16,
          }}
        >
          <MaterialIconsRound name="info" size={20} color="#3B82F6" />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: "Outfit_400Regular",
              color: isDark ? "#93C5FD" : "#1E40AF",
              lineHeight: 20,
            }}
          >
            Les notifications seront envoyées à l'heure exacte de chaque prière
            selon votre localisation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
