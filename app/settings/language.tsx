import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useThemeStore from "@/stores/useThemeStore";
import { changeLanguage } from "@/lib/i18n";
import { useIsDark } from "@/components/useColorScheme";

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
  const isDark = useIsDark();

  const currentLanguage = i18n.language as "fr" | "en";

  const handleLanguageChange = async (langCode: "fr" | "en") => {
    await changeLanguage(langCode);
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <LinearGradient
        colors={["#115E59", "#0d4542"]}
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
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-white font-outfit-bold"
              style={{ fontSize: 24 }}
            >
              {t("language.title")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("language.subtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.2)" }}
          >
            <MaterialIconsRound name="translate" size={26} color="#22C55E" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Liste des langues */}
        <View className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark">
          {LANGUAGES.map((lang, index) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                className="flex-row items-center justify-between p-4"
                style={{
                  borderBottomWidth: index < LANGUAGES.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? "#334155" : "#F1F5F9",
                  backgroundColor: isSelected
                    ? isDark
                      ? "#14532D20"
                      : "#DCFCE720"
                    : "transparent",
                }}
              >
                <View className="flex-row items-center gap-3.5">
                  <Text style={{ fontSize: 28 }}>{lang.flag}</Text>
                  <View>
                    <Text
                      className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                      style={{ fontSize: 16 }}
                    >
                      {lang.name}
                    </Text>
                    <Text
                      className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                      style={{ fontSize: 13 }}
                    >
                      {lang.nativeName}
                    </Text>
                  </View>
                </View>

                {isSelected && (
                  <View
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#22C55E" }}
                  >
                    <MaterialIconsRound name="check" size={18} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Info */}
        <View
          className="flex-row items-start gap-3 mt-6 p-4 rounded-2xl"
          style={{ backgroundColor: isDark ? "#14532D" : "#DCFCE7" }}
        >
          <MaterialIconsRound name="info" size={20} color="#22C55E" />
          <Text
            className="flex-1 font-outfit-regular"
            style={{
              fontSize: 13,
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
