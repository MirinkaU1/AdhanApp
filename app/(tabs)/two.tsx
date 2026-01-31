import { ScrollView, Text, View, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import Svg, { Circle } from "react-native-svg";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { AppText } from "@/components/ui";
import { useIsDark } from "@/components/useColorScheme";
import useStatistics, {
  WeekData,
  MonthData,
  PrayerBreakdown,
} from "@/hooks/useStatistics";

// =====================================================
// TYPES
// =====================================================

interface StatCardProps {
  icon: MaterialIconName;
  iconBgColor: string;
  iconColor: string;
  value: string | number;
  unit: string;
  label: string;
  trend?: number;
}

// =====================================================
// COMPONENTS
// =====================================================

/**
 * Carte de statistique principale
 */
function StatCard({
  icon,
  iconBgColor,
  iconColor,
  value,
  unit,
  label,
  trend,
}: StatCardProps) {
  const isDark = useIsDark();

  return (
    <View className="w-[48%] bg-card-light dark:bg-card-dark rounded-2xl p-4 border border-border-light dark:border-border-dark">
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: iconBgColor }}
        >
          <MaterialIconsRound name={icon} size={20} color={iconColor} />
        </View>
        {trend !== undefined && trend !== 0 && (
          <View
            className={`flex-row items-center px-2 py-1 rounded-full ${
              trend > 0
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-red-100 dark:bg-red-900/30"
            }`}
          >
            <MaterialIconsRound
              name={trend > 0 ? "trending-up" : "trending-down"}
              size={12}
              color={trend > 0 ? "#22C55E" : "#EF4444"}
            />
            <Text
              className={`text-xs font-outfit-medium ml-0.5 ${
                trend > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {Math.abs(Math.round(trend))}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-outfit-bold text-text-primary-light dark:text-text-primary-dark">
        {value}
        <Text className="text-sm font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark">
          {" "}
          {unit}
        </Text>
      </Text>
      <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 font-outfit-regular">
        {label}
      </Text>
    </View>
  );
}

/**
 * Barre du graphique hebdomadaire
 */
function WeekBar({
  data,
  maxHeight = 80,
}: {
  data: WeekData;
  maxHeight?: number;
}) {
  const isDark = useIsDark();
  const height = Math.max((data.percentage * maxHeight) / 100, 4);
  const isEmpty = data.completed === 0;

  return (
    <View className="items-center flex-1">
      <View style={{ height: maxHeight }} className="justify-end">
        <View
          className={`w-7 rounded-lg ${
            data.isToday ? "bg-accent" : "bg-primary"
          }`}
          style={{
            height,
            opacity: isEmpty ? 0.2 : 1,
          }}
        />
      </View>
      <Text
        className={`text-xs mt-2 font-outfit-medium ${
          data.isToday
            ? "text-accent"
            : "text-text-secondary-light dark:text-text-secondary-dark"
        }`}
      >
        {data.dayLabel}
      </Text>
      <Text
        className={`text-[10px] font-outfit-regular ${
          data.isToday
            ? "text-accent"
            : "text-text-tertiary-light dark:text-text-tertiary-dark"
        }`}
      >
        {data.completed}/5
      </Text>
    </View>
  );
}

/**
 * Cellule du calendrier mensuel
 */
function CalendarCell({ data }: { data: MonthData }) {
  if (!data.isCurrentMonth) {
    return <View className="flex-1 h-9" />;
  }

  const bgColor = data.isToday
    ? "bg-accent"
    : data.isComplete
      ? "bg-primary"
      : data.completed > 0
        ? "bg-primary/30"
        : "bg-transparent";

  const textColor =
    data.isToday || data.isComplete
      ? "text-white"
      : "text-text-primary-light dark:text-text-primary-dark";

  return (
    <View className="flex-1 h-9 items-center justify-center">
      <View
        className={`w-7 h-7 rounded-full items-center justify-center ${bgColor}`}
        style={{ opacity: data.isFuture ? 0.3 : 1 }}
      >
        <Text className={`text-xs font-outfit-medium ${textColor}`}>
          {data.dayNum}
        </Text>
      </View>
    </View>
  );
}

/**
 * Barre de progression pour chaque prière
 */
function PrayerProgressBar({ data }: { data: PrayerBreakdown }) {
  const { t } = useTranslation();
  const isDark = useIsDark();

  const prayerLabels: Record<string, string> = {
    fajr: t("home.fajr"),
    dhuhr: t("home.dhuhr"),
    asr: t("home.asr"),
    maghrib: t("home.maghrib"),
    isha: t("home.isha"),
  };

  const prayerColors: Record<string, string> = {
    fajr: "#6366F1",
    dhuhr: "#F59E0B",
    asr: "#3B82F6",
    maghrib: "#EC4899",
    isha: "#8B5CF6",
  };

  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-sm font-outfit-medium text-text-primary-light dark:text-text-primary-dark">
          {prayerLabels[data.name]}
        </Text>
        <Text className="text-sm font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark">
          {Math.round(data.percentage)}%
        </Text>
      </View>
      <View className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${data.percentage}%`,
            backgroundColor: prayerColors[data.name],
          }}
        />
      </View>
    </View>
  );
}

