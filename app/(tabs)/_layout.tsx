import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { View, Text, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";

const ACCENT_COLOR = "#D97706"; // Amber
const TEAL_BASE = "#115E59";

// Composant icône animée pour les tabs
interface AnimatedTabIconProps {
  name: MaterialIconName;
  color: string;
  size: number;
  focused: boolean;
}

function AnimatedTabIcon({ name, color, size, focused }: AnimatedTabIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.5 : 1, {
      damping: 14,
      stiffness: 150,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialIconsRound name={name} size={size} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { width } = useWindowDimensions();

  // Responsive sizing
  const isSmall = width < 360;
  const isLarge = width >= 414;

  const tabBarHeight = isSmall ? 70 : isLarge ? 90 : 80;
  const tabBarPaddingBottom = isSmall ? 16 : isLarge ? 24 : 20;
  const tabBarPaddingTop = isSmall ? 8 : isLarge ? 12 : 10;
  const labelSize = isSmall ? 9 : isLarge ? 12 : 10;
  const iconSize = isSmall ? 24 : isLarge ? 28 : 26;
  const centerButtonSize = isSmall ? 50 : isLarge ? 62 : 56;
  const centerButtonMargin = isSmall ? -20 : isLarge ? -26 : -24;
  const centerIconSize = isSmall ? 22 : isLarge ? 30 : 26;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACCENT_COLOR,
        tabBarInactiveTintColor: isDark ? "#64748B" : "#94A3B8",
        tabBarStyle: {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          borderTopColor: isDark ? "#334155" : "#E2E8F0",
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: tabBarPaddingTop,
        },
        tabBarLabelStyle: {
          fontSize: labelSize,
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
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="home"
              size={iconSize}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t("nav.qibla"),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="explore"
              size={iconSize}
              color={color}
              focused={focused}
            />
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
              className="rounded-full items-center justify-center"
              style={{
                width: centerButtonSize,
                height: centerButtonSize,
                marginTop: centerButtonMargin,
                backgroundColor: TEAL_BASE,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <MaterialIconsRound
                name="book"
                size={centerIconSize}
                color="#ffffff"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: t("nav.tracking"),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="analytics"
              size={iconSize}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("nav.profile"),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="person"
              size={iconSize}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
