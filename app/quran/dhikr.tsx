import { useState } from "react";
import { Pressable, Text, View, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText, AppCard } from "@/components/ui";
import { TasbihArc, DhikrSettingsDrawer } from "@/components/quran/dhikr";
import useDhikrStore, { DHIKR_OPTIONS } from "@/stores/useDhikrStore";
import { router } from "expo-router";

export default function DhikrScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const [showSettings, setShowSettings] = useState(false);

  const {
    count,
    target,
    currentDhikr,
    completedCycles,
    totalLifetimeCount,
    reset,
    setDhikr,
    setTarget,
  } = useDhikrStore();

  const currentDhikrOption = DHIKR_OPTIONS.find(
    (d) => d.value === currentDhikr,
  );

  const currentRound = completedCycles + 1;

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header avec gradient */}
      <View
        className="rounded-b-4xl overflow-hidden"
        style={{ minHeight: 180 }}
      >
        <LinearGradient
          colors={["#115E59", "#0d4542"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1590076215667-875c7c12ab3c?w=800&q=80",
          }}
          style={[StyleSheet.absoluteFill, { opacity: 0.06 }]}
          resizeMode="cover"
        />

        {/* Navigation */}
        <View className="pt-14 px-6 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <MaterialIconsRound name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <MaterialIconsRound name="tune" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Titre et Dhikr actuel */}
        <View className="px-6 pb-6 pt-2">
          <AppText
            variant="caption"
            className="text-white/60 uppercase tracking-wider mb-1"
          >
            {currentDhikrOption?.label}
          </AppText>

          <Text
            className="text-3xl text-white"
            style={{ fontFamily: "Amiri_700Bold" }}
          >
            {currentDhikrOption?.arabic}
          </Text>
        </View>
      </View>

      {/* Carte compteur */}
      <View className="px-4 -mt-6 mb-4">
        <AppCard className="p-4">
          <View className="flex-row items-center justify-between">
            {/* Compteur principal */}
            <View className="flex-row items-baseline gap-1">
              <Text
                className="text-5xl font-outfit-bold"
                style={{ color: isDark ? "#F1F5F9" : "#1E293B" }}
              >
                {count}
              </Text>
              <Text
                className="text-xl font-outfit-regular"
                style={{ color: isDark ? "#64748B" : "#94A3B8" }}
              >
                /{target === 0 ? "∞" : target}
              </Text>
            </View>

            {/* Bouton Reset uniquement */}
            <Pressable
              onPress={reset}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
              }}
            >
              <MaterialIconsRound
                name="refresh"
                size={22}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </Pressable>
          </View>

          {/* Stats */}
          <View className="flex-row items-center gap-6 mt-3 pt-3 border-t border-border-light dark:border-border-dark">
            <View className="flex-row items-center gap-2">
              <MaterialIconsRound
                name="loop"
                size={16}
                color={isDark ? "#64748B" : "#94A3B8"}
              />
              <AppText
                variant="caption"
                className="text-text-secondary-light dark:text-text-secondary-dark"
              >
                {t("dhikr.round")}:{" "}
                {currentRound < 10 ? `0${currentRound}` : currentRound}
              </AppText>
            </View>
            <View className="flex-row items-center gap-2">
              <MaterialIconsRound
                name="tag"
                size={16}
                color={isDark ? "#64748B" : "#94A3B8"}
              />
              <AppText
                variant="caption"
                className="text-text-secondary-light dark:text-text-secondary-dark"
              >
                Total: {totalLifetimeCount}
              </AppText>
            </View>
          </View>
        </AppCard>
      </View>

      {/* Tasbih Arc - Zone principale interactive */}
      <View className="flex-1">
        <TasbihArc />
      </View>

      {/* Drawer des paramètres */}
      <DhikrSettingsDrawer
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        currentDhikr={currentDhikr}
        setDhikr={setDhikr}
        target={target}
        setTarget={setTarget}
      />
    </View>
  );
}
