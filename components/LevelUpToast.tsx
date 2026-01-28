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
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useQuestStore, { LevelUpNotification } from "@/stores/useQuestStore";
import { useTranslation } from "react-i18next";

const TOAST_DURATION = 4000;
const ANIMATION_DURATION = 400;

export default function LevelUpToast() {
  const { t } = useTranslation();
  const [currentLevelUp, setCurrentLevelUp] =
    useState<LevelUpNotification | null>(null);
  const pendingLevelUp = useQuestStore((s) => s.pendingLevelUp);
  const consumePendingLevelUp = useQuestStore((s) => s.consumePendingLevelUp);

  // Animation values
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
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
    translateY.value = -200;
    opacity.value = 0;
    scale.value = 0.5;
    starRotation.value = 0;
    starScale.value = 0;

    // Animate in with spring
    translateY.value = withSpring(0, {
      damping: 12,
      stiffness: 100,
    });
    opacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 150,
    });

    // Star animation
    starScale.value = withDelay(200, withSpring(1.2, { damping: 8 }));
    starRotation.value = withDelay(
      200,
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
    translateY.value = withTiming(-200, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    opacity.value = withTiming(0, { duration: ANIMATION_DURATION });
    scale.value = withTiming(0.5, { duration: ANIMATION_DURATION });

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
        <LinearGradient
          colors={["#7C3AED", "#5B21B6", "#4C1D95"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.toast}
        >
          {/* Decorative stars */}
          <View style={styles.decorLeft}>
            <MaterialIconsRound
              name="auto-awesome"
              size={16}
              color="rgba(255,255,255,0.3)"
            />
          </View>
          <View style={styles.decorRight}>
            <MaterialIconsRound
              name="auto-awesome"
              size={16}
              color="rgba(255,255,255,0.3)"
            />
          </View>

          {/* Main star icon */}
          <Animated.View style={[styles.iconContainer, starStyle]}>
            <MaterialIconsRound name="emoji-events" size={32} color="#FBBF24" />
          </Animated.View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.congratsText}>{t("levelUp.congrats")}</Text>
            <View style={styles.levelRow}>
              <Text style={styles.levelText}>{t("levelUp.newLevel")}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNumber}>
                  {currentLevelUp.newLevel}
                </Text>
              </View>
            </View>
            <Text style={styles.levelName}>{currentLevelUp.levelName}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  decorLeft: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  decorRight: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  congratsText: {
    fontSize: 12,
    fontFamily: "Outfit_500Medium",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  levelText: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "#FFFFFF",
  },
  levelBadge: {
    backgroundColor: "#FBBF24",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  levelNumber: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: "#1E1B4B",
  },
  levelName: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#C4B5FD",
    marginTop: 2,
  },
});
