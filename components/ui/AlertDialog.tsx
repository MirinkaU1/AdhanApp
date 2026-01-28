import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import AppButton from "@/components/ui/AppButton";
import useThemeColors from "@/hooks/useThemeColors";
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
  icon?: keyof typeof MaterialIconsRound.glyphMap;
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
  buttons = [{ text: "OK", style: "default" }],
  onDismiss,
}: AlertDialogProps) {
  const colors = useThemeColors();

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
      <Pressable style={styles.overlay} onPress={onDismiss} activeOpacity={1}>
        <Pressable style={styles.dialogContainer} onPress={() => {}}>
          <View
            style={[
              styles.dialog,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* Icône optionnelle */}
            {icon && (
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: iconColor
                      ? `${iconColor}15`
                      : palette.success.light,
                  },
                ]}
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
              style={[
                styles.title,
                { color: colors.textPrimary },
                !icon && styles.titleNoIcon,
              ]}
            >
              {title}
            </Text>

            {/* Message */}
            {message && (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>
            )}

            {/* Boutons */}
            <View style={styles.buttonsContainer}>
              {buttons.map((button, index) => (
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialogContainer: {
    width: "85%",
    maxWidth: 400,
  },
  dialog: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Outfit_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  titleNoIcon: {
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
});
