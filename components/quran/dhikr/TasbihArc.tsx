import { useEffect, useMemo } from "react";
import { Pressable, Dimensions } from "react-native";
import Svg, {
  Circle,
  Ellipse,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Path,
  G,
  ClipPath,
  Rect,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedProps,
  interpolate,
  Extrapolation,
  SharedValue,
  Easing,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import useDhikrStore from "@/stores/useDhikrStore";

const { width } = Dimensions.get("window");

// Configuration
const BEAD_SIZE = 42;
const BEAD_RADIUS = BEAD_SIZE / 2;
const VISIBLE_BEADS = Math.max(13, Math.floor(width / 38)); // Plus de perles pour fluidité
const SVG_HEIGHT = 300;
const SVG_WIDTH = width;

// Arc diagonal naturel avec plus de courbure
const ARC_START_X = -80;
const ARC_START_Y = 270;
const ARC_END_X = width + 20;
const ARC_END_Y = 90;
const ARC_CONTROL_X = width * 0.48;
const ARC_CONTROL_Y = 340; // Plus de courbure pour effet 3D

// Gap au centre pour le pouce
const GAP_SIZE = 0.05;
const CENTER_T = 0.58;
const SPACING = 0.07; // Espacement réduit pour mouvement plus fluide

// Ratio 3D pour les ellipses
const BEAD_3D_RATIO = 0.55;

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Couleur des perles (bois naturel amélioré avec plus de variété)
const BEAD_COLORS = {
  light: "#E8C9A0",
  lightMid: "#D4A878",
  mid: "#B89968",
  darkMid: "#9B7E52",
  dark: "#7A5E35",
  shadow: "#3D2817",
  highlight: "#F5EDE4",
  rim: "#6B5344",
  gold: "#D4AF37",
};

export default function TasbihArc() {
  const { count, target, increment } = useDhikrStore();
  const progress = useSharedValue(0);
  const bounceValue = useSharedValue(0);
  const lastCount = useSharedValue(count);

  useEffect(() => {
    // Animation spring fluide et naturelle
    progress.value = withSpring(count, {
      damping: 25,
      stiffness: 120,
      mass: 0.7,
      overshootClamping: false,
    });

    // Effet de rebond subtil pour la perle active
    bounceValue.value = withSequence(
      withTiming(1.2, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 10, stiffness: 150 }),
    );

    lastCount.value = count;
  }, [count]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    increment();
  };

  // Indices des perles visibles (étendu pour anticipation)
  const visibleBeads = useMemo(() => {
    const halfWindow = Math.floor(VISIBLE_BEADS / 2) + 2;
    const start = Math.max(0, count - halfWindow);
    const endLimit = target === 0 ? count + halfWindow : target;
    const end = Math.min(endLimit, count + halfWindow);

    const indices = [];
    for (let i = start; i <= end; i++) {
      indices.push(i);
    }
    return indices;
  }, [count, target]);

  // Chemin de la corde
  const threadPath = `M ${ARC_START_X} ${ARC_START_Y} Q ${ARC_CONTROL_X} ${ARC_CONTROL_Y} ${ARC_END_X} ${ARC_END_Y}`;

  return (
    <Pressable onPress={handlePress} className="flex-1">
      <Svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      >
        <Defs>
          {/* Masque pour clipper les perles hors écran */}
          <ClipPath id="viewportClip">
            <Rect x="-20" y="0" width={SVG_WIDTH + 40} height={SVG_HEIGHT} />
          </ClipPath>

          {/* Dégradé perle normale avec plus de profondeur */}
          <RadialGradient id="beadNormal" cx="32%" cy="28%" r="70%">
            <Stop
              offset="0%"
              stopColor={BEAD_COLORS.highlight}
              stopOpacity="0.9"
            />
            <Stop offset="20%" stopColor={BEAD_COLORS.light} />
            <Stop offset="60%" stopColor={BEAD_COLORS.mid} />
            <Stop offset="90%" stopColor={BEAD_COLORS.dark} />
            <Stop offset="100%" stopColor={BEAD_COLORS.rim} />
          </RadialGradient>

          {/* Dégradé perle active (plus lumineuse) */}
          <RadialGradient id="beadActive" cx="30%" cy="25%" r="65%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="15%" stopColor="#FFE4C4" />
            <Stop offset="45%" stopColor={BEAD_COLORS.light} />
            <Stop offset="85%" stopColor={BEAD_COLORS.mid} />
            <Stop offset="100%" stopColor={BEAD_COLORS.dark} />
          </RadialGradient>

          {/* Reflet principal */}
          <RadialGradient id="shine" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <Stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>

          {/* Reflet secondaire */}
          <RadialGradient id="shineSecondary" cx="50%" cy="50%" r="45%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>

          {/* Corde améliorée */}
          <LinearGradient id="thread" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4A3728" />
            <Stop offset="25%" stopColor="#5D4524" />
            <Stop offset="50%" stopColor="#6B5344" />
            <Stop offset="75%" stopColor="#5D4524" />
            <Stop offset="100%" stopColor="#4A3728" />
          </LinearGradient>
        </Defs>

        {/* Corde avec ombre */}
        <Path
          d={threadPath}
          fill="none"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={4}
          strokeLinecap="round"
          transform="translate(0, 2)"
        />
        <Path
          d={threadPath}
          fill="none"
          stroke="url(#thread)"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Perles avec clipping */}
        <G clipPath="url(#viewportClip)">
          {visibleBeads.map((index) => (
            <Bead
              key={index}
              index={index}
              progress={progress}
              count={count}
              bounceValue={bounceValue}
            />
          ))}
        </G>
      </Svg>
    </Pressable>
  );
}

