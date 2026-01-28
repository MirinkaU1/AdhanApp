import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useThemeStore from "@/stores/useThemeStore";

export default function GoalsScreen() {
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();
  const [dailyGoal, setDailyGoal] = useState(5);
  const [sundayEnabled, setSundayEnabled] = useState(true);

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const colors = {
    bg: isDark ? "#0F172A" : "#F3F4F6",
    card: isDark ? "#1E293B" : "#FFFFFF",
    textPrimary: isDark ? "#F8FAFC" : "#1E293B",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    accent: "#3B82F6",
    tealDark: "#115E59",
    tealDeep: "#0d4542",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.tealDark, colors.tealDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: 48,
          paddingBottom: 24,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Outfit_700Bold",
                color: "#fff",
              }}
            >
              Objectifs quotidiens
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Outfit_400Regular",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Définissez vos objectifs de prière
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound
              name="track-changes"
              size={26}
              color={colors.accent}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Objectif quotidien */}
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Outfit_700Bold",
            color: colors.textPrimary,
            marginBottom: 16,
          }}
        >
          Prières par jour
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Outfit_500Medium",
              color: colors.textSecondary,
              marginBottom: 16,
            }}
          >
            Objectif de prières obligatoires
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 24,
            }}
          >
            <Pressable
              onPress={() => setDailyGoal(Math.max(1, dailyGoal - 1))}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDark ? "#334155" : "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIconsRound
                name="remove"
                size={24}
                color={colors.textPrimary}
              />
            </Pressable>

            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 48,
                  fontFamily: "Outfit_700Bold",
                  color: colors.accent,
                }}
              >
                {dailyGoal}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Outfit_400Regular",
                  color: colors.textSecondary,
                }}
              >
                prières / jour
              </Text>
            </View>

            <Pressable
              onPress={() => setDailyGoal(Math.min(5, dailyGoal + 1))}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDark ? "#334155" : "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIconsRound
                name="add"
                size={24}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Indicateur visuel */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 24,
            }}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <View
                key={num}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor:
                    num <= dailyGoal
                      ? colors.accent
                      : isDark
                      ? "#334155"
                      : "#E2E8F0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIconsRound
                  name="check"
                  size={20}
                  color={num <= dailyGoal ? "#fff" : colors.textSecondary}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Options */}
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Outfit_700Bold",
            color: colors.textPrimary,
            marginBottom: 16,
          }}
        >
          Options
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isDark ? "#334155" : "#FEF3C7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIconsRound
                  name="local-fire-department"
                  size={22}
                  color="#F59E0B"
                />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Outfit_600SemiBold",
                    color: colors.textPrimary,
                  }}
                >
                  Maintenir la série
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Outfit_400Regular",
                    color: colors.textSecondary,
                  }}
                >
                  Rappel si vous risquez de perdre votre série
                </Text>
              </View>
            </View>
            <Switch
              value={sundayEnabled}
              onValueChange={setSundayEnabled}
              trackColor={{ false: "#e2e8f0", true: "#F59E0B" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            marginTop: 24,
            padding: 16,
            backgroundColor: isDark ? "#1E3A5F" : "#EFF6FF",
            borderRadius: 16,
          }}
        >
          <MaterialIconsRound name="info" size={20} color="#3B82F6" />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: "Outfit_400Regular",
              color: isDark ? "#93C5FD" : "#1E40AF",
              lineHeight: 20,
            }}
          >
            Votre série augmente chaque jour où vous atteignez votre objectif.
            Restez régulier pour maintenir votre progression !
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
