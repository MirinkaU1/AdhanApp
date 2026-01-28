import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import useThemeStore, { ThemeMode } from "@/stores/useThemeStore";

interface ThemeOption {
  id: ThemeMode;
  name: string;
  description: string;
  icon: MaterialIconName;
}

const THEMES: ThemeOption[] = [
  {
    id: "light",
    name: "Clair",
    description: "Thème lumineux pour la journée",
    icon: "light-mode",
  },
  {
    id: "dark",
    name: "Sombre",
    description: "Thème sombre pour économiser la batterie",
    icon: "dark-mode",
  },
  {
    id: "system",
    name: "Système",
    description: "Suivre les paramètres de l'appareil",
    icon: "settings-suggest",
  },
];

export default function ThemeScreen() {
  const systemColorScheme = useColorScheme();
  const { mode: themeMode, setMode } = useThemeStore();

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const colors = {
    bg: isDark ? "#0F172A" : "#F3F4F6",
    card: isDark ? "#1E293B" : "#FFFFFF",
    textPrimary: isDark ? "#F8FAFC" : "#1E293B",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    accent: "#F59E0B",
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
          paddingHorizontal: 16,
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
              Thème
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Outfit_400Regular",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Personnalisez l'apparence de l'app
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(245, 158, 11, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound
              name="palette"
              size={26}
              color={colors.accent}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingVertical: 24,
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Options de thème */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {THEMES.map((theme, index) => (
            <Pressable
              key={theme.id}
              onPress={() => setMode(theme.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderBottomWidth: index < THEMES.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                backgroundColor:
                  themeMode === theme.id
                    ? isDark
                      ? "#422006"
                      : "#FEF3C7"
                    : "transparent",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor:
                      themeMode === theme.id
                        ? isDark
                          ? "#78350F"
                          : "#FDE68A"
                        : isDark
                          ? "#334155"
                          : "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIconsRound
                    name={theme.icon}
                    size={24}
                    color={
                      themeMode === theme.id
                        ? colors.accent
                        : colors.textSecondary
                    }
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
                    {theme.name}
                  </Text>
                  {/* <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Outfit_400Regular",
                      color: colors.textSecondary,
                    }}
                  >
                    {theme.description}
                  </Text> */}
                </View>
              </View>

              {themeMode === theme.id && (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIconsRound name="check" size={18} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Preview */}
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Outfit_700Bold",
            color: colors.textPrimary,
            marginTop: 32,
            marginBottom: 16,
          }}
        >
          Aperçu
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 16,
          }}
        >
          {/* Light preview */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 16,
              borderWidth: 2,
              borderColor: themeMode === "light" ? colors.accent : "#E2E8F0",
            }}
          >
            <View
              style={{
                width: "100%",
                height: 24,
                backgroundColor: "#115E59",
                borderRadius: 6,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: "70%",
                height: 12,
                backgroundColor: "#E2E8F0",
                borderRadius: 4,
                marginBottom: 6,
              }}
            />
            <View
              style={{
                width: "50%",
                height: 12,
                backgroundColor: "#E2E8F0",
                borderRadius: 4,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Outfit_500Medium",
                color: "#64748B",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              Clair
            </Text>
          </View>

          {/* Dark preview */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#1E293B",
              borderRadius: 20,
              padding: 16,
              borderWidth: 2,
              borderColor: themeMode === "dark" ? colors.accent : "#334155",
            }}
          >
            <View
              style={{
                width: "100%",
                height: 24,
                backgroundColor: "#115E59",
                borderRadius: 6,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: "70%",
                height: 12,
                backgroundColor: "#334155",
                borderRadius: 4,
                marginBottom: 6,
              }}
            />
            <View
              style={{
                width: "50%",
                height: 12,
                backgroundColor: "#334155",
                borderRadius: 4,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Outfit_500Medium",
                color: "#94A3B8",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              Sombre
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
