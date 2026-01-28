/**
 * Système de thème centralisé pour MaPrière
 * Contient les couleurs, fonts, spacing et autres tokens de design
 */

// Palette de couleurs de base
export const palette = {
  // Teal (couleur principale)
  teal: {
    50: "#F0FDFA",
    100: "#CCFBF1",
    200: "#99F6E4",
    300: "#5EEAD4",
    400: "#2DD4BF",
    500: "#14B8A6",
    600: "#0D9488",
    700: "#0F766E",
    800: "#115E59",
    900: "#134E4A",
    dark: "#115E59",
    deep: "#0d4542",
  },

  // Amber (couleur accent)
  amber: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },

  // Slate (gris neutre)
  slate: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },

  // Couleurs sémantiques
  success: {
    light: "#DCFCE7",
    main: "#22C55E",
    dark: "#15803D",
  },
  error: {
    light: "#FEF2F2",
    main: "#EF4444",
    dark: "#DC2626",
  },
  warning: {
    light: "#FEF9C3",
    main: "#EAB308",
    dark: "#CA8A04",
  },
  info: {
    light: "#EFF6FF",
    main: "#3B82F6",
    dark: "#1E40AF",
  },

  // Autres
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // Purple (pour les accents secondaires comme les notifications)
  purple: {
    50: "#FAF5FF",
    100: "#F3E8FF",
    200: "#E9D5FF",
    400: "#C084FC",
    500: "#A855F7",
    600: "#9333EA",
  },
};

// Couleurs du thème clair
export const lightColors = {
  // Backgrounds
  bg: palette.slate[100],
  bgAlt: palette.white,
  card: palette.white,
  input: palette.slate[100],
  inputBorder: palette.slate[200],
  inputBorderFocus: palette.teal[600],

  // Textes
  textPrimary: palette.slate[800],
  textSecondary: palette.slate[500],
  textMuted: palette.slate[400],
  placeholder: palette.slate[400],

  // Borders & Dividers
  border: palette.slate[100],
  divider: palette.slate[200],

  // Accents
  primary: palette.teal.dark,
  primaryDark: palette.teal.deep,
  accent: palette.amber[600],
  accentDark: palette.amber[700],

  // Status
  success: palette.success.main,
  successBg: palette.success.light,
  error: palette.error.main,
  errorBg: palette.error.light,
  errorText: palette.error.dark,
  warning: palette.warning.main,
  warningBg: palette.warning.light,
  info: palette.info.main,
  infoBg: palette.info.light,
  infoText: palette.info.dark,

  // Spéciaux
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: palette.slate[900],
  purple: palette.purple[500],
  purpleBg: palette.purple[100],
};

// Couleurs du thème sombre
export const darkColors = {
  // Backgrounds
  bg: palette.slate[900],
  bgAlt: palette.slate[800],
  card: palette.slate[800],
  input: palette.slate[700],
  inputBorder: palette.slate[600],
  inputBorderFocus: palette.teal[400],

  // Textes
  textPrimary: palette.slate[50],
  textSecondary: palette.slate[400],
  textMuted: palette.slate[500],
  placeholder: palette.slate[500],

  // Borders & Dividers
  border: palette.slate[700],
  divider: palette.slate[700],

  // Accents
  primary: palette.teal.dark,
  primaryDark: palette.teal.deep,
  accent: palette.amber[600],
  accentDark: palette.amber[700],

  // Status
  success: palette.success.main,
  successBg: "#052E16",
  error: palette.error.main,
  errorBg: "#451A1A",
  errorText: "#FCA5A5",
  warning: palette.warning.main,
  warningBg: "#422006",
  info: palette.info.main,
  infoBg: "#1E3A5F",
  infoText: "#93C5FD",

  // Spéciaux
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: palette.black,
  purple: palette.purple[500],
  purpleBg: palette.slate[700],
};

// Typographie
export const fonts = {
  light: "Outfit_300Light",
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semiBold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
};

// Tailles de police
export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  "2xl": 20,
  "3xl": 24,
  "4xl": 28,
  "5xl": 32,
  "6xl": 36,
};

// Espacements
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 28,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
};

// Border radius
export const borderRadius = {
  sm: 6,
  md: 8,
  base: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 40,
  full: 9999,
};

// Ombres
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  accent: {
    shadowColor: palette.amber[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Type pour les couleurs
export type ThemeColors = typeof lightColors;
