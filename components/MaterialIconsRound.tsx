import { MaterialIcons } from "@expo/vector-icons";
import { Platform, Text, TextStyle } from "react-native";

export type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

type Props = {
  name: MaterialIconName;
  size?: number;
  color?: string;
  style?: TextStyle;
};

export default function MaterialIconsRound({
  name,
  size = 24,
  color = "#000",
  style,
}: Props) {
  if (Platform.OS === "web") {
    const ligature = name.replace(/-/g, "_");
    return (
      <Text
        style={[
          {
            fontFamily: "Material Icons Round",
            fontSize: size,
            color,
            lineHeight: size + 2,
            includeFontPadding: false,
          },
          style,
        ]}
      >
        {ligature}
      </Text>
    );
  }

  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}
