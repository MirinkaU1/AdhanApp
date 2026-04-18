import React from "react";
import { View, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText } from "@/components/ui";
import AppDrawer from "@/components/ui/AppDrawer";
import { DHIKR_OPTIONS, DhikrType, TargetCount } from "@/stores/useDhikrStore";

interface DhikrSettingsDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  currentDhikr: DhikrType;
  setDhikr: (dhikr: DhikrType) => void;
  target: TargetCount;
  setTarget: (target: TargetCount) => void;
}

const TARGET_OPTIONS: { label: string; value: TargetCount }[] = [
  { label: "33", value: 33 },
  { label: "99", value: 99 },
  { label: "∞", value: 0 },
];

export default function DhikrSettingsDrawer({
  isVisible,
  onClose,
  currentDhikr,
  setDhikr,
  target,
  setTarget,
}: DhikrSettingsDrawerProps) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();

  return (
    <AppDrawer
      visible={isVisible}
      onClose={onClose}
      title={t("dhikr.settings")}
      subtitle={t("dhikr.settingsSubtitle")}
      maxHeight="75%"
      showHandle={true}
      showCloseButton={true}
      closeButtonText={t("common.done")}
    >
      <View className="py-4">
        {/* Section : Type de Dhikr */}
        <View className="mb-6">
          <AppText
            variant="label"
            className="text-text-secondary-light dark:text-text-secondary-dark mb-3 uppercase tracking-wider"
          >
            {t("dhikr.selectDhikr")}
          </AppText>

          <View className="gap-2">
            {DHIKR_OPTIONS.map((option) => {
              const isSelected = option.value === currentDhikr;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setDhikr(option.value)}
                  className="flex-row items-center p-4 rounded-2xl"
                  style={{
                    backgroundColor: isSelected
                      ? isDark
                        ? "rgba(17, 94, 89, 0.3)"
                        : "rgba(17, 94, 89, 0.1)"
                      : isDark
                        ? "#1E293B"
                        : "#F8FAFC",
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected
                      ? appTheme.primary
                      : isDark
                        ? "#334155"
                        : "#E2E8F0",
                  }}
                >
                  <View className="flex-1">
                    <Text
                      className="text-lg mb-1"
                      style={{
                        fontFamily: "Amiri_700Bold",
                        color: isDark ? "#F1F5F9" : "#1E293B",
                      }}
                    >
                      {option.arabic}
                    </Text>
                    <AppText
                      variant="caption"
                      className="text-text-secondary-light dark:text-text-secondary-dark"
                    >
                      {option.label}
                    </AppText>
                  </View>
                  {isSelected && (
                    <MaterialIconsRound
                      name="check-circle"
                      size={24}
                      color={appTheme.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section : Objectif */}
        <View>
          <AppText
            variant="label"
            className="text-text-secondary-light dark:text-text-secondary-dark mb-3 uppercase tracking-wider"
          >
            {t("dhikr.selectTarget")}
          </AppText>

          <View className="flex-row gap-3">
            {TARGET_OPTIONS.map((option) => {
              const isSelected = option.value === target;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setTarget(option.value)}
                  className="flex-1 py-4 rounded-2xl items-center"
                  style={{
                    backgroundColor: isSelected
                      ? appTheme.primary
                      : isDark
                        ? "#1E293B"
                        : "#F8FAFC",
                    borderWidth: 1,
                    borderColor: isSelected
                      ? appTheme.primary
                      : isDark
                        ? "#334155"
                        : "#E2E8F0",
                  }}
                >
                  <AppText
                    variant="h3"
                    className={isSelected ? "text-white" : ""}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </AppDrawer>
  );
}
