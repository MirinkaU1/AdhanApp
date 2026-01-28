import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
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
import useThemeStore from "@/stores/useThemeStore";
import useQibla, {
  getCardinalDirection,
  AccuracyLevel,
} from "@/hooks/useQibla";

export default function QiblaScreen() {
  const { t } = useTranslation();
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();
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

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const colors = {
    bg: isDark ? "#0F172A" : "#F6F8F8",
    bgGradientStart: isDark ? "#115E59" : "#115E59",
    bgGradientEnd: isDark ? "#0d4542" : "#0d4542",
    card: isDark ? "#1E293B" : "#FFFFFF",
    textPrimary: isDark ? "#F8FAFC" : "#12201F",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    gold: "#D4AF37",
    teal: "#115E59",
    tealLight: isDark ? "#5EEAD4" : "#115E59",
    compassBg: isDark ? "#1a2c2b" : "#FFFFFF",
    compassInner: isDark ? "#152322" : "#F8FAFC",
    needleTeal: "#115E59",
    needleGray: isDark ? "#475569" : "#CBD5E1",
    warning: "#F59E0B",
    warningBg: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.1)",
    success: "#10B981",
    successBg: isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)",
  };

  // Animation de rotation de la boussole
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (qiblaBearing !== null) {
      // L'aiguille pointe vers la Qibla, donc on doit tourner la boussole
      // dans le sens inverse du heading pour que la Qibla reste fixe
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

  // Formater l'angle avec la direction cardinale
  const formatBearing = (bearing: number | null): string => {
    if (bearing === null) return "---";
    const rounded = Math.round(bearing);
    const cardinal = getCardinalDirection(rounded);
    return `${rounded}° ${cardinal}`;
  };

  // Formater la distance
  const formatDistance = (distance: number | null): string => {
    if (distance === null) return "---";
    return distance.toLocaleString("fr-FR");
  };

  // État de chargement
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.teal} />
        <Text
          style={{
            marginTop: 16,
            fontFamily: "Outfit_500Medium",
            fontSize: 16,
            color: colors.textSecondary,
          }}
        >
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  // Permission refusée
  if (hasPermission === false) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${colors.teal}20`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <MaterialIconsRound
            name="location-off"
            size={40}
            color={colors.teal}
          />
        </View>
        <Text
          style={{
            fontFamily: "Outfit_700Bold",
            fontSize: 22,
            color: colors.textPrimary,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {t("qibla.permissionDenied")}
        </Text>
        <Text
          style={{
            fontFamily: "Outfit_400Regular",
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          {t("qibla.permissionDeniedDesc")}
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            backgroundColor: colors.teal,
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Outfit_600SemiBold",
              fontSize: 16,
              color: "#FFFFFF",
            }}
          >
            {t("qibla.grantPermission")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd, colors.bg]}
        locations={[0, 0.35, 0.65]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60%",
        }}
      />

      {/* Cercles de décoration */}
      <View
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          marginLeft: -180,
          marginTop: -180,
          width: 360,
          height: 360,
          borderRadius: 180,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(17,94,89,0.1)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          marginLeft: -220,
          marginTop: -220,
          width: 440,
          height: 440,
          borderRadius: 220,
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(17,94,89,0.05)",
        }}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isDark
              ? "rgba(0,0,0,0.2)"
              : "rgba(255,255,255,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIconsRound
            name="arrow-back-ios-new"
            size={20}
            color={isDark ? "#FFFFFF" : colors.teal}
          />
        </Pressable> */}

        <Text
          style={{
            fontFamily: "Outfit_700Bold",
            fontSize: 18,
            color: isDark ? "rgba(255,255,255,0.9)" : colors.teal,
          }}
        >
          {t("qibla.title")}
        </Text>

        {/* <Pressable
          onPress={() => router.push("/settings")}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isDark
              ? "rgba(0,0,0,0.2)"
              : "rgba(255,255,255,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIconsRound
            name="settings"
            size={22}
            color={isDark ? "#FFFFFF" : colors.teal}
          />
        </Pressable> */}
      </View>

      {/* Contenu principal */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* Boussole */}
        <View style={{ marginBottom: 10, marginTop: 50 }}>
          <View
            style={{
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: colors.compassBg,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 6,
              borderColor: colors.gold,
              shadowColor: colors.teal,
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 50,
              elevation: 20,
            }}
          >
            {/* Gradient intérieur */}
            <View
              style={{
                position: "absolute",
                width: 260,
                height: 260,
                borderRadius: 130,
                backgroundColor: colors.compassInner,
                opacity: 0.5,
              }}
            />

            {/* Points cardinaux */}
            <View
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* N */}
              <Text
                style={{
                  position: "absolute",
                  top: 28,
                  fontFamily: "Outfit_700Bold",
                  fontSize: 18,
                  color: colors.tealLight,
                }}
              >
                {t("qibla.north")}
              </Text>
              {/* S */}
              <Text
                style={{
                  position: "absolute",
                  bottom: 28,
                  fontFamily: "Outfit_600SemiBold",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                {t("qibla.south")}
              </Text>
              {/* E */}
              <Text
                style={{
                  position: "absolute",
                  right: 28,
                  fontFamily: "Outfit_600SemiBold",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                {t("qibla.east")}
              </Text>
              {/* W */}
              <Text
                style={{
                  position: "absolute",
                  left: 28,
                  fontFamily: "Outfit_600SemiBold",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                {t("qibla.west")}
              </Text>

              {/* Cercles internes */}
              <View
                style={{
                  position: "absolute",
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  borderWidth: 0.3,
                  borderColor: colors.border,
                }}
              />
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
                  borderBottomColor: colors.needleTeal,
                }}
              />

              {/* Icône Kaaba au bout */}
              <View
                style={{
                  position: "absolute",
                  top: -10,
                }}
              >
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
                    stroke={colors.gold}
                    strokeWidth={2}
                  />
                </Svg>
              </View>

              {/* Aiguille Sud - Grise */}
              <View
                style={{
                  position: "absolute",
                  bottom: 10,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 10,
                  borderRightWidth: 10,
                  borderTopWidth: 80,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: colors.needleGray,
                  opacity: 0.8,
                }}
              />
            </Animated.View>

            {/* Centre doré */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.gold,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: colors.compassBg,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(255,255,255,0.5)",
                }}
              />
            </View>
          </View>
        </View>

        {/* Affichage de l'angle */}
        <Text
          style={{
            fontFamily: "Outfit_700Bold",
            fontSize: 48,
            color: colors.tealLight,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          {formatBearing(qiblaBearing)}
        </Text>

        {/* Distance à La Mecque */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 36,
          }}
        >
          <MaterialIconsRound
            name="location-on"
            size={18}
            color={colors.gold}
          />
          <Text
            style={{
              fontFamily: "Outfit_500Medium",
              fontSize: 16,
              color: colors.textSecondary,
            }}
          >
            {t("qibla.distanceToMecca", {
              distance: formatDistance(distanceToMecca),
            })}
          </Text>
        </View>

        {/* Message d'alignement ou instruction */}
        <View
          style={{
            backgroundColor: isAligned
              ? colors.successBg
              : isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(255,255,255,0.8)",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 50,
            flexDirection: "row",
            marginBottom: 16,
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: isAligned
              ? isDark
                ? "rgba(16,185,129,0.3)"
                : "rgba(16,185,129,0.2)"
              : colors.border,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isAligned
                ? "rgba(16,185,129,0.2)"
                : `${colors.teal}15`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound
              name={isAligned ? "check" : "screen-rotation"}
              size={18}
              color={isAligned ? colors.success : colors.tealLight}
            />
          </View>
          <Text
            style={{
              fontFamily: "Outfit_600SemiBold",
              fontSize: 14,
              color: isAligned ? colors.success : colors.textSecondary,
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
          style={{
            marginHorizontal: 24,
            marginBottom: 16,
            backgroundColor: colors.warningBg,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(245,158,11,0.3)"
              : "rgba(245,158,11,0.2)",
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(245,158,11,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound
              name="warning"
              size={20}
              color={colors.warning}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Outfit_600SemiBold",
                fontSize: 13,
                color: colors.warning,
                marginBottom: 2,
              }}
            >
              {t("qibla.lowAccuracy")}
            </Text>
            <Text
              style={{
                fontFamily: "Outfit_400Regular",
                fontSize: 12,
                color: colors.textSecondary,
                lineHeight: 16,
              }}
            >
              {t("qibla.calibrateHint")}
            </Text>
          </View>
          <MaterialIconsRound
            name="touch-app"
            size={20}
            color={colors.warning}
          />
        </Pressable>
      )}

      {/* Avertissement en bas */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 40,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Outfit_400Regular",
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: "center",
            opacity: 0.7,
          }}
        >
          {t("qibla.metalWarning")}
        </Text>
      </View>
    </View>
  );
}
