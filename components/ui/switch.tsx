import { cn } from "@/lib/utils";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useEffect } from "react";

interface SwitchProps {
  /** État du switch */
  value?: boolean;
  /** Callback quand la valeur change */
  onValueChange?: (value: boolean) => void;
  /** Aussi accepte checked/onCheckedChange pour compatibilité */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Couleur personnalisée quand actif */
  activeColor?: string;
  /** Couleur inactive */
  inactiveColor?: string;
  /** Désactivé */
  disabled?: boolean;
  className?: string;
}

// Courbe de Bézier personnalisée: cubic-bezier(0.85, 0, 0.15, 1)
const customEasing = Easing.bezier(0.85, 0, 0.15, 1);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Switch({
  className,
  value,
  onValueChange,
  checked,
  onCheckedChange,
  activeColor = "#0f766e",
  inactiveColor = "#E2E8F0",
  disabled = false,
}: SwitchProps) {
  // Support les deux APIs: value/onValueChange et checked/onCheckedChange
  const isChecked = checked ?? value ?? false;

  const handlePress = () => {
    if (disabled) return;
    const newValue = !isChecked;
    onCheckedChange?.(newValue);
    onValueChange?.(newValue);
  };

  // Animation progress (0 = off, 1 = on)
  const progress = useSharedValue(isChecked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isChecked ? 1 : 0, {
      duration: 250,
      easing: customEasing,
    });
  }, [isChecked]);

  // Style animé pour le track (fond)
  const trackAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor],
    ),
  }));

  // Style animé pour le thumb
  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      className={cn(
        "flex h-8 w-14 shrink-0 flex-row items-center rounded-full p-0.5",
        disabled && "opacity-50",
        className,
      )}
      style={trackAnimatedStyle}
    >
      <Animated.View
        className="bg-white size-7 rounded-full shadow-md"
        style={thumbAnimatedStyle}
      />
    </AnimatedPressable>
  );
}

export { Switch };
