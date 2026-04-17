import React, {
  useRef,
  useEffect,
  useMemo,
  type MutableRefObject,
} from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import * as Haptics from "expo-haptics";
import useDhikrStore from "@/stores/useDhikrStore";

// ─────────────────────────────────────────────────────────────
// Courbe de Bézier — arc horizontal type collier pendu
// Les deux extrémités sont à la même hauteur, le fil pend
// doucement au centre (forme de U très ouvert / catenaire).
// ─────────────────────────────────────────────────────────────
const P0 = new THREE.Vector3(-2.5, 0.45, 0); // extrémité gauche
const P1 = new THREE.Vector3(0, -1.55, 0); // point de contrôle : creux central
const P2 = new THREE.Vector3(2.5, 0.45, 0); // extrémité droite

function bezierPt(t: number): THREE.Vector3 {
  const u = 1 - t;
  return new THREE.Vector3(
    u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
    u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
    0,
  );
}

// ─────────────────────────────────────────────────────────────
// Paramètres
// ─────────────────────────────────────────────────────────────
const BEAD_RADIUS = 0.26;
const CENTER_T = 0.5; // gap exactement au centre du creux
const SPACING = 0.09; // écart entre perles (paramètre de courbe)
const BIG_GAP = 0.11; // espace visible entre les deux groupes ← clé du design
const NUM_BEADS = 14;
const HALF = Math.floor(NUM_BEADS / 2);

// ─────────────────────────────────────────────────────────────
// Calcul du paramètre t selon la position relative à l'index animé
//
// relToAnim > +0.5  → groupe RESTANT  (droite du gap)
// relToAnim < −0.5  → groupe COMPTÉ   (gauche du gap)
// |relToAnim| < 0.5 → TRAVERSÉE du gap (animation visible)
//
// La perle qui vient d'être comptée traverse le gap de droite
// à gauche avec une courbe de lissage (smoothstep).
// ─────────────────────────────────────────────────────────────
function getBeadT(rel: number): number {
  const halfGap = BIG_GAP / 2;

  if (rel >= 0.5) {
    // Côté droit : perles restantes, décalées vers la droite du gap
    return CENTER_T + halfGap + rel * SPACING;
  } else if (rel <= -0.5) {
    // Côté gauche : perles comptées, décalées vers la gauche du gap
    return CENTER_T - halfGap + rel * SPACING;
  } else {
    // Traversée du gap — smoothstep pour un glissement naturel
    const prog = 0.5 - rel; // 0 → 1  (de droite vers gauche)
    const s = prog * prog * (3 - 2 * prog); // ease-in-out
    const tRight = CENTER_T + halfGap + 0.5 * SPACING;
    const tLeft = CENTER_T - halfGap - 0.5 * SPACING;
    return tRight + s * (tLeft - tRight);
  }
}

type BeadData = {
  t: number;
  scale: number;
  visible: boolean;
  counted: boolean; // true = côté gauche (déjà compté)
  crossing: boolean; // true = en train de traverser le gap
};

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────
export default function TasbihArc() {
  const { count, increment } = useDhikrStore();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    increment();
  };

  return (
    <View style={styles.container}>
      <Canvas
        style={styles.canvas}
        camera={{ position: [0, -0.4, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ scene }) => {
          scene.background = null;
        }}
      >
        {/* Lumière ambiante chaude */}
        <ambientLight intensity={0.5} color={0xfff5ee} />
        {/* Lumière principale haut-gauche → point chaud caractéristique sur les sphères */}
        <directionalLight
          position={[-2.5, 5, 6]}
          intensity={1.25}
          color={0xfffaf0}
        />
        {/* Rim light doux */}
        <directionalLight
          position={[3, -3, 4]}
          intensity={0.2}
          color={0xd4b896}
        />

        <TasbihScene count={count} />
      </Canvas>

      {/* Couche transparente pour capturer les appuis */}
      <Pressable onPress={handlePress} style={StyleSheet.absoluteFill} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Scène Three.js
// ─────────────────────────────────────────────────────────────
function TasbihScene({ count }: { count: number }) {
  const targetCount = useRef(count);
  const animCount = useRef(count);

  const beadData = useRef<BeadData[]>(
    Array.from({ length: NUM_BEADS }, () => ({
      t: CENTER_T,
      scale: 1,
      visible: false,
      counted: false,
      crossing: false,
    })),
  );

  useEffect(() => {
    targetCount.current = count;
  }, [count]);

  // Géométrie du fil
  const stringGeo = useMemo(() => {
    const pts = Array.from({ length: 80 }, (_, i) => bezierPt(i / 79));
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 80, 0.024, 8, false);
  }, []);

  useFrame((_, delta) => {
    // Spring vers le compteur cible (vitesse 16 = réactif mais pas brutal)
    animCount.current +=
      (targetCount.current - animCount.current) * Math.min(1, delta * 16);
    const ap = animCount.current;

    for (let i = 0; i < NUM_BEADS; i++) {
      const countIdx = Math.round(ap) - HALF + i;
      const rel = countIdx - ap; // distance fractionnaire au point animé

      const t = getBeadT(rel);
      const visible = t > -0.05 && t < 1.05 && countIdx >= 0;
      const absRel = Math.abs(rel);

      beadData.current[i] = {
        t: Math.max(0.001, Math.min(0.999, t)),
        // Légère variation de taille pour la profondeur : centre plus grand
        scale: Math.max(0.5, 1.18 - absRel * 0.07),
        visible,
        counted: rel < -0.5,
        crossing: absRel < 0.5,
      };
    }
  });

  return (
    <group>
      {/* Fil */}
      <mesh geometry={stringGeo}>
        <meshStandardMaterial color="#6B4F35" roughness={0.95} metalness={0} />
      </mesh>
      {/* Perles */}
      {Array.from({ length: NUM_BEADS }, (_, i) => (
        <WoodenBead key={i} index={i} dataRef={beadData} />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Perle individuelle
// ─────────────────────────────────────────────────────────────
function WoodenBead({
  index,
  dataRef,
}: {
  index: number;
  dataRef: MutableRefObject<BeadData[]>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const d = dataRef.current[index];

    if (!d.visible) {
      mesh.scale.setScalar(0.001);
      return;
    }

    const pos = bezierPt(d.t);

    // La perle en traversée avance légèrement en Z (ressort du fil)
    const zOffset = d.crossing ? THREE.MathUtils.lerp(0, 0.18, 1) : 0;
    mesh.position.set(pos.x, pos.y, zOffset);
    mesh.scale.setScalar(d.scale);

    // Perles côté droit (restantes) : bois chaud vif
    // Perles côté gauche (comptées) : bois légèrement plus sombre / mat
    // Perle en traversée : éclat maximal
    if (d.crossing) {
      mat.color.setHex(0xdcb870); // or chaud, visible en mouvement
      mat.roughness = 0.35;
      mat.emissiveIntensity = 0.1;
    } else if (d.counted) {
      mat.color.setHex(0xaa8845); // plus sombre — perles portées
      mat.roughness = 0.58;
      mat.emissiveIntensity = 0;
    } else {
      mat.color.setHex(0xc8a05a); // bois naturel — perles en attente
      mat.roughness = 0.42;
      mat.emissiveIntensity = 0;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[BEAD_RADIUS, 32, 24]} />
      <meshStandardMaterial
        ref={matRef}
        color="#c8a05a"
        roughness={0.42}
        metalness={0.06}
        emissive="#201005"
        emissiveIntensity={0}
      />
    </mesh>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  canvas: { flex: 1 },
});
