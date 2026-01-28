import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  ViewStyle,
  StyleProp,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import useThemeColors from "@/hooks/useThemeColors";
import { fonts, borderRadius, palette } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: MaterialIconName;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: AppButtonProps) {
  const colors = useThemeColors();

  // Tailles "Chunky" - Hauteur et texte généreux
  const sizes: Record<
    ButtonSize,
    {
      height: number;
      fontSize: number;
      iconSize: number;
      paddingHorizontal: number;
    }
  > = {
    sm: { height: 48, fontSize: 14, iconSize: 18, paddingHorizontal: 20 },
    md: { height: 64, fontSize: 16, iconSize: 24, paddingHorizontal: 28 }, // Standard 64px
    lg: { height: 72, fontSize: 18, iconSize: 26, paddingHorizontal: 32 }, // Large 72px
  };

  const { height, fontSize, iconSize, paddingHorizontal } = sizes[size];

  // Couleurs selon variant
  const getVariantColors = () => {
    switch (variant) {
      case "primary":
        return {
          gradient: [colors.primary, colors.primaryDark] as const,
          text: palette.white,
          border: "transparent",
        };
      case "secondary":
        return {
          gradient: [colors.accent, colors.accentDark] as const,
          text: palette.white,
          border: "transparent",
        };
      case "outline":
        return {
          bg: "transparent",
          text: colors.isDark ? palette.teal[300] : colors.primary,
          border: colors.isDark ? palette.teal[300] : colors.primary,
        };
      case "ghost":
        return {
          bg: "transparent",
          text: colors.textSecondary,
          border: "transparent",
        };
      case "danger":
        return {
          gradient: [palette.error.main, palette.error.dark] as const,
          text: palette.white,
          border: "transparent",
        };
      default:
        return {
          gradient: [colors.primary, colors.primaryDark] as const,
          text: palette.white,
          border: "transparent",
        };
    }
  };

  const variantColors = getVariantColors();
  const hasGradient = "gradient" in variantColors;

  // Extrait les margins du style props pour les appliquer au container externe
  // Le reste du style pourrait être appliqué à l'intérieur, mais pour la simplicité, on applique tout au container externe

  // Style de l'enveloppe externe (Gère la position et la taille)
  const outerContainerStyle: StyleProp<ViewStyle> = [
    {
      height: height,
      width: fullWidth ? "100%" : undefined,
      borderRadius: borderRadius.xl,
      overflow: "hidden", // Important pour que le ripple/gradient ne dépasse pas
    },
    style, // Applique les marges, etc. ici
  ];

  // Contenu (texte + icônes)
  const renderContent = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingHorizontal: paddingHorizontal,
        width: "100%",
        height: "100%",
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantColors.text} />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <MaterialIconsRound
              name={icon}
              size={iconSize}
              color={variantColors.text}
            />
          )}
          <Text
            style={{
              fontSize: fontSize,
              fontFamily: fonts.semiBold,
              color: variantColors.text,
              textAlign: "center",
              includeFontPadding: false,
            }}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <MaterialIconsRound
              name={icon}
              size={iconSize}
              color={variantColors.text}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={outerContainerStyle}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => ({
          height: height,
          width: "100%",
          opacity: disabled || loading ? 0.6 : 1, // Gestion simple de l'état désactivé
        })}
      >
        {({ pressed }) => (
          <>
            {hasGradient ? (
              <LinearGradient
                colors={variantColors.gradient!}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  height: height,
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {renderContent()}
                {/* Overlay pour effet "enfoncé/assombri" */}
                {pressed && (
                  <View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      backgroundColor: "black",
                      opacity: 0.15,
                    }}
                  />
                )}
              </LinearGradient>
            ) : (
              <View
                style={{
                  height: height,
                  width: "100%",
                  backgroundColor:
                    "bg" in variantColors ? variantColors.bg : undefined,
                  borderColor:
                    "border" in variantColors
                      ? variantColors.border
                      : undefined,
                  borderWidth:
                    "border" in variantColors &&
                    variantColors.border !== "transparent"
                      ? 1.5
                      : 0,
                  borderRadius: borderRadius.xl, // Ajout crucial pour que la bordure suive l'arrondi
                  justifyContent: "center",
                }}
              >
                {renderContent()}
                {/* Overlay pour effet "enfoncé/assombri" */}
                {pressed && (
                  <View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      backgroundColor: "black",
                      opacity: 0.1, // Un peu plus léger pour les boutons outline/ghost
                    }}
                  />
                )}
              </View>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
}