/**
 * Indicateur circulaire de progression avec SVG
 */
function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = "#0f766e",
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const isDark = useIsDark();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Assurer que le pourcentage est entre 0 et 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset =
    circumference - (clampedPercentage / 100) * circumference;

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={"#E2E8F0"}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Center content */}
      <View className="items-center">
        <Text className="text-3xl font-outfit-bold text-white">
          {Math.round(clampedPercentage)}%
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// MAIN SCREEN
// =====================================================

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const stats = useStatistics();

  const dayLabels =
    t("language.french") === "Français"
      ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec gradient */}
        <LinearGradient
          colors={["#115E59", "#0d4542"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            paddingTop: 60,
            paddingBottom: 32,
            paddingHorizontal: 16,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <Text className="text-white text-4xl mb-2 font-outfit-bold">
            {t("stats.title")}
          </Text>
          <Text className="text-white/70 font-outfit-regular mt-1 text-sm">
            {t("stats.subtitle")}
          </Text>

          {/* Progression globale */}
          <View className="flex-row items-center justify-between mt-6">
            <View className="flex-1">
              <Text className="text-white/60 font-outfit-regular text-sm">
                {t("stats.thisMonth")}
              </Text>
              <Text className="text-white font-outfit-bold text-4xl mt-1">
                {stats.monthCompleted}
                <Text className="text-lg text-white/60 font-outfit-regular">
                  /{stats.monthTotal}
                </Text>
              </Text>
              <Text className="text-white/80 font-outfit-medium text-sm mt-1">
                {t("stats.prayers")}
              </Text>
            </View>
            <CircularProgress
              percentage={stats.monthPercentage}
              size={100}
              strokeWidth={8}
              color="#5EEAD4"
            />
          </View>
        </LinearGradient>

        <View className="px-4 -mt-4">
          {/* Cartes de statistiques */}
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon="local-fire-department"
              iconBgColor={isDark ? "#7C2D12" : "#FEF3C7"}
              iconColor="#F59E0B"
              value={stats.currentStreak}
              unit={t("stats.days")}
              label={t("stats.currentStreak")}
            />
            <StatCard
              icon="emoji-events"
              iconBgColor={isDark ? "#713F12" : "#FEF9C3"}
              iconColor="#EAB308"
              value={stats.bestStreak}
              unit={t("stats.days")}
              label={t("stats.bestStreak")}
            />
            <StatCard
              icon="check-circle"
              iconBgColor={isDark ? "#14532D" : "#DCFCE7"}
              iconColor="#22C55E"
              value={stats.totalPrayers}
              unit={t("stats.prayers")}
              label={t("stats.totalPrayers")}
            />
            <StatCard
              icon="trending-up"
              iconBgColor={isDark ? "#1E3A5F" : "#DBEAFE"}
              iconColor="#3B82F6"
              value={Math.round(stats.completionRate)}
              unit="%"
              label={t("stats.completionRate")}
              trend={stats.thisWeekVsLastWeek}
            />
          </View>

          {/* Graphique hebdomadaire */}
          <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-lg mt-8 mb-4">
            {t("stats.thisWeek")}
          </Text>

          <View className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-border-light dark:border-border-dark">
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark">
                {stats.weekCompleted}/{stats.weekTotal} {t("stats.prayers")}
              </Text>
              <Text className="text-sm font-outfit-bold text-primary">
                {Math.round(stats.weekPercentage)}%
              </Text>
            </View>
            <View className="flex-row justify-between items-end mt-4">
              {stats.weekData.map((day, index) => (
                <WeekBar key={index} data={day} />
              ))}
            </View>
          </View>

          {/* Répartition par prière */}
          <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-lg mt-8 mb-4">
            {t("stats.byPrayer")}
          </Text>

          <View className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-border-light dark:border-border-dark">
            {stats.prayerBreakdown.map((prayer) => (
              <PrayerProgressBar key={prayer.name} data={prayer} />
            ))}
          </View>

          {/* Calendrier mensuel */}
          <View className="flex-row items-center justify-between mt-8 mb-4">
            <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-lg capitalize">
              {stats.monthName} {stats.monthYear}
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-primary" />
              <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
                {stats.perfectDaysThisMonth} {t("stats.perfectDays")}
              </Text>
            </View>
          </View>

          <View className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-border-light dark:border-border-dark">
            {/* En-têtes des jours */}
            <View className="flex-row mb-3">
              {dayLabels.map((day) => (
                <Text
                  key={day}
                  className="flex-1 text-center text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-semibold"
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Grille du calendrier */}
            {stats.monthData.map((week, weekIndex) => (
              <View key={weekIndex} className="flex-row mb-2">
                {week.map((day, dayIndex) => (
                  <CalendarCell key={dayIndex} data={day} />
                ))}
              </View>
            ))}

            {/* Légende */}
            <View className="flex-row justify-center gap-5 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
              <View className="flex-row items-center gap-1.5">
                <View className="w-3 h-3 rounded-full bg-primary" />
                <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
                  5/5
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-3 h-3 rounded-full bg-primary/30" />
                <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
                  {t("stats.partial")}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-3 h-3 rounded-full bg-accent" />
                <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
                  {t("stats.today")}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
