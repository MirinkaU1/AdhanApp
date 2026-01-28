import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import useThemeStore, { ThemeMode } from "@/stores/useThemeStore";
import { useIsDark } from "@/components/useColorScheme";

interface ThemeOption {
  id: ThemeMode;
  nameKey: string;
  descriptionKey: string;
  icon: MaterialIconName;
}

const THEMES: ThemeOption[] = [
  {
    id: "light",
    nameKey: "theme.light",
    descriptionKey: "theme.lightDesc",
    icon: "light-mode",
  },
  {
    id: "dark",
    nameKey: "theme.dark",
    descriptionKey: "theme.darkDesc",
    icon: "dark-mode",
  },
  {
    id: "system",
    nameKey: "theme.system",
    descriptionKey: "theme.systemDesc",
    icon: "settings-suggest",
  },
];

export default function ThemeScreen() {
  const { t } = useTranslation();
  const { mode: themeMode, setMode } = useThemeStore();
  const isDark = useIsDark();

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
              {t("theme.title")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("theme.subtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.2)" }}
          >
            <MaterialIconsRound name="palette" size={26} color="#F59E0B" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingVertical: 24,
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Options de thème */}
        <View className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark">
          {THEMES.map((theme, index) => {
            const isSelected = themeMode === theme.id;
            return (
              <Pressable
                key={theme.id}
                onPress={() => setMode(theme.id)}
                className="flex-row items-center justify-between p-4"
                style={{
                  borderBottomWidth: index < THEMES.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? "#334155" : "#F1F5F9",
                  backgroundColor: isSelected
                    ? isDark
                      ? "#422006"
                      : "#FEF3C7"
                    : "transparent",
                }}
              >
                <View className="flex-row items-center gap-3.5">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? "#78350F"
                          : "#FDE68A"
                        : isDark
                          ? "#334155"
                          : "#F1F5F9",
                    }}
                  >
                    <MaterialIconsRound
                      name={theme.icon}
                      size={24}
                      color={
                        isSelected ? "#F59E0B" : isDark ? "#94A3B8" : "#64748B"
                      }
                    />
                  </View>
                  <Text
                    className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                    style={{ fontSize: 16 }}
                  >
                    {t(theme.nameKey)}
                  </Text>
                </View>

                {isSelected && (
                  <View className="w-7 h-7 rounded-full bg-accent items-center justify-center">
                    <MaterialIconsRound name="check" size={18} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Preview */}
        <Text
          className="text-text-primary-light dark:text-text-primary-dark font-outfit-bold mt-8 mb-4"
          style={{ fontSize: 18 }}
        >
          {t("theme.preview")}
        </Text>

        <View className="flex-row gap-4">
          {/* Light preview */}
          <View
            className="flex-1 bg-white rounded-2xl p-4"
            style={{
              borderWidth: 2,
              borderColor: themeMode === "light" ? "#F59E0B" : "#E2E8F0",
            }}
          >
            <View className="w-full h-6 bg-primary rounded-md mb-2" />
            <View
              className="w-[70%] h-3 rounded mb-1.5"
              style={{ backgroundColor: "#E2E8F0" }}
            />
            <View
              className="w-[50%] h-3 rounded"
              style={{ backgroundColor: "#E2E8F0" }}
            />
            <Text
              className="text-text-secondary-light font-outfit-medium text-center mt-3"
              style={{ fontSize: 12 }}
            >
              {t("theme.light")}
            </Text>
          </View>

          {/* Dark preview */}
          <View
            className="flex-1 rounded-2xl p-4"
            style={{
              backgroundColor: "#1E293B",
              borderWidth: 2,
              borderColor: themeMode === "dark" ? "#F59E0B" : "#334155",
            }}
          >
            <View className="w-full h-6 bg-primary rounded-md mb-2" />
            <View
              className="w-[70%] h-3 rounded mb-1.5"
              style={{ backgroundColor: "#334155" }}
            />
            <View
              className="w-[50%] h-3 rounded"
              style={{ backgroundColor: "#334155" }}
            />
            <Text
              className="font-outfit-medium text-center mt-3"
              style={{ fontSize: 12, color: "#94A3B8" }}
            >
              {t("theme.dark")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
