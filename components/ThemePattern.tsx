/**
 * ThemePattern — rendu SVG d'un motif de thème en arrière-plan
 *
 * Utilise react-native-svg Pattern (tiling) pour remplir une zone
 * rectangulaire avec un motif répété selon le type configuré dans AppTheme.
 */
import React, { useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Defs, Pattern, Rect, Circle, Line, Path } from "react-native-svg";
import type { AppThemePattern, PatternType } from "@/constants/appThemes";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Génère le path SVG d'une étoile à N branches. */
function buildStarPath(size: number, points: number = 8): string {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.38;
  const innerR = size * 0.16;
  let d = "";
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = (cx + r * Math.cos(angle)).toFixed(2);
    const y = (cy + r * Math.sin(angle)).toFixed(2);
    d += (i === 0 ? "M" : "L") + `${x},${y} `;
  }
  return d + "Z";
}

/** Contenu SVG placé dans le <Pattern> selon le type. */
function PatternContent({
  type,
  size,
  color,
}: {
  type: PatternType;
  size: number;
  color: string;
}) {
  const half = size / 2;

  switch (type) {
    case "dots":
      return <Circle cx={half} cy={half} r={size * 0.1} fill={color} />;

    case "lines":
      // Diagonales /
      return (
        <>
          <Line
            x1={0}
            y1={size}
            x2={size}
            y2={0}
            stroke={color}
            strokeWidth={0.8}
          />
          {/* Répétition décalée pour couvrir les bords */}
          <Line
            x1={-size}
            y1={size}
            x2={0}
            y2={0}
            stroke={color}
            strokeWidth={0.8}
          />
          <Line
            x1={size}
            y1={size * 2}
            x2={size * 2}
            y2={size}
            stroke={color}
            strokeWidth={0.8}
          />
        </>
      );

    case "diamonds":
      // Losange (diamond outline)
      return (
        <Path
          d={`M${half} ${size * 0.06} L${size * 0.94} ${half} L${half} ${size * 0.94} L${size * 0.06} ${half} Z`}
          stroke={color}
          strokeWidth={0.8}
          fill="none"
        />
      );

    case "stars":
      // Étoile à 8 branches
      return <Path d={buildStarPath(size, 8)} fill={color} />;

    case "lattice":
      // Quadrillage croisé avec diagonales légères (style moucharabieh)
      return (
        <>
          {/* Croix principale */}
          <Line
            x1={half}
            y1={0}
            x2={half}
            y2={size}
            stroke={color}
            strokeWidth={0.8}
          />
          <Line
            x1={0}
            y1={half}
            x2={size}
            y2={half}
            stroke={color}
            strokeWidth={0.8}
          />
          {/* Diagonales fines */}
          <Line
            x1={0}
            y1={0}
            x2={size}
            y2={size}
            stroke={color}
            strokeWidth={0.35}
          />
          <Line
            x1={size}
            y1={0}
            x2={0}
            y2={size}
            stroke={color}
            strokeWidth={0.35}
          />
        </>
      );

    default:
      return null;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

interface ThemePatternProps {
  pattern: AppThemePattern;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}

export function ThemePattern({
  pattern,
  width,
  height,
  style,
}: ThemePatternProps) {
  const { type, opacity, color = "#ffffff", scale = 1 } = pattern;
  const size = 20 * scale;
  // ID stable, pas besoin d'être globalement unique (scope = ce SVG)
  const patternId = "p";

  const starD = useMemo(
    () => (type === "stars" ? buildStarPath(size, 8) : ""),
    [type, size],
  );

  // ── Cas SVG importé ────────────────────────────────────────────────────────
  if (type === "svg" && pattern.SvgComponent) {
    const { SvgComponent } = pattern;
    // Guard : react-native-svg-transformer doit retourner une fonction (composant React).
    // Si c'est un nombre (require statique non transformé), on ne rend rien pour éviter le crash.
    if (typeof SvgComponent !== "function") return null;

    // Comportement "cover" : on fixe uniquement la largeur du SVG pour qu'il
    // remplisse le conteneur horizontalement. La hauteur proportionnelle (ratio
    // viewBox ≈ 1.078 pour le motif hexagonal 1828×1971) déborde du conteneur
    // et est clippée par overflow:hidden. On translate verticalement pour centrer.
    const svgAspectRatio = pattern.svgAspectRatio ?? 1971.23 / 1828.76; // h/w
    const svgRenderWidth = width;
    const svgRenderHeight = width * svgAspectRatio;
    const offsetY = -(svgRenderHeight - height) / 2; // centre vertical

    return (
      <View
        style={[
          { position: "absolute", width, height, overflow: "hidden", opacity },
          style as any,
        ]}
      >
        <SvgComponent
          width={svgRenderWidth}
          height={svgRenderHeight}
          style={{ marginTop: offsetY }}
        />
      </View>
    );
  }

  // ── Motifs géométriques tuilés ─────────────────────────────────────────────
  return (
    <Svg
      width={width}
      height={height}
      opacity={opacity}
      style={[{ position: "absolute" }, style as any]}
    >
      <Defs>
        <Pattern
          id={patternId}
          x="0"
          y="0"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <PatternContent type={type} size={size} color={color} />
        </Pattern>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${patternId})`} />
    </Svg>
  );
}

export default ThemePattern;
