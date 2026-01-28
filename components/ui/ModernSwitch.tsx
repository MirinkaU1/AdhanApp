import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import { useCallback, useEffect } from "react";
import { useIsDark } from "@/components/useColorScheme";

export interface ModernSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
}

export default function ModernSwitch({
  value,
  onValueChange,
  activeColor = "#0f766e", // Teal primary
  inactiveColor,
  disabled = false,
}: ModernSwitchProps) {
  const isDark = useIsDark();
  const progress = useSharedValue(value ? 1 : 0);

  // Couleur inactive selon le thème
  const resolvedInactiveColor =
    inactiveColor ?? (isDark ? "#475569" : "#E2E8F0");

  const handlePress = useCallback(() => {
    if (disabled) return;
    const newValue = !value;
    progress.value = withSpring(newValue ? 1 : 0, {
      damping: 20,
      stiffness: 120,
    });
    onValueChange(newValue);
  }, [value, onValueChange, disabled, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [resolvedInactiveColor, activeColor],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }],
  }));

  // Synchroniser progress avec value (évite le warning Reanimated)
  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      damping: 20,
      stiffness: 120,
    });
  }, [value]);

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
