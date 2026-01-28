import { View, ViewStyle } from "react-native";
import useThemeColors from "@/hooks/useThemeColors";
import { borderRadius as br, spacing } from "@/constants/theme";

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  radius?: number;
}

export default function AppCard({
  children,
  style,
  padding = spacing.lg,
  radius = br.xl,
}: AppCardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius,
          padding,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
