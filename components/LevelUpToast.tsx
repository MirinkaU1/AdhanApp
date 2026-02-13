/**
 * LevelUpToast - Composant de notification de passage de niveau
 *
 * Affiche un toast célébrant le passage de niveau
 */

import { useEffect, useRef, useState } from "react";
import { Text, View, StyleSheet, Platform, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useQuestStore, { LevelUpNotification } from "@/stores/useQuestStore";
import { useTranslation } from "react-i18next";

const TOAST_DURATION = 2500;
const ANIMATION_DURATION = 300;
const TOP_OFFSET = Platform.OS === "ios" ? 50 : 40;

export default function LevelUpToast() {
  const { t } = useTranslation();
  const [currentLevelUp, setCurrentLevelUp] =
    useState<LevelUpNotification | null>(null);
  const pendingLevelUp = useQuestStore((s) => s.pendingLevelUp);
  const consumePendingLevelUp = useQuestStore((s) => s.consumePendingLevelUp);

  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const starRotation = useSharedValue(0);
  const starScale = useSharedValue(0);

  const isAnimating = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Process pending level up
  useEffect(() => {
    if (pendingLevelUp && !isAnimating.current && !currentLevelUp) {
      const levelUp = consumePendingLevelUp();
      if (levelUp) {
        showToast(levelUp);
      }
    }
  }, [pendingLevelUp, currentLevelUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showToast = (levelUp: LevelUpNotification) => {
    isAnimating.current = true;
    setCurrentLevelUp(levelUp);

    // Reset values
    translateY.value = -100;
    opacity.value = 0;
    scale.value = 0.8;
    starRotation.value = 0;
    starScale.value = 0;

    // Animate in (same feel as XP toast)
    translateY.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    opacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    scale.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });

    // Star animation
    starScale.value = withDelay(
      150,
      withSequence(
        withTiming(1.2, { duration: 180 }),
        withTiming(1, { duration: 120 }),
      ),
    );
    starRotation.value = withDelay(
      150,
      withSequence(
        withTiming(15, { duration: 100 }),
        withTiming(-15, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      ),
    );

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
    setCurrentLevelUp(null);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${starRotation.value}deg` },
      { scale: starScale.value },
    ],
  }));

  if (!currentLevelUp) return null;

  return (
    <Animated.View
      style={[styles.container, containerStyle]}
      pointerEvents="box-none"
    >
      <Pressable onPress={hideToast}>
        <View style={styles.toast}>
          {/* Icon */}
          <Animated.View style={[styles.iconContainer, starStyle]}>
            <MaterialIconsRound name="emoji-events" size={24} color="#FBBF24" />
          </Animated.View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.congratsText}>{t("levelUp.congrats")}</Text>
            <Text style={styles.levelName}>{currentLevelUp.levelName}</Text>
          </View>

          {/* Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{t("levelUp.newLevel")}</Text>
            <Text style={styles.levelNumber}>{currentLevelUp.newLevel}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: TOP_OFFSET,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    backgroundColor: "#7C3AED",
    shadowColor: "#5B21B6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(251,191,36,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  congratsText: {
    fontSize: 11,
    fontFamily: "Outfit_500Medium",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  levelBadge: {
    backgroundColor: "rgba(251,191,36,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  levelText: {
    fontSize: 10,
    fontFamily: "Outfit_600SemiBold",
    color: "#FDE68A",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  levelNumber: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "#FBBF24",
    marginTop: 2,
  },
  levelName: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#E9D5FF",
    marginTop: 2,
  },
});
