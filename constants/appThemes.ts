import React from "react";
import Pattern1 from "@/assets/images/paterns/patern1.svg";

export type PatternType =
  | "dots"
  | "lines"
  | "diamonds"
  | "stars"
  | "lattice"
  | "svg";

export interface AppThemePattern {
  type: PatternType;
  /** Overall opacity 0–1 */
  opacity: number;
  /** Stroke/fill color for geometric patterns, defaults to white */
  color?: string;
  /** Pattern cell size multiplier for geometric patterns, defaults to 1 */
  scale?: number;
  /**
   * Composant SVG importé via react-native-svg-transformer.
   * Utilisé uniquement quand type === "svg".
   * Accepte width / height / opacity comme props SVG standard.
   */
  SvgComponent?: React.ComponentType<{
    width?: number | string;
    height?: number | string;
    opacity?: number;
    style?: any;
  }>;
  /**
   * Ratio hauteur/largeur du viewBox SVG (h/w).
   * Utilisé par ThemePattern pour calculer le rendu "cover" sans distorsion.
   * Si absent, la valeur par défaut (1971.23/1828.76 ≈ 1.078) est utilisée.
   */
  svgAspectRatio?: number;
}

export type ThemeUnlock =
  | { type: "free" }
  | { type: "level"; level: number }
  | { type: "coins"; price: number }
  | { type: "event"; eventId: string; eventName: string };

export interface AppTheme {
  id: string;
  nameKey: string;
  descriptionKey: string;
  // Couleurs appliquées dynamiquement
  headerGradient: [string, string];
  primary: string;
  accent: string;
  // Pastilles de prévisualisation (3 couleurs)
  preview: [string, string, string];
  unlock: ThemeUnlock;
  pattern?: AppThemePattern;
}

export const APP_THEMES: AppTheme[] = [
  {
    id: "default",
    nameKey: "themes.default.name",
    descriptionKey: "themes.default.desc",
    headerGradient: ["#115E59", "#0d4542"],
    primary: "#0f766e",
    accent: "#D97706",
    preview: ["#115E59", "#0f766e", "#D97706"],
    unlock: { type: "free" },
  },
  {
    id: "ocean",
    nameKey: "themes.ocean.name",
    descriptionKey: "themes.ocean.desc",
    headerGradient: ["#1E3A8A", "#1e40af"],
    primary: "#1D4ED8",
    accent: "#0EA5E9",
    preview: ["#1E3A8A", "#1D4ED8", "#0EA5E9"],
    unlock: { type: "level", level: 3 },
    pattern: { type: "lines", opacity: 0.1, color: "#7DD3FC", scale: 1.2 },
  },
  {
    id: "forest",
    nameKey: "themes.forest.name",
    descriptionKey: "themes.forest.desc",
    headerGradient: ["#14532D", "#166534"],
    primary: "#15803D",
    accent: "#84CC16",
    preview: ["#14532D", "#15803D", "#84CC16"],
    unlock: { type: "level", level: 6 },
    pattern: { type: "diamonds", opacity: 0.08, color: "#86EFAC", scale: 1.0 },
  },
  {
    id: "sunset",
    nameKey: "themes.sunset.name",
    descriptionKey: "themes.sunset.desc",
    headerGradient: ["#7C2D12", "#9A3412"],
    primary: "#EA580C",
    accent: "#FBBF24",
    preview: ["#7C2D12", "#EA580C", "#FBBF24"],
    unlock: { type: "coins", price: 30 },
  },
  {
    id: "midnight",
    nameKey: "themes.midnight.name",
    descriptionKey: "themes.midnight.desc",
    headerGradient: ["#3B0764", "#4C1D95"],
    primary: "#7C3AED",
    accent: "#A855F7",
    preview: ["#3B0764", "#7C3AED", "#A855F7"],
    unlock: { type: "level", level: 10 },
    pattern: { type: "dots", opacity: 0.12, color: "#A78BFA", scale: 1.5 },
  },
  {
    id: "rose",
    nameKey: "themes.rose.name",
    descriptionKey: "themes.rose.desc",
    headerGradient: ["#881337", "#9F1239"],
    primary: "#E11D48",
    accent: "#FB7185",
    preview: ["#881337", "#E11D48", "#FB7185"],
    unlock: { type: "coins", price: 50 },
    pattern: { type: "lines", opacity: 0.09, color: "#FDA4AF", scale: 1.0 },
  },
  {
    id: "golden",
    nameKey: "themes.golden.name",
    descriptionKey: "themes.golden.desc",
    headerGradient: ["#78350F", "#92400E"],
    primary: "#B45309",
    accent: "#FCD34D",
    preview: ["#78350F", "#B45309", "#FCD34D"],
    unlock: { type: "coins", price: 40 },
    pattern: { type: "dots", opacity: 0.18, color: "#FCD34D", scale: 1.5 },
  },
  {
    id: "lattice",
    nameKey: "themes.lattice.name",
    descriptionKey: "themes.lattice.desc",
    headerGradient: ["#0C4A6E", "#0E7490"],
    primary: "#0369A1",
    accent: "#38BDF8",
    preview: ["#0C4A6E", "#0369A1", "#38BDF8"],
    unlock: { type: "coins", price: 60 },
    pattern: { type: "lattice", opacity: 0.15, color: "#7DD3FC", scale: 1.2 },
  },
  {
    id: "starnight",
    nameKey: "themes.starnight.name",
    descriptionKey: "themes.starnight.desc",
    headerGradient: ["#1E1B4B", "#2E1065"],
    primary: "#4338CA",
    accent: "#A5B4FC",
    preview: ["#1E1B4B", "#4338CA", "#A5B4FC"],
    unlock: { type: "level", level: 8 },
    pattern: { type: "stars", opacity: 0.2, color: "#C7D2FE", scale: 1.0 },
  },
  {
    id: "arabesque",
    nameKey: "themes.arabesque.name",
    descriptionKey: "themes.arabesque.desc",
    // Fond pierre sombre pour que le motif sable/ivoire ressorte
    headerGradient: ["#1C1917", "#292524"],
    primary: "#78716C",
    accent: "#D6B896",
    preview: ["#1C1917", "#78716C", "#D6B896"],
    // Thème exclusif Ramadan
    unlock: { type: "event", eventId: "ramadan", eventName: "Ramadan" },
    pattern: {
      type: "svg",
      opacity: 0.22,
      SvgComponent: Pattern1,
      // viewBox du SVG hexagonal : 1828.76 × 1971.23 → ratio h/w ≈ 1.078
      svgAspectRatio: 1971.23 / 1828.76,
    },
  },
];

export const DEFAULT_THEME = APP_THEMES[0];

export function getThemeById(id: string): AppTheme {
  return APP_THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

// IDs toujours débloqués sans condition
export const FREE_THEME_IDS = APP_THEMES.filter(
  (t) => t.unlock.type === "free",
).map((t) => t.id);
