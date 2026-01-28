import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, { Line, Rect } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";
import useQibla, { getCardinalDirection } from "@/hooks/useQibla";
import { AppText } from "@/components/ui";

export default function QiblaScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const wasAlignedRef = useRef(false);

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
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (qiblaBearing !== null) {
      const targetRotation = qiblaBearing - deviceHeading;
      rotation.value = withSpring(targetRotation, {
        damping: 20,
        stiffness: 90,
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
        <Text className="font-outfit-bold text-lg text-primary dark:text-white/90">
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
              width: 340,
              height: 340,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(17,94,89,0.12)",
            }}
          />
          <View
            className="absolute rounded-full"
            style={{
              width: 400,
              height: 400,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(17,94,89,0.06)",
            }}
          />

          <View
            className="w-[280px] h-[280px] rounded-full items-center justify-center"
            style={{
              backgroundColor: isDark ? "#1a2c2b" : "#FFFFFF",
              borderWidth: 6,
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
              className="absolute w-[260px] h-[260px] rounded-full opacity-50"
              style={{ backgroundColor: isDark ? "#152322" : "#F8FAFC" }}
            />

            {/* Points cardinaux */}
            <View className="absolute w-full h-full items-center justify-center">
              {/* N */}
              <Text className="absolute top-7 font-outfit-bold text-lg text-primary dark:text-teal-200">
                {t("qibla.north")}
              </Text>
              {/* S */}
              <Text className="absolute bottom-7 font-outfit-semibold text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {t("qibla.south")}
              </Text>
              {/* E */}
              <Text className="absolute right-7 font-outfit-semibold text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {t("qibla.east")}
              </Text>
              {/* W */}
              <Text className="absolute left-7 font-outfit-semibold text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {t("qibla.west")}
              </Text>

              {/* Cercles internes */}
              <View className="absolute w-[200px] h-[200px] rounded-full border-0.5 border-dashed border-border-light dark:border-border-dark" />
              <View className="absolute w-[140px] h-[140px] rounded-full border-[0.3px] border-border-light dark:border-border-dark" />
            </View>

            {/* Aiguille animée */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  width: 200,
                  height: 200,
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
                  borderLeftWidth: 10,
                  borderRightWidth: 10,
                  borderBottomWidth: 80,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: "#115E59",
                }}
              />

              {/* Icône Kaaba */}
              <View className="absolute -top-2.5">
                <Svg width={24} height={24} viewBox="0 0 24 24">
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
                className="absolute bottom-2.5 opacity-80"
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 10,
                  borderRightWidth: 10,
                  borderTopWidth: 80,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: isDark ? "#475569" : "#CBD5E1",
                }}
              />
            </Animated.View>

            {/* Centre doré */}
            <View
              className="w-8 h-8 rounded-full bg-[#D4AF37] items-center justify-center"
              style={{
                borderWidth: 3,
                borderColor: isDark ? "#1a2c2b" : "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <View className="w-2 h-2 rounded-full bg-white/50" />
            </View>
          </View>
        </View>

        {/* Affichage de l'angle */}
        <Text className="font-outfit-bold text-5xl text-primary dark:text-teal-200 tracking-widest mb-2">
          {formatBearing(qiblaBearing)}
        </Text>

        {/* Distance à La Mecque */}
        <View className="flex-row items-center gap-1.5 mb-9">
          <MaterialIconsRound name="location-on" size={18} color="#D4AF37" />
          <Text className="font-outfit-medium text-base text-text-secondary-light dark:text-text-secondary-dark">
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
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{
              backgroundColor: isAligned
                ? "rgba(16,185,129,0.2)"
                : isDark
                  ? "rgba(17,94,89,0.15)"
                  : "rgba(17,94,89,0.15)",
            }}
          >
            <MaterialIconsRound
              name={isAligned ? "check" : "screen-rotation"}
              size={18}
              color={isAligned ? "#10B981" : isDark ? "#5EEAD4" : "#115E59"}
            />
          </View>
          <Text
            className="font-outfit-semibold text-sm"
            style={{
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
          <View className="w-9 h-9 rounded-full bg-warning/20 items-center justify-center">
            <MaterialIconsRound name="warning" size={20} color="#F59E0B" />
          </View>
          <View className="flex-1">
            <Text className="font-outfit-semibold text-sm text-warning mb-0.5">
              {t("qibla.lowAccuracy")}
            </Text>
            <Text className="font-outfit-regular text-xs text-text-secondary-light dark:text-text-secondary-dark leading-4">
              {t("qibla.calibrateHint")}
            </Text>
          </View>
          <MaterialIconsRound name="touch-app" size={20} color="#F59E0B" />
        </Pressable>
      )}

      {/* Avertissement en bas */}
      <View className="px-6 pb-10 items-center">
        <Text className="font-outfit-regular text-xs text-text-secondary-light dark:text-text-secondary-dark text-center opacity-70">
          {t("qibla.metalWarning")}
        </Text>
      </View>
    </View>
  );
}
