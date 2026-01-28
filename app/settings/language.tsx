import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useThemeStore from "@/stores/useThemeStore";
import { changeLanguage } from "@/lib/i18n";

interface Language {
  code: "fr" | "en";
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: "fr", name: "Français", nativeName: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();

  // Utiliser i18n.language pour réactivité automatique
  const currentLanguage = i18n.language as "fr" | "en";

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const colors = {
    bg: isDark ? "#0F172A" : "#F3F4F6",
    card: isDark ? "#1E293B" : "#FFFFFF",
    textPrimary: isDark ? "#F8FAFC" : "#1E293B",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    accent: "#22C55E",
    tealDark: "#115E59",
    tealDeep: "#0d4542",
  };

  const handleLanguageChange = async (langCode: "fr" | "en") => {
    await changeLanguage(langCode);
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
              {t("language.title")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Outfit_400Regular",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {t("language.subtitle")}
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound
              name="translate"
              size={26}
              color={colors.accent}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Liste des langues */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {LANGUAGES.map((lang, index) => (
            <Pressable
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderBottomWidth: index < LANGUAGES.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                backgroundColor:
                  currentLanguage === lang.code
                    ? isDark
                      ? "#14532D20"
                      : "#DCFCE720"
                    : "transparent",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
              >
                <Text style={{ fontSize: 28 }}>{lang.flag}</Text>
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Outfit_600SemiBold",
                      color: colors.textPrimary,
                    }}
                  >
                    {lang.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Outfit_400Regular",
                      color: colors.textSecondary,
                    }}
                  >
                    {lang.nativeName}
                  </Text>
                </View>
              </View>

              {currentLanguage === lang.code && (
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

        {/* Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            marginTop: 24,
            padding: 16,
            backgroundColor: isDark ? "#14532D" : "#DCFCE7",
            borderRadius: 16,
          }}
        >
          <MaterialIconsRound name="info" size={20} color="#22C55E" />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: "Outfit_400Regular",
              color: isDark ? "#86EFAC" : "#166534",
              lineHeight: 20,
            }}
          >
            {t("language.info")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
