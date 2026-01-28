import React from "react";
import { View, Pressable, Text } from "react-native";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";

export interface ButtonGroupItem {
  id: string;
  icon: MaterialIconName;
  iconBgColor: string;
  iconColor: string;
  label: string;
  value?: string;
  isDestructive?: boolean;
  onPress: () => void;
}

interface AppButtonGroupProps {
  items: ButtonGroupItem[];
  /** Additional className for the container */
  className?: string;
}

/**
 * AppButtonGroup - Groupe de boutons dans une carte arrondie
 * Reproduit le design original de settings avec séparateurs
 */
export default function AppButtonGroup({
  items,
  className = "",
}: AppButtonGroupProps) {
  const isDark = useIsDark();

  return (
    <View
      className={`bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-border-light dark:border-border-dark ${className}`}
    >
      {items.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          className={`flex-row items-center justify-between p-4 active:opacity-70 ${
            index < items.length - 1
              ? "border-b border-slate-100 dark:border-slate-700"
              : ""
          }`}
        >
          {/* Left side: Icon + Label */}
          <View className="flex-row items-center gap-4 flex-1">
            {/* Icon with colored background */}
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{
                backgroundColor: isDark ? "#334155" : item.iconBgColor,
              }}
            >
              <MaterialIconsRound
                name={item.icon}
                size={22}
                color={item.iconColor}
              />
            </View>

            {/* Label */}
            <Text
              className={`text-base font-outfit-medium ${
                item.isDestructive
                  ? "text-red-500"
                  : "text-text-primary-light dark:text-text-primary-dark"
              }`}
            >
              {item.label}
            </Text>
          </View>

          {/* Right side: Value + Chevron */}
          <View className="flex-row items-center gap-2">
            {item.value && (
              <Text className="text-sm font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark">
                {item.value}
              </Text>
            )}
            <MaterialIconsRound
              name="chevron-right"
              size={20}
              color={
                item.isDestructive ? "#EF4444" : isDark ? "#94A3B8" : "#64748B"
              }
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}
