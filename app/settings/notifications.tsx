import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { Switch } from "@/components/ui";
import { useIsDark } from "@/components/useColorScheme";

interface PrayerNotification {
  id: string;
  nameKey: string;
  arabicName: string;
  icon: MaterialIconName;
  enabled: boolean;
  adhanEnabled: boolean;
}

const INITIAL_PRAYERS: PrayerNotification[] = [
  {
    id: "fajr",
    nameKey: "prayers.fajr",
    arabicName: "الفجر",
    icon: "wb-twilight",
    enabled: true,
    adhanEnabled: true,
  },
  {
    id: "sunrise",
    nameKey: "prayers.sunrise",
    arabicName: "الشروق",
    icon: "wb-sunny",
    enabled: false,
    adhanEnabled: false,
  },
  {
    id: "dhuhr",
    nameKey: "prayers.dhuhr",
    arabicName: "الظهر",
    icon: "light-mode",
    enabled: true,
    adhanEnabled: true,
  },
  {
    id: "asr",
    nameKey: "prayers.asr",
    arabicName: "العصر",
    icon: "wb-cloudy",
    enabled: true,
    adhanEnabled: true,
  },
  {
    id: "maghrib",
    nameKey: "prayers.maghrib",
    arabicName: "المغرب",
    icon: "nights-stay",
    enabled: true,
    adhanEnabled: true,
  },
  {
    id: "isha",
    nameKey: "prayers.isha",
    arabicName: "العشاء",
    icon: "dark-mode",
    enabled: true,
    adhanEnabled: true,
  },
];

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [prayers, setPrayers] = useState(INITIAL_PRAYERS);

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
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <LinearGradient
        colors={["#115E59", "#0d4542"]}
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
              {t("notifications.title")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("notifications.subtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(168, 85, 247, 0.2)" }}
          >
            <MaterialIconsRound
              name="notifications-active"
              size={26}
              color="#A855F7"
            />
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
        {/* Activation globale */}
        <View className="bg-card-light dark:bg-card-dark rounded-2xl p-5 mb-6 border border-border-light dark:border-border-dark flex-row items-center justify-between">
          <View className="flex-row items-center gap-4 flex-1">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#334155" : "#F3E8FF" }}
            >
              <MaterialIconsRound
                name="notifications"
                size={24}
                color="#A855F7"
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                style={{ fontSize: 16 }}
                numberOfLines={1}
              >
                {t("notifications.enableNotifications")}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular mt-0.5"
                style={{ fontSize: 13 }}
                numberOfLines={1}
              >
                {t("notifications.enableNotificationsDesc")}
              </Text>
            </View>
          </View>
          <Switch
            value={globalEnabled}
            onValueChange={setGlobalEnabled}
            activeColor="#A855F7"
          />
        </View>

        {/* Liste des prières */}
        <Text
          className="text-text-primary-light dark:text-text-primary-dark font-outfit-bold mb-4"
          style={{ fontSize: 18 }}
        >
          {t("notifications.prayers")}
        </Text>

        <View
          className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark"
          style={{ opacity: globalEnabled ? 1 : 0.5 }}
          pointerEvents={globalEnabled ? "auto" : "none"}
        >
          {prayers.map((prayer, index) => (
            <View
              key={prayer.id}
              className="p-4"
              style={{
                borderBottomWidth: index < prayers.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? "#334155" : "#F1F5F9",
              }}
            >
              {/* Ligne principale */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3.5 flex-1">
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isDark
                        ? "#334155"
                        : prayer.enabled
                          ? "#F3E8FF"
                          : "#F1F5F9",
                    }}
                  >
                    <MaterialIconsRound
                      name={prayer.icon}
                      size={22}
                      color={
                        prayer.enabled
                          ? "#A855F7"
                          : isDark
                            ? "#94A3B8"
                            : "#64748B"
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                      style={{ fontSize: 16 }}
                      numberOfLines={1}
                    >
                      {t(prayer.nameKey)}
                    </Text>
                    <Text
                      className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                      style={{ fontSize: 13 }}
                      numberOfLines={1}
                    >
                      {prayer.arabicName}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={prayer.enabled}
                  onValueChange={() => togglePrayerNotification(prayer.id)}
                  activeColor="#A855F7"
                />
              </View>

              {/* Option Adhan (si notification activée et pas sunrise) */}
              {prayer.enabled && prayer.id !== "sunrise" && (
                <View
                  className="flex-row items-center justify-between mt-3 pt-3"
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: isDark ? "#334155" : "#F1F5F9",
                    marginLeft: 58,
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <MaterialIconsRound
                      name="volume-up"
                      size={18}
                      color={isDark ? "#94A3B8" : "#64748B"}
                    />
                    <Text
                      className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium"
                      style={{ fontSize: 14 }}
                    >
                      {t("notifications.playAdhan")}
                    </Text>
                  </View>
                  <Switch
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
          className="flex-row items-start gap-3 mt-6 p-4 rounded-2xl"
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
            {t("notifications.info")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
