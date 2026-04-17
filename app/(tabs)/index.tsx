import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import {
  format,
  differenceInMinutes,
  isAfter,
  isBefore,
  addHours,
  addMinutes,
} from "date-fns";
import { useIsDark } from "@/components/useColorScheme";
import useAuthStore from "@/stores/useAuthStore";
import usePrayerStore, { PrayerName } from "@/stores/usePrayerStore";
import useQuestStore from "@/stores/useQuestStore";
import { usePrayerLocation } from "@/hooks/usePrayerLocation";
import { useGamification } from "@/hooks/useGamification";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/ui";
import { loadSurah } from "@/utils/quranLoader";
import useRamadanStore from "@/stores/useRamadanStore";
import { DailyWisdomCard, SurahReaderDrawer } from "@/components/quran";

// Configuration des prières avec icônes Material
const PRAYER_ICONS: Record<string, MaterialIconName> = {
  fajr: "dark-mode",
  dhuhr: "wb-sunny",
  asr: "wb-cloudy",
  maghrib: "wb-twilight",
  isha: "nights-stay",
};

const PRAYER_KEYS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// Hadiths
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
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSurahReader, setShowSurahReader] = useState(false);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(67);
  const [targetVerse, setTargetVerse] = useState<number | undefined>(undefined);
  const isDark = useIsDark();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  // Location et horaires de prière
  const {
    location,
    isLoadingLocation,
    isUsingDefaultLocation,
    locationError,
    refreshLocation,
  } = usePrayerLocation();

  const router = useRouter();
  const { user } = useAuthStore();
  const { times, status, hijriDate, togglePrayer } = usePrayerStore();
  const {
    level,
    xp,
    xpToNextLevel,
    getUnclaimedQuestsCount,
    checkAndResetDailyQuests,
    getLevelFromXp,
  } = useQuestStore();
  const { onPrayerCompleted, checkPrayerOnTime } = useGamification();
  const { isRamadanMode, moonCoins } = useRamadanStore();

  // Nombre de quêtes à réclamer
  const unclaimedQuests = getUnclaimedQuestsCount();

  // XP dans le niveau actuel
  const { xpInLevel } = getLevelFromXp(xp);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Actualiser la date
      setNow(new Date());
      // Actualiser la localisation et les horaires
      await refreshLocation();
      // Reset les quêtes si nouveau jour
      checkAndResetDailyQuests();
    } catch (error) {
      console.error("Erreur lors du refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshLocation, checkAndResetDailyQuests]);

  // Handler pour toggle prière avec gamification
  const handlePrayerToggle = useCallback(
    (prayerName: PrayerName) => {
      // Vérifier si la prière n'est pas encore arrivée (impossible de cocher une prière future)
      if (times && times[prayerName]) {
        const prayerTime = times[prayerName];
        if (isAfter(prayerTime, now) && !status[prayerName]) {
          // La prière n'est pas encore arrivée, on ne peut pas la cocher
          console.log(
            `[Prayer] Cannot check ${prayerName} - prayer time not yet arrived`,
          );
          return;
        }
      }

      const wasCompleted = !status[prayerName]; // Il va être complété
      togglePrayer(prayerName, user?.id); // Passer userId pour la sync Supabase
      onPrayerCompleted(prayerName, wasCompleted);

      // Vérifier si la prière est faite à l'heure (dans les 30 min après son début)
      if (wasCompleted && times) {
        checkPrayerOnTime(times[prayerName]);
      }
    },
    [
      togglePrayer,
      onPrayerCompleted,
      checkPrayerOnTime,
      status,
      times,
      now,
      user?.id,
    ],
  );

  // Salutation
  const greeting = t("home.salam");

  // Construire le nom de la ville
  const cityDisplay = useMemo(() => {
    if (isLoadingLocation) return t("home.locating");
    if (!location) return t("home.unknownLocation");
    const parts = [location.city, location.country].filter(Boolean);
    return parts.join(", ") || t("home.unknownLocation");
  }, [location, isLoadingLocation, t]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Période de grâce après l'heure de prière (en minutes)
  // Pendant cette période, la prière reste "active" avant de passer à la suivante
  const PRAYER_GRACE_PERIOD = 30;

  // Trouver la prière en cours ou la prochaine
  const { nextPrayer, nextPrayerTime, isInGracePeriod, isWaitingForMidnight } =
    useMemo(() => {
      if (!times) {
        return {
          nextPrayer: "fajr" as PrayerName,
          nextPrayerTime: null,
          isInGracePeriod: false,
          isWaitingForMidnight: false,
        };
      }

      // Vérifier si on est dans la période de grâce d'une prière
      for (let i = PRAYER_KEYS.length - 1; i >= 0; i--) {
        const key = PRAYER_KEYS[i];
        const prayerTime = times[key];
        const graceEndTime = addMinutes(prayerTime, PRAYER_GRACE_PERIOD);

        // Si on est entre l'heure de la prière et la fin de la période de grâce
        if (isAfter(now, prayerTime) && isBefore(now, graceEndTime)) {
          return {
            nextPrayer: key,
            nextPrayerTime: prayerTime,
            isInGracePeriod: true,
            isWaitingForMidnight: false,
          };
        }
      }

      // Sinon, chercher la prochaine prière future
      for (const key of PRAYER_KEYS) {
        if (isAfter(times[key], now)) {
          return {
            nextPrayer: key,
            nextPrayerTime: times[key],
            isInGracePeriod: false,
            isWaitingForMidnight: false,
          };
        }
      }

      // Toutes les prières sont passées (après Isha + grâce)
      // Vérifier si on est avant ou après minuit
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // Minuit ce soir

      if (isBefore(now, midnight)) {
        // Avant minuit : on attend minuit, Fajr n'est pas encore "la prochaine"
        return {
          nextPrayer: "fajr" as PrayerName,
          nextPrayerTime: times.fajr ? addHours(times.fajr, 24) : null,
          isInGracePeriod: false,
          isWaitingForMidnight: true,
        };
      }

      // Après minuit : Fajr est la prochaine prière normalement
      return {
        nextPrayer: "fajr" as PrayerName,
        nextPrayerTime: times.fajr,
        isInGracePeriod: false,
        isWaitingForMidnight: false,
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

  // Countdown en minutes (null si dans la période de grâce ou avant minuit)
  const countdownMinutes = useMemo(() => {
    if (isInGracePeriod) return null; // Pas de countdown pendant la période de grâce
    if (isWaitingForMidnight) return null; // Pas de countdown avant minuit
    if (!nextPrayerTime || isAfter(now, nextPrayerTime)) return null;
    return differenceInMinutes(nextPrayerTime, now);
  }, [now, nextPrayerTime, isInGracePeriod, isWaitingForMidnight]);

  const nextPrayerMessage = useMemo(() => {
    if (isInGracePeriod) return t("home.now"); // "Maintenant" pendant la période de grâce
    if (isWaitingForMidnight) return t("home.tomorrow"); // "Demain" avant minuit
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
  }, [countdownMinutes, isInGracePeriod, isWaitingForMidnight, t]);

  // Format du countdown pour le badge header
  const headerCountdown = useMemo(() => {
    if (isInGracePeriod) {
      return { value: t("home.now"), unit: "" }; // "Maintenant" pendant la période de grâce
    }
    if (isWaitingForMidnight) {
      return { value: t("home.tomorrow"), unit: "" }; // "Demain" avant minuit
    }
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
  }, [countdownMinutes, isInGracePeriod, t]);

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

  const isSmallScreen = screenHeight < 700 || screenWidth < 360;

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#115E59"
            colors={["#115E59"]}
            progressBackgroundColor={isDark ? "#1E293B" : "#FFFFFF"}
          />
        }
      >
        {/* ===== HEADER ===== */}
        <View
          className="rounded-b-4xl overflow-hidden"
          style={{ minHeight: 360 }}
        >
          <LinearGradient
            colors={["#115E59", "#0d4542"]}
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
          {/* <Pressable
            onPress={() => router.push("/settings/notifications")}
            className="absolute top-10 right-6 z-10 p-2"
          >
            <MaterialIconsRound
              name="notifications-none"
              size={26}
              color="#fff"
            />
          </Pressable> */}

          {/* Contenu du header */}
          <View className="px-4 pt-12 pb-4">
            {/* Badges ligne gauche — location + lunes côte à côte, loin du bouton notif absolu */}
            <View className="flex-row w-full justify-between items-center gap-2 mb-5">
              {/* Badge localisation */}
              <Pressable
                onPress={refreshLocation}
                className="flex-row items-center bg-white/10 px-3 py-1.5 rounded-full border border-white/10 active:opacity-70"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator
                    size="small"
                    color="#D97706"
                    style={{ marginRight: 6 }}
                  />
                ) : (
                  <MaterialIconsRound
                    name="location-on"
                    size={16}
                    color="#D97706"
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text className="text-white text-xs font-outfit-medium">
                  {cityDisplay}
                </Text>
              </Pressable>

              <View className="flex-row items-center gap-2">
                {/* Badge lunes Ramadan */}
                {isRamadanMode && (
                  <View className="flex-row items-center bg-white/10 px-3 py-1 rounded-full border border-white/10 gap-1.5">
                    <MaterialIconsRound
                      name="nightlight"
                      size={14}
                      color="#FCD34D"
                    />
                    <Text className="text-white text-sm font-outfit-bold">
                      {moonCoins}
                    </Text>
                  </View>
                )}

                {/* Icône notification en absolute */}
                <Pressable
                  onPress={() => router.push("/settings/notifications")}
                  className="p-2"
                >
                  <MaterialIconsRound
                    name="notifications-none"
                    size={26}
                    color="#fff"
                  />
                </Pressable>
              </View>
            </View>

            {/* Date Hijri */}
            <Text className="text-white/70 text-[11px] font-outfit-regular text-center tracking-widest mb-2 uppercase">
              {hijriDate || t("home.loadingHijri")}
            </Text>

            {/* Salutation */}
            <Text
              className="text-white font-outfit-bold text-center mb-1"
              style={{ fontSize: isSmallScreen ? 28 : 32 }}
            >
              {greeting}, {user?.name || t("home.guest")} 👋
            </Text>

            {/* Niveau et XP - Badges séparés */}
            <View className="flex-row items-center justify-center gap-4 mb-4">
              {/* Badge Niveau - Cliquable pour aller aux niveaux */}
              <Pressable
                onPress={() => router.push("/levels")}
                className="flex-row items-center bg-white/15 px-3 py-1.5 rounded-2xl gap-1.5 active:opacity-80"
              >
                <MaterialIconsRound name="star" size={16} color="#D97706" />
                <Text
                  className="text-white font-outfit-semibold"
                  style={{ fontSize: 13 }}
                >
                  {t("home.level")} {level}
                </Text>
              </Pressable>

              {/* Badge XP - Cliquable pour aller aux quêtes */}
              <Pressable
                onPress={() => router.push("/quests")}
                className="relative flex-row items-center bg-white/15 px-3 py-1.5 rounded-2xl gap-1.5 active:opacity-80"
              >
                <MaterialIconsRound name="bolt" size={16} color="#22C55E" />
                <Text
                  className="text-white font-outfit-semibold"
                  style={{ fontSize: 13 }}
                >
                  {xpInLevel}/{xpToNextLevel} XP
                </Text>
                {/* Badge de notification pour quêtes à réclamer */}
                {unclaimedQuests > 0 && (
                  <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center border border-white/30">
                    <Text className="text-white text-[9px] font-outfit-bold">
                      {unclaimedQuests}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Badge prochaine prière — toujours visible si nextPrayer existe */}
            {nextPrayer && (
              <View className="self-center bg-black/25 px-4 py-2 rounded-full mb-5 flex-row items-center">
                <Text className="text-white text-sm font-outfit-medium">
                  {t(`home.${nextPrayer}`)}{" "}
                  {!isWaitingForMidnight && t("home.inTime", { time: "" })}
                </Text>
                <Text className="text-accent text-sm font-outfit-bold">
                  {headerCountdown
                    ? `${headerCountdown.value}${headerCountdown.unit ? ` ${headerCountdown.unit}` : ""}`
                    : t("home.now")}
                </Text>
              </View>
            )}

            {/* Barre des 5 prières */}
            <View className="flex-row justify-between items-end">
              {prayerList.map((prayer) => {
                const isHighlighted = prayer.isNext;
                return (
                  <View
                    key={prayer.key}
                    className="items-center flex-1"
                    style={{ opacity: isHighlighted ? 1 : 0.6 }}
                  >
                    <Text
                      className={`text-[10px] uppercase mb-1 font-outfit-medium ${
                        isHighlighted
                          ? "text-accent font-outfit-bold"
                          : "text-white"
                      }`}
                    >
                      {prayer.label}
                    </Text>
                    <Text
                      className={`font-outfit-semibold text-white ${
                        isHighlighted ? "text-xl" : "text-sm"
                      }`}
                    >
                      {format(prayer.time, "HH:mm")}
                    </Text>
                    <MaterialIconsRound
                      name={prayer.icon}
                      size={isHighlighted ? 24 : 18}
                      color={
                        isHighlighted ? "#D97706" : "rgba(255,255,255,0.7)"
                      }
                      style={{ marginTop: 4 }}
                    />
                    {isHighlighted && (
                      <View className="w-1 h-1 bg-accent rounded-sm mt-1.5" />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ===== CONTENU PRINCIPAL ===== */}
        <View className="pt-6 px-4">
          {/* Section Suivi du jour */}
          <View className="flex-row justify-between items-end mb-5">
            <View>
              <AppText variant="h2" className="mb-1">
                {t("home.dailyTracking")}
              </AppText>
              <AppText variant="caption">
                {t("home.prayersCompleted", { count: completedCount })}
              </AppText>
            </View>

            {/* Cercle de progression */}
            <View className="w-[52px] h-[52px] items-center justify-center">
              <Svg width={52} height={52} style={{ position: "absolute" }}>
                <Circle
                  cx="26"
                  cy="26"
                  r={progressRadius}
                  stroke={isDark ? "#334155" : "#E2E8F0"}
                  strokeWidth={4}
                  fill="transparent"
                />
                <Circle
                  cx="26"
                  cy="26"
                  r={progressRadius}
                  stroke="#D97706"
                  strokeWidth={4}
                  fill="transparent"
                  strokeDasharray={progressCircumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  rotation={-90}
                  origin="26,26"
                />
              </Svg>
              <Text className="text-[11px] font-outfit-bold text-text-secondary-light dark:text-text-secondary-dark">
                {progressPercent}%
              </Text>
            </View>
          </View>

          {/* Liste des prières */}
          <View className="gap-3">
            {prayerList.map((prayer) => {
              const isNext = prayer.isNext;
              const isCompleted = prayer.isCompleted;
              const isPast = prayer.isPast && !isCompleted;

              return (
                <TouchableOpacity
                  key={prayer.key}
                  onPress={() => handlePrayerToggle(prayer.key)}
                  {...(Platform.OS === "web"
                    ? { onClick: () => handlePrayerToggle(prayer.key) }
                    : {})}
                  activeOpacity={0.85}
                  className={`flex-row items-center justify-between p-4 bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark overflow-hidden ${
                    isPast && !isNext ? "opacity-85" : ""
                  }`}
                  style={{
                    borderRadius: 20,
                    borderLeftWidth: isNext ? 4 : 1,
                    borderLeftColor: isNext ? "#D97706" : undefined,
                    shadowColor: isNext ? "#D97706" : "#000",
                    shadowOpacity: isNext ? 0.15 : 0.05,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: isNext ? 12 : 6,
                    elevation: isNext ? 2 : 0,
                    cursor: "pointer" as any,
                  }}
                  accessibilityRole="button"
                >
                  {/* Background icon si isNext */}
                  {isNext && (
                    <View
                      pointerEvents="none"
                      className="absolute right-2 top-2 opacity-[0.07]"
                    >
                      <MaterialIconsRound
                        name="mosque"
                        size={90}
                        color={isDark ? "#94A3B8" : "#64748B"}
                      />
                    </View>
                  )}

                  <View className="flex-row items-center gap-4">
                    {/* Icon container */}
                    <View
                      className={`w-11 h-11 rounded-full items-center justify-center ${
                        isNext
                          ? isDark
                            ? "bg-accent/20"
                            : "bg-[#FEF3C7]"
                          : isDark
                            ? "bg-slate-700"
                            : "bg-slate-100"
                      }`}
                    >
                      <MaterialIconsRound
                        name={prayer.icon}
                        size={20}
                        color={
                          isNext ? "#D97706" : isDark ? "#94A3B8" : "#64748B"
                        }
                      />
                    </View>

                    {/* Prayer details */}
                    <View>
                      <Text
                        className={`${
                          isNext ? "font-outfit-bold" : "font-outfit-semibold"
                        } text-base text-text-primary-light dark:text-text-primary-dark`}
                      >
                        {prayer.label}
                      </Text>
                      <Text
                        className={`text-sm font-outfit-medium mt-0.5 ${
                          isNext
                            ? "text-accent"
                            : "text-text-secondary-light dark:text-text-secondary-dark"
                        }`}
                      >
                        {format(prayer.time, "HH:mm")}
                        {isNext && (
                          <Text className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
                            {" "}
                            • {t("home.next")}
                          </Text>
                        )}
                      </Text>
                      {isNext && nextPrayerMessage && (
                        <Text className="text-xs font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                          {nextPrayerMessage}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Checkbox/completed icon */}
                  {isCompleted ? (
                    <View
                      className="w-8 h-8 rounded-full bg-accent items-center justify-center"
                      style={{
                        shadowColor: "#D97706",
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
                      className="w-8 h-8 rounded-full"
                      style={{
                        borderWidth: 2,
                        borderColor: isDark ? "#475569" : "#cbd5e1",
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sagesse du Jour (Alternance Verset/Hadith) */}
          <View className="mt-6">
            <DailyWisdomCard
              onVersePress={(surahNumber: number, verseNumber: number) => {
                const lang = i18n.language.startsWith("en") ? "en" : "fr";
                loadSurah(surahNumber, lang); // prefetch pendant l'animation d'ouverture
                setSelectedSurahNumber(surahNumber);
                setTargetVerse(verseNumber);
                setShowSurahReader(true);
              }}
              mode="daily"
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal Lecture de Sourate */}
      <SurahReaderDrawer
        isVisible={showSurahReader}
        onClose={() => setShowSurahReader(false)}
        surahNumber={selectedSurahNumber}
        targetVerseNumber={targetVerse}
      />
    </View>
  );
}
