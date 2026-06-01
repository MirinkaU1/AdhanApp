import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
} from "react-native";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";

interface AppSelectProps {
  label?: string;
  icon?: MaterialIconName;
  value?: string;
  placeholder?: string;
  error?: string;
  warning?: string;
  onPress: () => void;
  containerClassName?: string;
}

export default function AppSelect({
  label,
  icon,
  value,
  placeholder,
  error,
  warning,
  onPress,
  containerClassName = "",
}: AppSelectProps) {
  const isDark = useIsDark();
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 360;
  const isLargeScreen = width >= 414;

  const labelSize = isSmallScreen ? 11 : isLargeScreen ? 14 : 12;
  const inputFontSize = isSmallScreen ? 14 : isLargeScreen ? 18 : 16;
  const errorSize = isSmallScreen ? 10 : isLargeScreen ? 13 : 11;
  const iconSize = isSmallScreen ? 20 : isLargeScreen ? 26 : 24;
  const inputHeight = isSmallScreen ? 52 : isLargeScreen ? 64 : 56;
  const horizontalPadding = isSmallScreen ? 14 : isLargeScreen ? 20 : 16;

  const placeholderColor = isDark ? "#64748B" : "#94A3B8";
  const iconColor = isDark ? "#64748B" : "#94A3B8";
  const textColor = isDark ? "#F8FAFC" : "#1E293B";
  const valueColor = value ? textColor : placeholderColor;

  const hasError = !!error;
  const hasWarning = !!warning && !hasError;
  const hasValue = !!value;

  return (
    <View className={containerClassName}>
      {label && (
        <Text
          className="font-outfit-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest mb-2 ml-1"
          style={{ fontSize: labelSize }}
        >
          {label}
        </Text>
      )}
      <Pressable
        onPress={onPress}
        className={`flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-2xl border ${
          hasError
            ? "border-red-500"
            : hasWarning
              ? "border-amber-400"
              : "border-border-light dark:border-border-dark"
        }`}
        style={{ height: inputHeight, paddingHorizontal: horizontalPadding }}
      >
        {icon && (
          <MaterialIconsRound name={icon} size={iconSize} color={iconColor} />
        )}
        <Text
          className={`flex-1 font-outfit-medium text-text-primary-light dark:text-text-primary-dark ${icon ? "px-3" : ""}`}
          style={{ color: valueColor, fontSize: inputFontSize }}
        >
          {value || placeholder}
        </Text>
        <MaterialIconsRound
          name="expand-more"
          size={iconSize}
          color={iconColor}
        />
      </Pressable>
      {hasError && (
        <Text
          className="font-outfit-medium text-red-500 mt-1 ml-1"
          style={{ fontSize: errorSize }}
        >
          {error}
        </Text>
      )}
      {hasWarning && (
        <Text
          className="font-outfit-medium text-amber-500 mt-1 ml-1"
          style={{ fontSize: errorSize }}
        >
          {warning}
        </Text>
      )}
    </View>
  );
}