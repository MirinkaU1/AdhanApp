import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import AppButton from "@/components/ui/AppButton";
import { palette } from "@/constants/theme";

type AlertDialogButton = {
  text: string;
  onPress?: () => void;
  style?: "default" | "destructive" | "primary";
};

type AlertDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  icon?: MaterialIconName;
  iconColor?: string;
  buttons?: AlertDialogButton[];
  onDismiss?: () => void;
};

export default function AlertDialog({
  visible,
  title,
  message,
  icon,
  iconColor,
  buttons,
  onDismiss,
}: AlertDialogProps) {
  const { t } = useTranslation();

  // Bouton par défaut avec traduction i18n
  const resolvedButtons = buttons ?? [
    { text: t("common.ok"), style: "default" as const },
  ];

  const handleButtonPress = (button: AlertDialogButton) => {
    button.onPress?.();
    onDismiss?.();
  };

  const getButtonVariant = (
    style?: string,
  ): "primary" | "outline" | "danger" => {
    switch (style) {
      case "destructive":
        return "danger";
      case "primary":
        return "primary";
      default:
        return "outline";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={onDismiss}
      >
        <Pressable className="w-[85%] max-w-[400px]" onPress={() => {}}>
          <View className="bg-white dark:bg-slate-800 rounded-[20px] p-6 border border-border-light dark:border-border-dark shadow-lg">
            {/* Icône optionnelle */}
            {icon && (
              <View
                className="w-16 h-16 rounded-full items-center justify-center self-center mb-4"
                style={{
                  backgroundColor: iconColor
                    ? `${iconColor}15`
                    : palette.success.light,
                }}
              >
                <MaterialIconsRound
                  name={icon}
                  size={32}
                  color={iconColor || palette.success.main}
                />
              </View>
            )}

            {/* Titre */}
            <Text
              className={`text-xl font-outfit-bold text-center text-text-primary-light dark:text-text-primary-dark ${icon ? "mb-2" : "mb-3"}`}
            >
              {title}
            </Text>

            {/* Message */}
            {message && (
              <Text className="text-[15px] font-outfit-regular text-center leading-[22px] mb-6 text-text-secondary-light dark:text-text-secondary-dark">
                {message}
              </Text>
            )}

            {/* Boutons */}
            <View className="flex-row gap-3">
              {resolvedButtons.map((button, index) => (
                <AppButton
                  key={index}
                  title={button.text}
                  onPress={() => handleButtonPress(button)}
                  variant={getButtonVariant(button.style)}
                  size="sm"
                  fullWidth={false}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
