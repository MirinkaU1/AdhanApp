import { ScrollView, Text, View, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import useThemeStore from "@/stores/useThemeStore";

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

export default function HistoryScreen() {
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const bgColor = isDark ? "#0f172a" : "#f1f5f9";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const textPrimary = isDark ? "#f8fafc" : "#1e293b";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "#334155" : "#e2e8f0";

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={{ fontSize: 28, fontWeight: "700", color: textPrimary }}>
          Statistiques
        </Text>
        <Text style={{ fontSize: 14, color: textSecondary, marginTop: 8 }}>
          Suivez votre progression dans la prière
        </Text>

        {/* Stats cards */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 24,
          }}
        >
          {STATS.map((stat) => (
            <View
              key={stat.label}
              style={{
                width: "48%",
                backgroundColor: cardBg,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDark ? "#334155" : "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name={stat.icon} size={20} color="#d97706" />
              </View>
              <Text
                style={{ fontSize: 24, fontWeight: "700", color: textPrimary }}
              >
                {stat.value}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "400",
                    color: textSecondary,
                  }}
                >
                  {" "}
                  {stat.unit}
                </Text>
              </Text>
              <Text
                style={{ fontSize: 12, color: textSecondary, marginTop: 4 }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Graphique de la semaine */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: textPrimary,
            marginTop: 32,
            marginBottom: 16,
          }}
        >
          Cette semaine
        </Text>

        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              height: 120,
            }}
          >
            {WEEK_DATA.map((day, index) => {
              const height = (day.completed / day.total) * 80;
              const isToday = index === 6;

              return (
                <View key={day.day} style={{ alignItems: "center", flex: 1 }}>
                  <View style={{ height: 80, justifyContent: "flex-end" }}>
                    <View
                      style={{
                        width: 24,
                        height: Math.max(height, 4),
                        backgroundColor: isToday ? "#d97706" : "#0f766e",
                        borderRadius: 4,
                        opacity: day.completed === 0 ? 0.2 : 1,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isToday ? "#d97706" : textSecondary,
                      marginTop: 8,
                      fontWeight: isToday ? "600" : "400",
                    }}
                  >
                    {day.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Calendrier du mois (placeholder) */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: textPrimary,
            marginTop: 32,
            marginBottom: 16,
          }}
        >
          Janvier 2026
        </Text>

        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor,
          }}
        >
          {/* Jours de la semaine */}
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <Text
                key={day}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 12,
                  color: textSecondary,
                  fontWeight: "600",
                }}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Grille du calendrier (simplifiée) */}
          {[0, 1, 2, 3, 4].map((week) => (
            <View key={week} style={{ flexDirection: "row", marginBottom: 8 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const dayNum = week * 7 + day + 1;
                if (dayNum > 31 || (week === 0 && day < 2)) {
                  return <View key={day} style={{ flex: 1, height: 36 }} />;
                }
                const actualDay = week === 0 ? dayNum - 2 : dayNum - 2;
                const isToday = actualDay === 25;
                const completed = Math.random() > 0.3;

                return (
                  <View
                    key={day}
                    style={{
                      flex: 1,
                      height: 36,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: isToday
                          ? "#d97706"
                          : completed
                            ? "#0f766e"
                            : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: actualDay > 25 ? 0.3 : 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: isToday || completed ? "#ffffff" : textPrimary,
                          fontWeight: isToday ? "700" : "400",
                        }}
                      >
                        {actualDay > 0 && actualDay <= 31 ? actualDay : ""}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {/* Légende */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 20,
              marginTop: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#0f766e",
                }}
              />
              <Text style={{ fontSize: 12, color: textSecondary }}>
                5/5 prières
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#d97706",
                }}
              />
              <Text style={{ fontSize: 12, color: textSecondary }}>
                Aujourd'hui
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
