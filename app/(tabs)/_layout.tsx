import React from "react";
import { Tabs } from "expo-router";
import { View } from "react-native";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";

const ACCENT_COLOR = "#D97706"; // Amber
const TEAL_BASE = "#115E59";

export default function TabLayout() {
  const { t } = useTranslation();
  const isDark = useIsDark();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACCENT_COLOR,
        tabBarInactiveTintColor: isDark ? "#64748B" : "#94A3B8",
        tabBarStyle: {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          borderTopColor: isDark ? "#334155" : "#E2E8F0",
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          fontFamily: "Outfit_500Medium",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color }) => (
            <MaterialIconsRound name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t("nav.qibla"),
          tabBarIcon: ({ color }) => (
            <MaterialIconsRound name="explore" size={22} color={color} />
          ),
        }}
      />
      {/* Bouton central Coran/Lecture */}
      <Tabs.Screen
        name="quran"
        options={{
          title: "",
          tabBarIcon: () => (
            <View
              className="w-14 h-14 -mt-6 rounded-full items-center justify-center"
              style={{
                backgroundColor: TEAL_BASE,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <MaterialIconsRound name="book" size={26} color="#ffffff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: t("nav.tracking"),
          tabBarIcon: ({ color }) => (
            <MaterialIconsRound name="analytics" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("nav.profile"),
          tabBarIcon: ({ color }) => (
            <MaterialIconsRound name="person" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
