import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useThemeStore from "@/stores/useThemeStore";

export default function HijriScreen() {
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();
  const [adjustment, setAdjustment] = useState(0);

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const colors = {
    bg: isDark ? "#0F172A" : "#F3F4F6",
    card: isDark ? "#1E293B" : "#FFFFFF",
    textPrimary: isDark ? "#F8FAFC" : "#1E293B",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    accent: "#D97706",
    tealDark: "#115E59",
    tealDeep: "#0d4542",
  };

  // Simulation de la date Hijri
  const getHijriDate = (adj: number) => {
    const day = 15 + adj;
    return `${day} Rajab 1447`;
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
              Ajustement Hijri
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Outfit_400Regular",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Ajustez la date du calendrier islamique
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(217, 119, 6, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound
              name="date-range"
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
        {/* Date actuelle */}
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
              marginBottom: 8,
            }}
          >
            Date Hijri actuelle
          </Text>
          <Text
            style={{
              fontSize: 28,
              fontFamily: "Outfit_700Bold",
              color: colors.accent,
              marginBottom: 8,
            }}
          >
            {getHijriDate(adjustment)}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Outfit_400Regular",
              color: colors.textSecondary,
            }}
          >
            25 janvier 2026
          </Text>
        </View>

        {/* Ajustement */}
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Outfit_700Bold",
            color: colors.textPrimary,
            marginBottom: 16,
          }}
        >
          Ajustement
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 32,
            }}
          >
            <Pressable
              onPress={() => setAdjustment(Math.max(-3, adjustment - 1))}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: isDark ? "#334155" : "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIconsRound
                name="remove"
                size={28}
                color={colors.textPrimary}
              />
            </Pressable>

            <View style={{ alignItems: "center", minWidth: 100 }}>
              <Text
                style={{
                  fontSize: 56,
                  fontFamily: "Outfit_700Bold",
                  color:
                    adjustment === 0 ? colors.textSecondary : colors.accent,
                }}
              >
                {adjustment > 0 ? `+${adjustment}` : adjustment}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Outfit_400Regular",
                  color: colors.textSecondary,
                }}
              >
                {adjustment === 0
                  ? "Aucun ajustement"
                  : adjustment === 1 || adjustment === -1
                    ? "jour"
                    : "jours"}
              </Text>
            </View>

            <Pressable
              onPress={() => setAdjustment(Math.min(3, adjustment + 1))}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: isDark ? "#334155" : "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIconsRound
                name="add"
                size={28}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Bouton reset */}
          {adjustment !== 0 && (
            <Pressable
              onPress={() => setAdjustment(0)}
              style={{
                marginTop: 24,
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: isDark ? "#334155" : "#F1F5F9",
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Outfit_500Medium",
                  color: colors.textSecondary,
                }}
              >
                Réinitialiser
              </Text>
            </Pressable>
          )}
        </View>

        {/* Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            marginTop: 24,
            padding: 16,
            backgroundColor: isDark ? "#422006" : "#FEF3C7",
            borderRadius: 16,
          }}
        >
          <MaterialIconsRound name="info" size={20} color="#D97706" />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: "Outfit_400Regular",
              color: isDark ? "#FCD34D" : "#92400E",
              lineHeight: 20,
            }}
          >
            L'ajustement Hijri permet de corriger la date si elle ne correspond
            pas à l'observation de la lune dans votre région.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