// Calcul position sur courbe de Bézier
function getPointOnCurve(t: number): { x: number; y: number } {
  "worklet";
  const oneMinusT = 1 - t;

  const x =
    oneMinusT * oneMinusT * ARC_START_X +
    2 * oneMinusT * t * ARC_CONTROL_X +
    t * t * ARC_END_X;

  const y =
    oneMinusT * oneMinusT * ARC_START_Y +
    2 * oneMinusT * t * ARC_CONTROL_Y +
    t * t * ARC_END_Y;

  return { x, y };
}

interface BeadProps {
  index: number;
  progress: SharedValue<number>;
  count: number;
  bounceValue: SharedValue<number>;
}

function Bead({ index, progress, count, bounceValue }: BeadProps) {
  const animatedProps = useAnimatedProps(() => {
    const relativePos = index - progress.value;

    // Position avec gap au centre et espacement dynamique
    const absPos = Math.abs(relativePos);
    const dynamicSpacing = interpolate(
      absPos,
      [0, 2, 4, 6],
      [SPACING, SPACING * 0.92, SPACING * 0.85, SPACING * 0.78],
      Extrapolation.CLAMP,
    );

    let baseT = CENTER_T + relativePos * dynamicSpacing;
    let t: number;

    if (relativePos < -0.5) {
      t = baseT - GAP_SIZE;
    } else if (relativePos > 0.5) {
      t = baseT + GAP_SIZE;
    } else {
      t = baseT;
    }

    t = Math.max(-0.15, Math.min(1.15, t));
    const point = getPointOnCurve(t);

    // Effet de profondeur (perspective 3D)
    const depthScale = interpolate(
      absPos,
      [0, 1, 2.5, 4, 6],
      [1.35, 1.2, 1.0, 0.8, 0.55],
      Extrapolation.CLAMP,
    );

    // Effet de bounce pour la perle active (transition fluide)
    const bounceTransition = interpolate(
      absPos,
      [0, 0.8, 1.5],
      [1, 0.3, 0],
      Extrapolation.CLAMP,
    );
    const bounceEffect = bounceValue.value * 0.15 * bounceTransition;
    const finalScale =
      (depthScale + bounceEffect) * (BEAD_RADIUS / BEAD_RADIUS);

    // Rotation 3D (angle basé sur la position)
    const rotationAngle = interpolate(
      relativePos,
      [-6, -3, 0, 3, 6],
      [85, 50, 0, -50, -85],
      Extrapolation.CLAMP,
    );

    // Conversion en radians pour le calcul
    const rotationRad = (rotationAngle * Math.PI) / 180;

    // Ellipse pour effet 3D (compression horizontale sur les côtés)
    // On garde toujours au moins 70% de la hauteur pour éviter l'aplatissement
    const minRatio = 0.7;
    const ellipseRx = BEAD_RADIUS * finalScale;
    const verticalCompression = Math.max(
      minRatio,
      BEAD_3D_RATIO + (1 - BEAD_3D_RATIO) * Math.abs(Math.cos(rotationRad))
    );
    const ellipseRy = BEAD_RADIUS * finalScale * verticalCompression;

    // Opacité basée sur la profondeur
    const depthOpacity = interpolate(
      absPos,
      [0, 2, 4, 6, 8],
      [1, 0.98, 0.85, 0.6, 0.3],
      Extrapolation.CLAMP,
    );

    return {
      cx: point.x,
      cy: point.y,
      rx: ellipseRx,
      ry: ellipseRy,
      opacity: depthOpacity,
    };
  });

  const shadowProps = useAnimatedProps(() => {
    const relativePos = index - progress.value;
    const absPos = Math.abs(relativePos);

    const dynamicSpacing = interpolate(
      absPos,
      [0, 2, 4, 6],
      [SPACING, SPACING * 0.92, SPACING * 0.85, SPACING * 0.78],
      Extrapolation.CLAMP,
    );

    let baseT = CENTER_T + relativePos * dynamicSpacing;
    let t: number;

    if (relativePos < -0.5) {
      t = baseT - GAP_SIZE;
    } else if (relativePos > 0.5) {
      t = baseT + GAP_SIZE;
    } else {
      t = baseT;
    }

    t = Math.max(-0.15, Math.min(1.15, t));
    const point = getPointOnCurve(t);

    const depthScale = interpolate(
      absPos,
      [0, 1, 2.5, 4, 6],
      [1.35, 1.2, 1.0, 0.8, 0.55],
      Extrapolation.CLAMP,
    );

    // Ombre plus prononcée pour les perles proches
    const shadowIntensity = interpolate(
      absPos,
      [0, 2, 4],
      [0.25, 0.15, 0.08],
      Extrapolation.CLAMP,
    );

    const shadowOffset = interpolate(
      absPos,
      [0, 3, 6],
      [4, 3, 2],
      Extrapolation.CLAMP,
    );

    const rotationAngle = interpolate(
      relativePos,
      [-6, -3, 0, 3, 6],
      [85, 50, 0, -50, -85],
      Extrapolation.CLAMP,
    );

    const rotationRad = (rotationAngle * Math.PI) / 180;
    const shadowRx = BEAD_RADIUS * depthScale * 1.05;
    
    const minRatio = 0.7;
    const verticalCompression = Math.max(
      minRatio,
      BEAD_3D_RATIO + (1 - BEAD_3D_RATIO) * Math.abs(Math.cos(rotationRad))
    );
    const shadowRy = BEAD_RADIUS * depthScale * verticalCompression * 1.05;

    return {
      cx: point.x + shadowOffset * 0.5,
      cy: point.y + shadowOffset,
      rx: shadowRx,
      ry: shadowRy,
      opacity: shadowIntensity,
    };
  });

  const shineProps = useAnimatedProps(() => {
    const relativePos = index - progress.value;
    const absPos = Math.abs(relativePos);

    const dynamicSpacing = interpolate(
      absPos,
      [0, 2, 4, 6],
      [SPACING, SPACING * 0.92, SPACING * 0.85, SPACING * 0.78],
      Extrapolation.CLAMP,
    );

    let baseT = CENTER_T + relativePos * dynamicSpacing;
    let t: number;

    if (relativePos < -0.5) {
      t = baseT - GAP_SIZE;
    } else if (relativePos > 0.5) {
      t = baseT + GAP_SIZE;
    } else {
      t = baseT;
    }

    t = Math.max(-0.15, Math.min(1.15, t));
    const point = getPointOnCurve(t);

    const depthScale = interpolate(
      absPos,
      [0, 1, 2.5, 4, 6],
      [1.35, 1.2, 1.0, 0.8, 0.55],
      Extrapolation.CLAMP,
    );

    const isActive = absPos < 0.5;
    const bounceEffect = isActive ? bounceValue.value * 0.15 : 0;
    const finalScale = depthScale + bounceEffect;

    // Position du reflet qui suit la rotation
    const rotationAngle = interpolate(
      relativePos,
      [-6, -3, 0, 3, 6],
      [85, 50, 0, -50, -85],
      Extrapolation.CLAMP,
    );

    const shineOffsetX = interpolate(
      rotationAngle,
      [-85, 0, 85],
      [-BEAD_RADIUS * 0.15, -BEAD_RADIUS * 0.25, -BEAD_RADIUS * 0.15],
      Extrapolation.CLAMP,
    );

    const shineIntensity = interpolate(
      absPos,
      [0, 2, 4],
      [0.6, 0.4, 0.2],
      Extrapolation.CLAMP,
    );

    return {
      cx: point.x + shineOffsetX * finalScale,
      cy: point.y - BEAD_RADIUS * 0.25 * finalScale,
      r: BEAD_RADIUS * finalScale * 0.35,
      opacity: shineIntensity,
    };
  });

  const shineSecondaryProps = useAnimatedProps(() => {
    const relativePos = index - progress.value;
    const absPos = Math.abs(relativePos);

    const dynamicSpacing = interpolate(
      absPos,
      [0, 2, 4, 6],
      [SPACING, SPACING * 0.92, SPACING * 0.85, SPACING * 0.78],
      Extrapolation.CLAMP,
    );

    let baseT = CENTER_T + relativePos * dynamicSpacing;
    let t: number;

    if (relativePos < -0.5) {
      t = baseT - GAP_SIZE;
    } else if (relativePos > 0.5) {
      t = baseT + GAP_SIZE;
    } else {
      t = baseT;
    }

    t = Math.max(-0.15, Math.min(1.15, t));
    const point = getPointOnCurve(t);

    const depthScale = interpolate(
      absPos,
      [0, 1, 2.5, 4, 6],
      [1.35, 1.2, 1.0, 0.8, 0.55],
      Extrapolation.CLAMP,
    );

    const shineIntensity = interpolate(
      absPos,
      [0, 2, 4],
      [0.3, 0.2, 0.1],
      Extrapolation.CLAMP,
    );

    return {
      cx: point.x + BEAD_RADIUS * 0.1 * depthScale,
      cy: point.y + BEAD_RADIUS * 0.15 * depthScale,
      r: BEAD_RADIUS * depthScale * 0.2,
      opacity: shineIntensity,
    };
  });

  const isActive = Math.abs(index - count) < 0.5;

  return (
    <G>
      {/* Ombre portée (blur simulé avec plusieurs cercles) */}
      <AnimatedEllipse animatedProps={shadowProps} fill={BEAD_COLORS.shadow} />

      {/* Perle principale (ellipse pour effet 3D) */}
      <AnimatedEllipse
        animatedProps={animatedProps}
        fill={isActive ? "url(#beadActive)" : "url(#beadNormal)"}
        stroke={isActive ? BEAD_COLORS.light : "rgba(0,0,0,0.1)"}
        strokeWidth={isActive ? 1.2 : 0.8}
      />

      {/* Reflet principal */}
      <AnimatedCircle animatedProps={shineProps} fill="url(#shine)" />

      {/* Reflet secondaire */}
      <AnimatedCircle
        animatedProps={shineSecondaryProps}
        fill="url(#shineSecondary)"
      />
    </G>
  );
}
