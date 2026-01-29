import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, { Line, Rect } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";
import useQibla, { getCardinalDirection } from "@/hooks/useQibla";
import useResponsive from "@/hooks/useResponsive";
import { AppText } from "@/components/ui";

export default function QiblaScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const wasAlignedRef = useRef(false);
  const { rs3, fontSize, iconSize } = useResponsive();

  // Tailles spécifiques à la boussole
  const compassSize = rs3(240, 280, 320);
  const compassBorder = rs3(4, 6, 8);
  const compassInner = compassSize - 20;
  const needleContainer = rs3(170, 200, 230);
  const needleWidth = rs3(8, 10, 12);
  const needleHeight = rs3(65, 80, 95);
  const cardinalOffset = rs3(20, 28, 32);
  const innerCircle1 = rs3(170, 200, 230);
  const innerCircle2 = rs3(120, 140, 160);
  const outerCircle1 = rs3(290, 340, 390);
  const outerCircle2 = rs3(340, 400, 460);
  const centerDot = rs3(24, 32, 36);
  const kaabaSize = rs3(20, 24, 28);
  const statusBadge = rs3(28, 32, 36);

  const {
    qiblaBearing,
    deviceHeading,
    distanceToMecca,
    loading,
    isAligned,
    hasPermission,
    accuracyLevel,
    requestPermission,
    calibrate,
  } = useQibla();

  // Animation de rotation de la boussole
  // L'aiguille doit pointer vers la Qibla relativement à l'orientation du téléphone
  const rotation = useSharedValue(0);
  const prevRotation = useRef(0);

  useEffect(() => {
    if (qiblaBearing !== null) {
      // Calculer la différence et normaliser entre -180 et 180
      let targetDiff = qiblaBearing - deviceHeading;

      // Normaliser pour prendre le chemin le plus court
      if (targetDiff > 180) targetDiff -= 360;
      if (targetDiff < -180) targetDiff += 360;

      // Calculer le delta depuis la position actuelle pour éviter les sauts
      let delta = targetDiff - prevRotation.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      const newRotation = prevRotation.current + delta;
      prevRotation.current = newRotation;

      // Animation rapide et fluide
      rotation.value = withTiming(newRotation, {
        duration: 100,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [deviceHeading, qiblaBearing]);

  // Haptic feedback quand aligné
  useEffect(() => {
    if (isAligned && !wasAlignedRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned]);

  const animatedNeedleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const formatBearing = (bearing: number | null): string => {
    if (bearing === null) return "---";
    const rounded = Math.round(bearing);
    const cardinal = getCardinalDirection(rounded);
    return `${rounded}° ${cardinal}`;
  };

  const formatDistance = (distance: number | null): string => {
    if (distance === null) return "---";
    return distance.toLocaleString("fr-FR");
  };

  // État de chargement
  if (loading) {
    return (
      <View className="flex-1 bg-bg-light dark:bg-bg-dark items-center justify-center">
        <ActivityIndicator size="large" color="#115E59" />
        <Text className="mt-4 font-outfit-medium text-base text-text-secondary-light dark:text-text-secondary-dark">
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  // Permission refusée
  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-bg-light dark:bg-bg-dark items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-6">
          <MaterialIconsRound name="location-off" size={40} color="#115E59" />
        </View>
        <AppText variant="h2" className="text-center mb-3">
          {t("qibla.permissionDenied")}
        </AppText>
        <AppText variant="caption" className="text-center mb-8 leading-6">
          {t("qibla.permissionDeniedDesc")}
        </AppText>
        <Pressable
          onPress={requestPermission}
          className="bg-primary px-8 py-3.5 rounded-2xl"
        >
          <Text className="font-outfit-semibold text-base text-white">
            {t("qibla.grantPermission")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Background gradient */}
      <LinearGradient
        colors={["#115E59", "#0d4542", isDark ? "#0F172A" : "#F6F8F8"]}
        locations={[0, 0.35, 0.65]}
        className="absolute top-0 left-0 right-0"
        style={{ height: "60%" }}
      />

      {/* Header */}
      <View className="pt-14 px-4 flex-row items-center justify-between">
        <Text
          className="font-outfit-bold text-white dark:text-white/90"
          style={{ fontSize: fontSize.xl }}
        >
          {t("qibla.title")}
        </Text>
      </View>

      {/* Contenu principal */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Boussole */}
        <View className="mb-2.5 mt-6 items-center justify-center">
          {/* Cercles de décoration autour de la boussole */}
          <View
            className="absolute rounded-full"
            style={{
              width: outerCircle1,
              height: outerCircle1,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(17,94,89,0.12)",
            }}
          />
          <View
            className="absolute rounded-full"
            style={{
              width: outerCircle2,
              height: outerCircle2,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(17,94,89,0.06)",
            }}
          />

          <View
            className="rounded-full items-center justify-center"
            style={{
              width: compassSize,
              height: compassSize,
              backgroundColor: isDark ? "#1a2c2b" : "#FFFFFF",
              borderWidth: compassBorder,
              borderColor: "#D4AF37",
              shadowColor: "#115E59",
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 50,
              elevation: 20,
            }}
          >
            {/* Gradient intérieur */}
            <View
              className="absolute rounded-full opacity-50"
              style={{
                width: compassInner,
                height: compassInner,
                backgroundColor: isDark ? "#152322" : "#F8FAFC",
              }}
            />

            {/* Points cardinaux */}
            <View className="absolute w-full h-full items-center justify-center">
              {/* N */}
              <Text
                className="absolute font-outfit-bold text-primary dark:text-teal-200"
                style={{ top: cardinalOffset, fontSize: fontSize.lg }}
              >
                {t("qibla.north")}
              </Text>
              {/* S */}
              <Text
                className="absolute font-outfit-semibold text-text-secondary-light dark:text-text-secondary-dark"
                style={{ bottom: cardinalOffset, fontSize: fontSize.sm }}
              >
                {t("qibla.south")}
              </Text>
              {/* E */}
              <Text
                className="absolute font-outfit-semibold text-text-secondary-light dark:text-text-secondary-dark"
                style={{ right: cardinalOffset, fontSize: fontSize.sm }}
              >
                {t("qibla.east")}
              </Text>
              {/* W */}
              <Text
                className="absolute font-outfit-semibold text-text-secondary-light dark:text-text-secondary-dark"
                style={{ left: cardinalOffset, fontSize: fontSize.sm }}
              >
                {t("qibla.west")}
              </Text>

              {/* Cercles internes */}
              <View
                className="absolute rounded-full border-dashed border-border-light dark:border-border-dark"
                style={{
                  width: innerCircle1,
                  height: innerCircle1,
                  borderWidth: 0.5,
                }}
              />
              <View
                className="absolute rounded-full border-border-light dark:border-border-dark"
                style={{
                  width: innerCircle2,
                  height: innerCircle2,
                  borderWidth: 0.3,
                }}
              />
            </View>

            {/* Aiguille animée */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  width: needleContainer,
                  height: needleContainer,
                  alignItems: "center",
                  justifyContent: "center",
                },
                animatedNeedleStyle,
              ]}
            >
              {/* Aiguille Nord (vers Qibla) - Teal */}
              <View
                style={{
                  position: "absolute",
                  top: 10,
                  width: 0,
                  height: 0,
                  borderLeftWidth: needleWidth,
                  borderRightWidth: needleWidth,
                  borderBottomWidth: needleHeight,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: "#115E59",
                }}
              />

              {/* Icône Kaaba */}
              <View className="absolute" style={{ top: -kaabaSize / 4 }}>
                <Svg width={kaabaSize} height={kaabaSize} viewBox="0 0 24 24">
                  <Rect
                    x={4}
                    y={6}
                    width={16}
                    height={14}
                    rx={2}
                    fill={isDark ? "#000" : "#1F2937"}
                  />
                  <Line
                    x1={4}
                    y1={11}
                    x2={20}
                    y2={11}
                    stroke="#D4AF37"
                    strokeWidth={2}
                  />
                </Svg>
              </View>

              {/* Aiguille Sud - Grise */}
              <View
                className="absolute opacity-80"
                style={{
                  bottom: 10,
                  width: 0,
                  height: 0,
                  borderLeftWidth: needleWidth,
                  borderRightWidth: needleWidth,
                  borderTopWidth: needleHeight,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: isDark ? "#475569" : "#CBD5E1",
                }}
              />
            </Animated.View>

            {/* Centre doré */}
            <View
              className="rounded-full bg-[#D4AF37] items-center justify-center"
              style={{
                width: centerDot,
                height: centerDot,
                borderWidth: centerDot / 10,
                borderColor: isDark ? "#1a2c2b" : "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <View
                className="rounded-full bg-white/50"
                style={{ width: centerDot / 4, height: centerDot / 4 }}
              />
            </View>
          </View>
        </View>

        {/* Affichage de l'angle */}
        <Text
          className="font-outfit-bold text-primary dark:text-teal-200 tracking-widest mb-2"
          style={{ fontSize: fontSize["4xl"] }}
        >
          {formatBearing(qiblaBearing)}
        </Text>

        {/* Distance à La Mecque */}
        <View className="flex-row items-center gap-1.5 mb-9">
          <MaterialIconsRound
            name="location-on"
            size={iconSize.sm}
            color="#D4AF37"
          />
          <Text
            className="font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark"
            style={{ fontSize: fontSize.base }}
          >
            {t("qibla.distanceToMecca", {
              distance: formatDistance(distanceToMecca),
            })}
          </Text>
        </View>

        {/* Message d'alignement */}
        <View
          className="px-5 py-3 rounded-full flex-row items-center gap-3 mb-4"
          style={{
            backgroundColor: isAligned
              ? isDark
                ? "rgba(16,185,129,0.15)"
                : "rgba(16,185,129,0.1)"
              : isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(255,255,255,0.8)",
            borderWidth: 1,
            borderColor: isAligned
              ? isDark
                ? "rgba(16,185,129,0.3)"
                : "rgba(16,185,129,0.2)"
              : isDark
                ? "#334155"
                : "#E2E8F0",
          }}
        >
          <View
            className="rounded-full items-center justify-center"
            style={{
              width: statusBadge,
              height: statusBadge,
              backgroundColor: isAligned
                ? "rgba(16,185,129,0.2)"
                : isDark
                  ? "rgba(17,94,89,0.15)"
                  : "rgba(17,94,89,0.15)",
            }}
          >
            <MaterialIconsRound
              name={isAligned ? "check" : "screen-rotation"}
              size={iconSize.xs}
              color={isAligned ? "#10B981" : isDark ? "#5EEAD4" : "#115E59"}
            />
          </View>
          <Text
            className="font-outfit-semibold"
            style={{
              fontSize: fontSize.sm,
              color: isAligned ? "#10B981" : isDark ? "#94A3B8" : "#64748B",
            }}
          >
            {isAligned ? t("qibla.aligned") : t("qibla.alignPhone")}
          </Text>
        </View>
      </View>

      {/* Avertissement de précision faible */}
      {accuracyLevel === "low" && (
        <Pressable
          onPress={calibrate}
          className="mx-6 mb-4 bg-warning/10 dark:bg-warning/15 px-4 py-3 rounded-2xl flex-row items-center gap-3 border border-warning/20 dark:border-warning/30"
        >
          <View
            className="rounded-full bg-warning/20 items-center justify-center"
            style={{ width: statusBadge + 4, height: statusBadge + 4 }}
          >
            <MaterialIconsRound
              name="warning"
              size={iconSize.sm}
              color="#F59E0B"
            />
          </View>
          <View className="flex-1">
            <Text
              className="font-outfit-semibold text-warning mb-0.5"
              style={{ fontSize: fontSize.sm }}
            >
              {t("qibla.lowAccuracy")}
            </Text>
            <Text
              className="font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark leading-4"
              style={{ fontSize: fontSize.xs }}
            >
              {t("qibla.calibrateHint")}
            </Text>
          </View>
          <MaterialIconsRound
            name="touch-app"
            size={iconSize.sm}
            color="#F59E0B"
          />
        </Pressable>
      )}

      {/* Avertissement en bas */}
      <View className="px-6 pb-10 items-center">
        <Text
          className="font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark text-center opacity-70"
          style={{ fontSize: fontSize.xs }}
        >
          {t("qibla.metalWarning")}
        </Text>
      </View>
    </View>
  );
}
