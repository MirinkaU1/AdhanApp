import { useState, useEffect, useRef, useCallback } from "react";
import * as Location from "expo-location";
import { Qibla, Coordinates } from "adhan";

// Types pour la précision du heading
export type AccuracyLevel = "high" | "medium" | "low";

interface QiblaState {
  qiblaBearing: number | null;
  deviceHeading: number;
  trueHeading: number;
  distanceToMecca: number | null;
  error: string | null;
  loading: boolean;
  isAligned: boolean;
  hasPermission: boolean | null;
  accuracyLevel: AccuracyLevel;
}

interface UseQiblaReturn extends QiblaState {
  requestPermission: () => Promise<void>;
  calibrate: () => void;
}

// Coordonnées de la Kaaba à La Mecque
const MECCA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262,
};

// Seuil d'alignement en degrés (±2°)
const ALIGNMENT_THRESHOLD = 2;

// Taille du buffer pour le lissage (réduit pour plus de réactivité)
const SMOOTHING_BUFFER_SIZE = 3;

// Calcul de la distance entre deux points (formule de Haversine)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Déterminer le niveau de précision basé sur headingAccuracy
const getAccuracyLevel = (accuracy: number): AccuracyLevel => {
  // accuracy en degrés: plus petit = meilleur
  // iOS: headingAccuracy représente l'erreur max en degrés
  // Android: valeur similaire
  if (accuracy < 0) return "low"; // Valeur négative = invalide
  if (accuracy <= 15) return "high";
  if (accuracy <= 35) return "medium";
  return "low";
};

// Fonction utilitaire pour la moyenne circulaire (CORRECTION CRITIQUE)
// Utilise cos pour x et sin pour y dans atan2(y, x)
const getAverageAngle = (angles: number[]): number => {
  if (angles.length === 0) return 0;
  let x = 0;
  let y = 0;
  for (const angle of angles) {
    const rad = (angle * Math.PI) / 180;
    x += Math.cos(rad);
    y += Math.sin(rad);
  }
  const avgRad = Math.atan2(y, x);
  let avgDeg = (avgRad * 180) / Math.PI;
  if (avgDeg < 0) avgDeg += 360;
  return avgDeg;
};

// Fonction pour la différence minimale entre deux angles (CORRECTION CRITIQUE)
const getShortestAngleDifference = (angle1: number, angle2: number): number => {
  const diff = Math.abs(angle1 - angle2) % 360;
  return diff > 180 ? 360 - diff : diff;
};

// Obtenir la direction cardinale
export const getCardinalDirection = (degrees: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

export default function useQibla(): UseQiblaReturn {
  const [state, setState] = useState<QiblaState>({
    qiblaBearing: null,
    deviceHeading: 0,
    trueHeading: 0,
    distanceToMecca: null,
    error: null,
    loading: true,
    isAligned: false,
    hasPermission: null,
    accuracyLevel: "medium",
  });

  // Refs pour le lissage
  const headingBufferRef = useRef<number[]>([]);
  const smoothedHeadingRef = useRef<number>(0);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const qiblaBearingRef = useRef<number | null>(null);

  // Démarrer le watch du heading avec True North
  const startHeadingWatch = useCallback(async () => {
    try {
      // Arrêter l'ancien abonnement s'il existe
      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
      }

      // Utiliser watchHeadingAsync pour obtenir le True North
      headingSubscriptionRef.current = await Location.watchHeadingAsync(
        (heading) => {
          const { trueHeading, magHeading, accuracy } = heading;
          // Priorité au True Heading (Vrai Nord), sinon Magnétique
          const currentHeading = trueHeading >= 0 ? trueHeading : magHeading;

          // Ignorer les valeurs invalides
          if (currentHeading < 0 || isNaN(currentHeading)) return;

          // 1. Gestion du Buffer (Smoothing)
          headingBufferRef.current = [
            ...headingBufferRef.current,
            currentHeading,
          ].slice(-SMOOTHING_BUFFER_SIZE);

          // 2. Calcul Moyenne Circulaire Correcte
          const smoothed = getAverageAngle(headingBufferRef.current);
          smoothedHeadingRef.current = smoothed;

          // 3. Calcul de l'alignement Correct
          const qibla = qiblaBearingRef.current;
          let aligned = false;

          if (qibla !== null) {
            const diff = getShortestAngleDifference(qibla, smoothed);
            aligned = diff <= ALIGNMENT_THRESHOLD;
          }

          // Déterminer le niveau de précision
          const accuracyLevel = getAccuracyLevel(accuracy);

          // Mise à jour du state (optimisée pour éviter trop de re-renders)
          setState((prev) => {
            // Ne pas set state si la valeur change peu (< 0.5 degré)
            if (
              Math.abs(prev.deviceHeading - smoothed) < 0.5 &&
              prev.isAligned === aligned
            ) {
              return prev;
            }
            return {
              ...prev,
              deviceHeading: smoothed,
              trueHeading: currentHeading,
              isAligned: aligned,
              accuracyLevel,
            };
          });
        },
      );
    } catch (error) {
      console.error("Erreur watchHeadingAsync:", error);
      setState((prev) => ({
        ...prev,
        error: "heading_unavailable",
      }));
    }
  }, []);

  // Demander la permission et initialiser
  const requestPermission = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setState((prev) => ({
          ...prev,
          hasPermission: false,
          loading: false,
          error: "permission_denied",
        }));
        return;
      }

      setState((prev) => ({ ...prev, hasPermission: true }));

      // Obtenir la position actuelle pour calculer la Qibla
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Calculer la direction de la Qibla avec la librairie adhan
      const coordinates = new Coordinates(latitude, longitude);
      const qiblaDirection = Qibla(coordinates);

      // Stocker dans la ref pour accès synchrone dans le callback
      qiblaBearingRef.current = qiblaDirection;

      // Calculer la distance à La Mecque
      const distance = calculateDistance(
        latitude,
        longitude,
        MECCA_COORDS.latitude,
        MECCA_COORDS.longitude,
      );

      setState((prev) => ({
        ...prev,
        qiblaBearing: qiblaDirection,
        distanceToMecca: distance,
        loading: false,
      }));

      // Démarrer le suivi du heading
      startHeadingWatch();
    } catch (error) {
      console.error("Erreur useQibla:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "location_error",
      }));
    }
  }, [startHeadingWatch]);

  // Calibrer la boussole (réinitialiser le buffer)
  const calibrate = useCallback(() => {
    headingBufferRef.current = [];
    smoothedHeadingRef.current = 0;
  }, []);

  // Initialisation : demander les permissions
  useEffect(() => {
    requestPermission();

    // Cleanup
    return () => {
      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
        headingSubscriptionRef.current = null;
      }
    };
  }, [requestPermission]);

  return {
    ...state,
    requestPermission,
    calibrate,
  };
}
