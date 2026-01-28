/**
 * XpToast - Composant de notification XP animé
 *
 * Affiche un toast en haut de l'écran quand l'utilisateur gagne de l'XP
 */

import { useEffect, useRef, useState } from "react";
import { Text, View, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useQuestStore, { XpGain } from "@/stores/useQuestStore";
import { useTranslation } from "react-i18next";

const TOAST_DURATION = 2500;
const ANIMATION_DURATION = 300;
const TOP_OFFSET = Platform.OS === "ios" ? 50 : 40;

export default function XpToast() {
  const { t } = useTranslation();
  const [currentGain, setCurrentGain] = useState<XpGain | null>(null);
  const pendingXpGains = useQuestStore((s) => s.pendingXpGains);
  const consumePendingXpGain = useQuestStore((s) => s.consumePendingXpGain);

  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const isAnimating = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Process pending XP gains
  useEffect(() => {
    if (pendingXpGains.length > 0 && !isAnimating.current && !currentGain) {
      const gain = consumePendingXpGain();
      if (gain) {
        showToast(gain);
      }
    }
  }, [pendingXpGains.length, currentGain]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showToast = (gain: XpGain) => {
    isAnimating.current = true;
    setCurrentGain(gain);

    // Reset values
    translateY.value = -100;
    opacity.value = 0;
    scale.value = 0.8;

    // Animate in
    translateY.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    opacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    scale.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });

    // Schedule hide
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, TOAST_DURATION);
  };

  const hideToast = () => {
    translateY.value = withTiming(-100, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    opacity.value = withTiming(0, { duration: ANIMATION_DURATION });
    scale.value = withTiming(0.8, { duration: ANIMATION_DURATION });

    // Wait for animation to complete
    timeoutRef.current = setTimeout(() => {
      onAnimationEnd();
    }, ANIMATION_DURATION + 50);
  };

  const onAnimationEnd = () => {
    isAnimating.current = false;
    setCurrentGain(null);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  // Get reason text
  const getReasonText = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      prayer_completed: t("xp.prayerCompleted"),
      all_prayers_completed: t("xp.allPrayersCompleted"),
      fajr_bonus: t("xp.fajrBonus"),
      streak_bonus: t("xp.streakBonus"),
    };

    // Check if it's a quest reward
    if (reason.startsWith("quest_")) {
      return t("xp.questCompleted");
    }

    return reasonMap[reason] || t("xp.prayerCompleted");
  };

  if (!currentGain) return null;

  return (
    <Animated.View
      style={[styles.container, { top: TOP_OFFSET }, animatedStyle]}
      pointerEvents="none"
    >
      <View style={styles.toast}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialIconsRound name="star" size={24} color="#FBBF24" />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.xpText}>+{currentGain.amount} XP</Text>
          <Text style={styles.reasonText}>
            {getReasonText(currentGain.reason)}
          </Text>
        </View>

        {/* Sparkle effect */}
        <View style={styles.sparkle}>
          <MaterialIconsRound name="auto-awesome" size={16} color="#FDE68A" />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#78350F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  xpText: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "#FBBF24",
  },
  reasonText: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: "#9CA3AF",
    marginTop: 2,
  },
  sparkle: {
    marginLeft: 8,
  },
});
