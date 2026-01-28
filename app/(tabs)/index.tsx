import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { format, differenceInMinutes, isAfter, addHours } from "date-fns";
import useThemeStore from "@/stores/useThemeStore";
import useAuthStore from "@/stores/useAuthStore";
import usePrayerStore, { PrayerName } from "@/stores/usePrayerStore";
import { usePrayerLocation } from "@/hooks/usePrayerLocation";
import { useTranslation } from "react-i18next";

// Configuration des prières avec icônes Material (les labels seront traduits via i18n)
const PRAYER_ICONS: Record<string, MaterialIconName> = {
  fajr: "dark-mode",
  dhuhr: "wb-sunny",
  asr: "wb-cloudy",
  maghrib: "wb-twilight",
  isha: "nights-stay",
};

const PRAYER_KEYS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// Les hadiths restent en langue originale (arabe traduit) - pas de traduction i18n pour le contenu religieux
const HADITHS = [
  {
    text: "La prière est le pilier de la religion. Celui qui l'établit a établi la religion.",
    source: "Hadith",
  },
  {
    text: "Les actes ne valent que par les intentions.",
    source: "Bukhari & Muslim",
  },
  {
    text: "La religion, c'est le bon conseil.",
    source: "Muslim",
  },
  {
    text: "Le croyant est le miroir du croyant.",
    source: "Abu Dawud",
  },
  {
    text: "Facilitez et ne rendez pas les choses difficiles.",
    source: "Bukhari",
  },
  {
    text: "Allah aime, lorsqu'un de vous fait un travail, qu'il le fasse avec excellence.",
    source: "Bayhaqi",
  },
];

