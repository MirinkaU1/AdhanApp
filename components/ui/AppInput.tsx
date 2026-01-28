import { useState } from "react";
import { View, Text, TextInput, Pressable, TextInputProps } from "react-native";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";

interface AppInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  icon?: MaterialIconName;
  error?: string;
  isPassword?: boolean;
  containerClassName?: string;
}

export default function AppInput({
  label,
  icon,
  error,
  isPassword = false,
  containerClassName = "",
  ...textInputProps
}: AppInputProps) {
  const isDark = useIsDark();
  const [showPassword, setShowPassword] = useState(false);

  // Couleurs dynamiques pour les éléments qui nécessitent des props inline
  const placeholderColor = isDark ? "#64748B" : "#94A3B8";
  const iconColor = isDark ? "#64748B" : "#94A3B8";
  const textColor = isDark ? "#F8FAFC" : "#1E293B";

  return (
    <View className={containerClassName}>
      {label && (
        <Text className="text-sm font-outfit-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest mb-2 ml-1">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-2xl border px-5 h-16 ${
          error
            ? "border-red-500"
            : "border-border-light dark:border-border-dark"
        }`}
      >
        {icon && <MaterialIconsRound name={icon} size={24} color={iconColor} />}
        <TextInput
          className={`flex-1 h-full text-lg font-outfit-medium text-text-primary-light dark:text-text-primary-dark ${icon ? "px-3" : ""}`}
          placeholderTextColor={placeholderColor}
          secureTextEntry={isPassword && !showPassword}
          style={{ color: textColor }}
          {...textInputProps}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1"
          >
            <MaterialIconsRound
              name={showPassword ? "visibility" : "visibility-off"}
              size={24}
              color={iconColor}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="text-xs font-outfit-medium text-red-500 mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
