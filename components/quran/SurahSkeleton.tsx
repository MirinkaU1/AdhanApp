// Skeleton loader pour la liste des sourates du Quran
import React from "react";
import { View, Animated, Easing } from "react-native";
import { useIsDark } from "@/components/useColorScheme";

interface SurahSkeletonProps {
  count?: number;
}

export function SurahSkeleton({ count = 10 }: SurahSkeletonProps) {
  const isDark = useIsDark();

  // Animation shimmer
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const SkeletonItem = () => (
    <View
      className="flex-row items-center p-4 mb-3 rounded-2xl"
      style={{
        backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
        overflow: "hidden",
      }}
    >
      {/* Numéro placeholder */}
      <View
        className="w-12 h-12 rounded-xl mr-4"
        style={{
          backgroundColor: isDark ? "#334155" : "#E2E8F0",
        }}
      />

      {/* Info sourate placeholder */}
      <View className="flex-1">
        <View
          className="h-5 w-32 rounded mb-2"
          style={{
            backgroundColor: isDark ? "#334155" : "#E2E8F0",
          }}
        />
        <View
          className="h-3 w-24 rounded"
          style={{
            backgroundColor: isDark ? "#475569" : "#CBD5E1",
          }}
        />
      </View>

      {/* Shimmer overlay */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
          backgroundColor: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.3)",
        }}
      />
    </View>
  );

  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
}

export default SurahSkeleton;
