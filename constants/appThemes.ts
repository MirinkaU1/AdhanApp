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
