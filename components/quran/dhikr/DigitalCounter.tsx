import { useEffect } from "react";
import { View, Text, Pressable, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  useAnimatedStyle,
  useAnimatedProps,
  interpolate,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import Svg, { Circle, G } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useDhikrStore from "@/stores/useDhikrStore";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";

const { width } = Dimensions.get("window");

// Dimensions calculées une seule fois
const RING_SIZE = Math.min(width * 0.76, 290);
const RING_STROKE = 10;
const RING_RADIUS = RING_SIZE / 2 - RING_STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const INNER_SIZE = RING_SIZE - RING_STROKE * 2 - 28;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function DigitalCounter() {
  const { count, target, increment } = useDhikrStore();
  const isDark = useIsDark();
  const appTheme = useAppTheme();

  const scale = useSharedValue(1);
  // Initialisées à -1 → opacité = 0 avant le premier appui
  const ripple1 = useSharedValue(-1);
  const ripple2 = useSharedValue(-1);
  const ringProgress = useSharedValue(0);
  const idlePulse = useSharedValue(1);

  // Progression de l'anneau
  useEffect(() => {
    const prog = target === 0 ? 0 : Math.min(count / target, 1);
    ringProgress.value = withTiming(prog, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
  }, [count, target]);

  // Pulsation idle douce pour inviter à appuyer
  useEffect(() => {
    idlePulse.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(idlePulse);
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    increment();

    // Rebond au toucher (remplace la pulsation brièvement)
    cancelAnimation(idlePulse);
    scale.value = withSequence(
      withTiming(0.93, { duration: 65, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 10, stiffness: 230, mass: 0.5 }),
    );

    // Deux ondes décalées, partant de 0 (pas de -1)
    cancelAnimation(ripple1);
    cancelAnimation(ripple2);
    ripple1.value = 0;
    ripple2.value = 0;
    ripple1.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
    ripple2.value = withDelay(
      170,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * idlePulse.value }],
  }));

  // Ripple 1 — invisible avant appui (value = -1 → opacity = 0)
  const ripple1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ripple1.value, [-1, 0, 0.15, 1], [0, 0.5, 0.25, 0]),
    transform: [
      { scale: interpolate(ripple1.value, [-1, 0, 1], [1, 1, 1.72]) },
    ],
  }));

  // Ripple 2 — même logique
  const ripple2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ripple2.value, [-1, 0, 0.15, 1], [0, 0.38, 0.18, 0]),
    transform: [{ scale: interpolate(ripple2.value, [-1, 0, 1], [1, 1, 2.1]) }],
  }));

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - ringProgress.value),
  }));

  const hasProgress = target > 0 && count > 0;
  const CENTER = RING_SIZE / 2;

  return (
    <View style={styles.container}>
      {/*
       * Tout est dans ce conteneur RING_SIZE × RING_SIZE :
       * ripples + anneau + bouton partagent le même espace centré.
       */}
      <View style={{ width: RING_SIZE, height: RING_SIZE }}>
        {/* Ripple 1 — position absolute dans le conteneur */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.rippleRing,
            { borderRadius: RING_SIZE / 2 },
            ripple1Style,
          ]}
          pointerEvents="none"
        />
        {/* Ripple 2 */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.rippleRing,
            { borderRadius: RING_SIZE / 2 },
            ripple2Style,
          ]}
          pointerEvents="none"
        />

        {/* Bouton + anneau SVG */}
        <Animated.View
          style={[{ width: RING_SIZE, height: RING_SIZE }, buttonStyle]}
        >
          <Pressable onPress={handlePress} style={styles.pressable}>
            {/* Anneau SVG — viewBox explicite pour éviter les distorsions */}
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              style={StyleSheet.absoluteFill}
            >
              {/* Piste de fond */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RING_RADIUS}
                stroke={isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              {/*
               * Arc de progression.
               * G avec rotate pour démarrer l'arc en haut (−90°).
               * L'AnimatedCircle n'a que strokeDashoffset en animatedProps.
               */}
              {hasProgress && (
                <G rotation={-90} origin={`${CENTER}, ${CENTER}`}>
                  <AnimatedCircle
                    cx={CENTER}
                    cy={CENTER}
                    r={RING_RADIUS}
                    stroke="#F97316"
                    strokeWidth={RING_STROKE}
                    fill="none"
                    strokeDasharray={CIRCUMFERENCE}
                    animatedProps={ringProps}
                    strokeLinecap="round"
                  />
                </G>
              )}
            </Svg>

            {/* Face du bouton — centrée via le flex du Pressable */}
            <View
              style={[
                styles.innerShadow,
                {
                  width: INNER_SIZE,
                  height: INNER_SIZE,
                  borderRadius: INNER_SIZE / 2,
                },
              ]}
            >
              <View
                style={{
                  width: INNER_SIZE,
                  height: INNER_SIZE,
                  borderRadius: INNER_SIZE / 2,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={[appTheme.headerGradient[0], appTheme.primary, appTheme.headerGradient[1]]}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={[
                      styles.countText,
                      {
                        fontSize: INNER_SIZE * 0.34,
                        lineHeight: INNER_SIZE * 0.4,
                      },
                    ]}
                  >
                    {count}
                  </Text>
                  <Text style={styles.targetText}>
                    /{target === 0 ? "∞" : target}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      <Text
        style={[
          styles.hintText,
          { color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" },
        ]}
      >
        Appuyez pour compter
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rippleRing: {
    borderWidth: 2,
    borderColor: "#F97316",
    backgroundColor: "transparent",
  },
  pressable: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  // Wrapper ombre séparé du overflow:hidden (requis sur Android)
  innerShadow: {
    shadowColor: "#092e2c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  countText: {
    fontFamily: "Outfit_700Bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  targetText: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  hintText: {
    marginTop: 28,
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    letterSpacing: 0.4,
  },
});
