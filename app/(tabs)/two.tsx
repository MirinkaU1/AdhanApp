import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui";
import { useTranslation } from "react-i18next";

// Données mock pour l'historique
const WEEK_DATA = [
  { day: "Lun", completed: 5, total: 5 },
  { day: "Mar", completed: 4, total: 5 },
  { day: "Mer", completed: 5, total: 5 },
  { day: "Jeu", completed: 3, total: 5 },
  { day: "Ven", completed: 5, total: 5 },
  { day: "Sam", completed: 2, total: 5 },
  { day: "Dim", completed: 0, total: 5 },
];

const STATS = [
  {
    label: "Série actuelle",
    value: "12",
    unit: "jours",
    icon: "flame" as const,
  },
  {
    label: "Meilleure série",
    value: "28",
    unit: "jours",
    icon: "trophy" as const,
  },
  {
    label: "Total prières",
    value: "847",
    unit: "prières",
    icon: "checkmark-done" as const,
  },
  { label: "Taux moyen", value: "89", unit: "%", icon: "trending-up" as const },
];

/**
 * Composant pour une carte de stat
 */
function StatCard({ stat }: { stat: typeof STATS[0] }) {
  return (
    <View className="w-[48%] bg-white dark:bg-slate-800 rounded-2xl p-4 border border-border-light dark:border-border-dark">
      <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center mb-3">
        <Ionicons name={stat.icon} size={20} color="#d97706" />
      </View>
      <Text className="text-2xl font-outfit-bold text-text-primary-light dark:text-text-primary-dark">
        {stat.value}
        <Text className="text-sm font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark">
          {" "}
          {stat.unit}
        </Text>
      </Text>
      <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
        {stat.label}
      </Text>
    </View>
  );
}

/**
 * Composant pour une barre du graphique hebdomadaire
 */
function WeekBar({ day, completed, total, isToday }: typeof WEEK_DATA[0] & { isToday: boolean }) {
  const heightPercent = (completed / total) * 100;
  const isEmpty = completed === 0;
  
  return (
    <View className="items-center flex-1">
      <View className="h-20 justify-end">
        <View
          className={`w-6 rounded ${
            isToday ? "bg-accent" : "bg-primary"
          } ${isEmpty ? "opacity-20" : "opacity-100"}`}
          style={{ 
            height: Math.max((heightPercent * 80) / 100, 4) 
          }}
        />
      </View>
      <Text
        className={`text-xs mt-2 ${
          isToday
            ? "text-accent font-outfit-semibold"
            : "text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
        }`}
      >
        {day}
      </Text>
    </View>
  );
}

/**
 * Composant pour une cellule du calendrier
 */
function CalendarDay({ dayNum, isToday, completed, isFuture }: { 
  dayNum: number; 
  isToday: boolean; 
  completed: boolean;
  isFuture: boolean;
}) {
  if (dayNum <= 0 || dayNum > 31) {
    return <View className="flex-1 h-9" />;
  }

  return (
    <View className="flex-1 h-9 items-center justify-center">
      <View
        className={`w-7 h-7 rounded-full items-center justify-center ${
          isToday
            ? "bg-accent"
            : completed
              ? "bg-primary"
              : "bg-transparent"
        } ${isFuture ? "opacity-30" : "opacity-100"}`}
      >
        <Text
          className={`text-xs ${
            isToday || completed
              ? "text-white font-outfit-bold"
              : "text-text-primary-light dark:text-text-primary-dark font-outfit-regular"
          }`}
        >
          {dayNum}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AppText variant="h1" className="mb-2">
          Statistiques
        </AppText>
        <AppText variant="caption">
          Suivez votre progression dans la prière
        </AppText>

        {/* Stats cards avec flex-wrap */}
        <View className="flex-row flex-wrap gap-3 mt-6">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </View>

        {/* Graphique de la semaine */}
        <AppText variant="h3" className="mt-8 mb-4">
          Cette semaine
        </AppText>

        <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border-light dark:border-border-dark">
          <View className="flex-row justify-between items-end h-[120px]">
            {WEEK_DATA.map((day, index) => (
              <WeekBar key={day.day} {...day} isToday={index === 6} />
            ))}
          </View>
        </View>

        {/* Calendrier du mois */}
        <AppText variant="h3" className="mt-8 mb-4">
          Janvier 2026
        </AppText>

        <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border-light dark:border-border-dark">
          {/* Jours de la semaine */}
          <View className="flex-row mb-3">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <Text
                key={day}
                className="flex-1 text-center text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-semibold"
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Grille du calendrier avec flex-wrap amélioré */}
          {[0, 1, 2, 3, 4].map((week) => (
            <View key={week} className="flex-row mb-2">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const dayNum = week * 7 + day + 1;
                // Commence le 1er janvier un mercredi (index 2)
                const actualDay = week === 0 ? dayNum - 2 : dayNum - 2;
                const isToday = actualDay === 25;
                const completed = Math.random() > 0.3;
                const isFuture = actualDay > 25;

                return (
                  <CalendarDay
                    key={day}
                    dayNum={actualDay}
                    isToday={isToday}
                    completed={completed}
                    isFuture={isFuture}
                  />
                );
              })}
            </View>
          ))}

          {/* Légende */}
          <View className="flex-row justify-center gap-5 mt-4">
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-full bg-primary" />
              <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                5/5 prières
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-full bg-accent" />
              <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Aujourd'hui
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
