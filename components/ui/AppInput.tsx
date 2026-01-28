import { useState } from "react";
import { View, Text, TextInput, Pressable, TextInputProps } from "react-native";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import useThemeColors from "@/hooks/useThemeColors";
import { fonts, fontSizes, borderRadius, spacing } from "@/constants/theme";

interface AppInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  icon?: MaterialIconName;
  error?: string;
  isPassword?: boolean;
  containerStyle?: object;
}

export default function AppInput({
  label,
  icon,
  error,
  isPassword = false,
  containerStyle,
  ...textInputProps
}: AppInputProps) {
  const colors = useThemeColors();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={{
            fontSize: fontSizes.sm,
            fontFamily: fonts.bold,
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: spacing.sm,
            marginLeft: spacing.xs,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.input,
          borderRadius: borderRadius.xl,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.inputBorder,
          paddingHorizontal: spacing.lg,
          height: 64, // Augmenté à 64px pour matcher le bouton
        }}
      >
        {icon && (
          <MaterialIconsRound
            name={icon}
            size={24}
            color={colors.placeholder}
          />
        )}
        <TextInput
          style={{
            flex: 1,
            height: "100%",
            paddingHorizontal: icon ? spacing.md : 0,
            fontSize: fontSizes.lg,
            fontFamily: fonts.medium,
            color: colors.textPrimary,
          }}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isPassword && !showPassword}
          {...textInputProps}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: spacing.xs }}
          >
            <MaterialIconsRound
              name={showPassword ? "visibility" : "visibility-off"}
              size={24}
              color={colors.placeholder}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Outfit_500Medium",
            color: "#EF4444",
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
