export type PatternType = "dots" | "lines" | "diamonds" | "stars" | "lattice";

export interface AppThemePattern {
  type: PatternType;
  /** Overall opacity 0–1 */
  opacity: number;
  /** Stroke/fill color, defaults to white */
  color?: string;
  /** Pattern cell size multiplier, defaults to 1 */
  scale?: number;
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
    nameKey: "themes.default.name" as const,
    descriptionKey: "themes.default.desc" as const,
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
    pattern: { type: "lines", opacity: 0.10, color: "#7DD3FC", scale: 1.2 },
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
    headerGradient: ["#78350F", "#92400E"] as [string, string],
    primary: "#B45309",
    accent: "#FCD34D",
    preview: ["#78350F", "#B45309", "#FCD34D"] as [string, string, string],
    unlock: { type: "coins" as const, price: 40 },
    pattern: { type: "dots" as PatternType, opacity: 0.18, color: "#FCD34D", scale: 1.5 },
  },
  {
    id: "lattice",
    nameKey: "themes.lattice.name",
    descriptionKey: "themes.lattice.desc",
    headerGradient: ["#0C4A6E", "#0E7490"] as [string, string],
    primary: "#0369A1",
    accent: "#38BDF8",
    preview: ["#0C4A6E", "#0369A1", "#38BDF8"] as [string, string, string],
    unlock: { type: "coins" as const, price: 60 },
    pattern: { type: "lattice" as PatternType, opacity: 0.15, color: "#7DD3FC", scale: 1.2 },
  },
  {
    id: "starnight",
    nameKey: "themes.starnight.name",
    descriptionKey: "themes.starnight.desc",
    headerGradient: ["#1E1B4B", "#2E1065"] as [string, string],
    primary: "#4338CA",
    accent: "#A5B4FC",
    preview: ["#1E1B4B", "#4338CA", "#A5B4FC"] as [string, string, string],
    unlock: { type: "level" as const, level: 8 },
    pattern: { type: "stars" as PatternType, opacity: 0.20, color: "#C7D2FE", scale: 1.0 },
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
