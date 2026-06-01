import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import AppDrawer from "./AppDrawer";

export type GenderOptionValue = "male" | "female" | "not_specified";

interface GenderDrawerProps {
  visible: boolean;
  onClose: () => void;
  selectedGender: GenderOptionValue | null;
  onSelectGender: (gender: GenderOptionValue) => void;
  title?: string;
  subtitle?: string;
}

export default function GenderDrawer({
  visible,
  onClose,
  selectedGender,
  onSelectGender,
  title,
  subtitle,
}: GenderDrawerProps) {
  const { t } = useTranslation();

  const options: Array<{
    value: GenderOptionValue;
    label: string;
    icon: string;
  }> = [
    {
      value: "male",
      label: t("settings.genderMale"),
      icon: "man",
    },
    {
      value: "female",
      label: t("settings.genderFemale"),
      icon: "woman",
    },
    {
      value: "not_specified",
      label: t("settings.genderNotSpecified"),
      icon: "person-outline",
    },
  ];

  if (!visible) return null;

  return (
    <AppDrawer
      visible={visible}
      onClose={onClose}
      title={title || t("settings.gender")}
      subtitle={subtitle || t("settings.genderDrawerSubtitle")}
      maxHeight="50%"
      scrollable={false}
      contentContainerClassName="gap-2"
    >
      {options.map((option) => {
        const isSelected = selectedGender === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => {
              onSelectGender(option.value);
              onClose();
            }}
            className="flex-row items-center gap-3 px-4 py-3 rounded-xl border"
            style={{
              borderColor: isSelected ? "#D97706" : "#CBD5E1",
              backgroundColor: isSelected
                ? "rgba(217,119,6,0.10)"
                : "transparent",
            }}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{
                backgroundColor: isSelected
                  ? "rgba(217,119,6,0.15)"
                  : "rgba(148,163,184,0.12)",
              }}
            >
              <MaterialIconsRound
                name={option.icon as any}
                size={20}
                color={isSelected ? "#B45309" : "#64748B"}
              />
            </View>

            <Text
              className="flex-1 font-outfit-medium"
              style={{
                fontSize: 15,
                color: isSelected ? "#B45309" : "#334155",
              }}
            >
              {option.label}
            </Text>

            {isSelected ? (
              <MaterialIconsRound
                name="check-circle"
                size={20}
                color="#D97706"
              />
            ) : null}
          </Pressable>
        );
      })}
    </AppDrawer>
  );
}