export default function DashboardScreen() {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  // Location et horaires de prière (système hybride)
  const {
    location,
    isLoadingLocation,
    isUsingDefaultLocation,
    locationError,
    refreshLocation,
  } = usePrayerLocation();

  const router = useRouter();

  // Utilisateur
  const { user } = useAuthStore();

  // Store de prière
  const { times, status, hijriDate, togglePrayer } = usePrayerStore();

  // Salutation basée sur l'heure
  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return t("home.goodMorning");
    if (hour >= 12 && hour < 18) return t("home.goodAfternoon");
    return t("home.goodEvening");
  }, [now, t]);

  // Construire le nom de la ville pour l'affichage
  const cityDisplay = useMemo(() => {
    if (isLoadingLocation) return t("home.locating");
    if (!location) return t("home.unknownLocation");
    const parts = [location.city, location.country].filter(Boolean);
    return parts.join(", ") || t("home.unknownLocation");
  }, [location, isLoadingLocation, t]);

  // Déterminer le thème effectif
  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Trouver la prochaine prière (fallback si times pas encore chargé)
  const { nextPrayer, nextPrayerTime } = useMemo(() => {
    if (!times) {
      return { nextPrayer: "fajr" as PrayerName, nextPrayerTime: null };
    }
    for (const key of PRAYER_KEYS) {
      if (isAfter(times[key], now)) {
        return { nextPrayer: key, nextPrayerTime: times[key] };
      }
    }
    return {
      nextPrayer: "fajr" as PrayerName,
      nextPrayerTime: times.fajr ? addHours(times.fajr, 24) : null,
    };
  }, [times, now]);

  // Compteur de prières accomplies
  const completedCount = useMemo(
    () => Object.values(status).filter(Boolean).length,
    [status],
  );
  const progressPercent = Math.round((completedCount / 5) * 100);
  const progressRadius = 20;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset = progressCircumference * (1 - progressPercent / 100);

  // Countdown en minutes
  const countdownMinutes = useMemo(() => {
    if (!nextPrayerTime || isAfter(now, nextPrayerTime)) return null;
    return differenceInMinutes(nextPrayerTime, now);
  }, [now, nextPrayerTime]);

  const nextPrayerMessage = useMemo(() => {
    if (countdownMinutes === null) return "";
    if (countdownMinutes <= 0) return t("home.now");
    if (countdownMinutes < 60)
      return t("home.inMinutes", { minutes: countdownMinutes });
    const hours = Math.floor(countdownMinutes / 60);
    const minutes = countdownMinutes % 60;
    if (minutes > 0) {
      return t("home.inHoursMinutes", { hours, minutes });
    }
    return t("home.inHours", { hours });
  }, [countdownMinutes, t]);

  // Format du countdown pour le badge header (heures si >= 60min, sinon minutes)
  const headerCountdown = useMemo(() => {
    if (countdownMinutes === null) return null;
    if (countdownMinutes >= 60) {
      const hours = Math.floor(countdownMinutes / 60);
      const mins = countdownMinutes % 60;
      if (mins > 0) {
        return { value: `${hours}h ${mins}`, unit: "min" };
      }
      return { value: hours.toString(), unit: "h" };
    }
    return { value: countdownMinutes.toString(), unit: t("home.minutes") };
  }, [countdownMinutes, t]);

  const dailyHadith = useMemo(() => {
    const seed =
      now.getFullYear() * 1000 +
      Math.floor(
        (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
          86400000,
      );
    const index = seed % HADITHS.length;
    return HADITHS[index];
  }, [now]);

  // Heure courante formatée
  const currentTime = format(now, "HH:mm");

  // Liste des prières avec leurs données
  const prayerList = useMemo(() => {
    if (!times) return [];
    return PRAYER_KEYS.map((key) => ({
      key,
      label: t(`home.${key}`),
      icon: PRAYER_ICONS[key],
      time: times[key],
      isPast: times[key] ? isAfter(now, times[key]) : false,
      isNext: nextPrayer === key,
      isCompleted: status[key],
    }));
  }, [times, now, nextPrayer, status, t]);

  // Couleurs selon le thème
  const colors = {
    bg: isDark ? "#0F172A" : "#F3F4F6",
    card: isDark ? "#1E293B" : "#FFFFFF",
    textPrimary: isDark ? "#F8FAFC" : "#1E293B",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    accent: "#D97706",
    accentBg: isDark ? "rgba(217,119,6,0.2)" : "#FEF3C7",
    tealDark: "#115E59",
    tealDeep: "#0d4542",
  };

  const headerHeight = 380;
  const isSmallScreen = screenHeight < 700 || screenWidth < 360;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
            overflow: "hidden",
            minHeight: headerHeight,
          }}
        >
          <LinearGradient
            colors={[colors.tealDark, colors.tealDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdQO7DmBVbuu03IH4BocFKDFkHmlUe2HE1SMJ8hEEP0N9z-aKcbbSzlGU3DVcXn-D1v-uxMZ2Q_WWZudOeijOi0hrg4Jk0GT83F2Mo31sUwByC3xc1deVXN2ubGgZVyVREHzB26yPLeEwviGWxhQcpIR25bjDWHkZbfz8f7Mbm_HNa368vc9k55RodXtXsFNZZm_u91vUH82knn_hPTGfdAi0dWm0qcPJBjs1uyWZUCGthXhCIpJKfERne5HKVvMzjBkZIEfHly_w",
            }}
            style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}
            resizeMode="cover"
          />

          {/* Icône notification en absolute */}
          <Pressable
            onPress={() => router.push("/settings/notifications")}
            style={{
              position: "absolute",
              top: 48,
              right: 24,
              zIndex: 10,
              padding: 8,
            }}
          >
            <MaterialIconsRound
              name="notifications-none"
              size={26}
              color="#fff"
            />
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 8,
                height: 8,
                backgroundColor: colors.accent,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: colors.tealDark,
              }}
            />
          </Pressable>

          {/* Contenu du header */}
          <View
            style={{ paddingHorizontal: 16, paddingTop: 48, paddingBottom: 24 }}
          >
            {/* Badge localisation - cliquable pour actualiser */}
            <Pressable
              onPress={refreshLocation}
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.10)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                marginBottom: 20,
              }}
            >
              {isLoadingLocation ? (
                <ActivityIndicator
                  size="small"
                  color={colors.accent}
                  style={{ marginRight: 6 }}
                />
              ) : (
                <MaterialIconsRound
                  name="location-on"
                  size={16}
                  color={colors.accent}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontFamily: "Outfit_500Medium",
                }}
              >
                {cityDisplay}
              </Text>
            </Pressable>

            {/* Date Hijri */}
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 11,
                fontFamily: "Outfit_400Regular",
                textAlign: "center",
                letterSpacing: 2,
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              {hijriDate || t("home.loadingHijri")}
            </Text>

            {/* Salutation avec prénom */}
            <Text
              style={{
                color: "#fff",
                fontSize: isSmallScreen ? 28 : 32,
                fontFamily: "Outfit_700Bold",
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              {greeting}, {user?.name || t("home.guest")} 👋
            </Text>

            {/* Niveau et XP */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  gap: 6,
                }}
              >
                <MaterialIconsRound
                  name="star"
                  size={16}
                  color={colors.accent}
                />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontFamily: "Outfit_600SemiBold",
                  }}
                >
                  {t("home.level")} {user?.level || 1}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  gap: 6,
                }}
              >
                <MaterialIconsRound name="bolt" size={16} color="#22C55E" />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontFamily: "Outfit_600SemiBold",
                  }}
                >
                  {user?.xp || 0} XP
                </Text>
              </View>
            </View>

            {/* Badge prochaine prière CENTRÉ */}
            {nextPrayer && headerCountdown && (
              <View
                style={{
                  alignSelf: "center",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginBottom: 20,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontFamily: "Outfit_500Medium",
                  }}
                >
                  {t(`home.${nextPrayer}`)} {t("home.inTime", { time: "" })}
                </Text>
                <Text
                  style={{
                    color: colors.accent,
                    fontSize: 14,
                    fontFamily: "Outfit_700Bold",
                  }}
                >
                  {headerCountdown.value} {headerCountdown.unit}
                </Text>
              </View>
            )}

            {/* Barre des 5 prières */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              {prayerList.map((prayer) => {
                const isHighlighted = prayer.isNext;
                return (
                  <View
                    key={prayer.key}
                    style={{
                      alignItems: "center",
                      opacity: isHighlighted ? 1 : 0.6,
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        marginBottom: 4,
                        color: isHighlighted ? colors.accent : "#fff",
                        fontWeight: isHighlighted ? "700" : "400",
                        fontFamily: "Outfit_500Medium",
                      }}
                    >
                      {prayer.label}
                    </Text>
                    <Text
                      style={{
                        fontWeight: "600",
                        color: "#fff",
                        fontSize: isHighlighted ? 20 : 13,
                        fontFamily: "Outfit_600SemiBold",
                      }}
                    >
                      {format(prayer.time, "HH:mm")}
                    </Text>
                    <MaterialIconsRound
                      name={prayer.icon}
                      size={isHighlighted ? 24 : 18}
                      color={
                        isHighlighted ? colors.accent : "rgba(255,255,255,0.7)"
                      }
                      style={{ marginTop: 4 }}
                    />
                    {isHighlighted && (
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          backgroundColor: colors.accent,
                          borderRadius: 2,
                          marginTop: 6,
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Contenu principal */}
        <View style={{ paddingTop: 24, paddingHorizontal: 16 }}>
          {/* Suivi du jour */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "Outfit_700Bold",
                  color: colors.textPrimary,
                }}
              >
                {t("home.dailyTracking")}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Outfit_400Regular",
                  color: colors.textSecondary,
                  marginTop: 4,
                }}
              >
                {t("home.prayersCompleted", { count: completedCount })}
              </Text>
            </View>
            <View
              style={{
                width: 52,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Svg width={52} height={52} style={{ position: "absolute" }}>
                <Circle
                  cx="26"
                  cy="26"
                  r={progressRadius}
                  stroke={colors.border}
                  strokeWidth={4}
                  fill="transparent"
                />
                <Circle
                  cx="26"
                  cy="26"
                  r={progressRadius}
                  stroke={colors.accent}
                  strokeWidth={4}
                  fill="transparent"
                  strokeDasharray={progressCircumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  rotation={-90}
                  origin="26,26"
                />
              </Svg>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Outfit_700Bold",
                  color: colors.textSecondary,
                }}
              >
                {progressPercent}%
              </Text>
            </View>
          </View>

          {/* Liste des prières */}
          <View style={{ gap: 12 }}>
            {prayerList.map((prayer) => {
              const isNext = prayer.isNext;
              const isCompleted = prayer.isCompleted;
              const isPast = prayer.isPast && !isCompleted;

              return (
                <TouchableOpacity
                  key={prayer.key}
                  onPress={() => togglePrayer(prayer.key)}
                  {...(Platform.OS === "web"
                    ? { onClick: () => togglePrayer(prayer.key) }
                    : {})}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    borderRadius: 20,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderLeftWidth: isNext ? 4 : 1,
                    borderLeftColor: isNext ? colors.accent : colors.border,
                    shadowColor: isNext ? colors.accent : "#000",
                    shadowOpacity: isNext ? 0.15 : 0.05,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: isNext ? 12 : 6,
                    elevation: isNext ? 6 : 2,
                    opacity: isPast && !isNext ? 0.85 : 1,
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  accessibilityRole="button"
                >
                  {isNext && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        opacity: 0.07,
                      }}
                    >
                      <MaterialIconsRound
                        name="mosque"
                        size={90}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isNext
                          ? colors.accentBg
                          : isDark
                            ? "#334155"
                            : "#f1f5f9",
                      }}
                    >
                      <MaterialIconsRound
                        name={prayer.icon}
                        size={20}
                        color={isNext ? colors.accent : colors.textSecondary}
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontFamily: isNext
                            ? "Outfit_700Bold"
                            : "Outfit_600SemiBold",
                          fontSize: 16,
                          color: colors.textPrimary,
                        }}
                      >
                        {prayer.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: "Outfit_500Medium",
                          color: isNext ? colors.accent : colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {format(prayer.time, "HH:mm")}
                        {isNext && (
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontFamily: "Outfit_400Regular",
                            }}
                          >
                            {" "}
                            • {t("home.next")}
                          </Text>
                        )}
                      </Text>
                      {isNext && nextPrayerMessage ? (
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: "Outfit_400Regular",
                            color: colors.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {nextPrayerMessage}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {isCompleted ? (
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.accent,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: colors.accent,
                        shadowOpacity: 0.3,
                        shadowOffset: { width: 0, height: 4 },
                        shadowRadius: 6,
                        elevation: 3,
                      }}
                    >
                      <MaterialIconsRound
                        name="check"
                        size={18}
                        color="#ffffff"
                      />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: isDark ? "#475569" : "#cbd5e1",
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hadith du jour */}
          <LinearGradient
            colors={isDark ? ["#1f2937", "#111827"] : ["#f0fdfa", "#ffffff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              marginTop: 24,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#ccfbf1",
              padding: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <MaterialIconsRound
                name="format-quote"
                size={20}
                color={colors.accent}
                style={{ marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? "#cbd5e1" : "#475569",
                    lineHeight: 22,
                    fontFamily: "Outfit_400Regular",
                  }}
                >
                  « {dailyHadith.text} »
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 8,
                    textAlign: "right",
                    fontFamily: "Outfit_500Medium",
                  }}
                >
                  — {dailyHadith.source}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}
