import { View, Text } from "react-native";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import useThemeColors from "@/hooks/useThemeColors";
import { fonts, fontSizes, borderRadius, spacing } from "@/constants/theme";

interface ErrorMessageProps {
  message: string;
  style?: object;
}

export default function ErrorMessage({ message, style }: ErrorMessageProps) {
  const colors = useThemeColors();

  if (!message) return null;

  return (
    <View
      style={[
        {
          backgroundColor: colors.errorBg,
          borderRadius: borderRadius.base,
          padding: spacing.md + 2,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm + 2,
        },
        style,
      ]}
    >
      <MaterialIconsRound name="error" size={20} color={colors.error} />
      <Text
        style={{
          flex: 1,
          fontSize: fontSizes.md,
          fontFamily: fonts.medium,
          color: colors.errorText,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
