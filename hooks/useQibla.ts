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

// Taille du buffer pour le lissage
const SMOOTHING_BUFFER_SIZE = 5;

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

// Moyenne circulaire pour les angles (gère le passage 359° -> 0°)
const circularMean = (angles: number[]): number => {
  if (angles.length === 0) return 0;

  let sinSum = 0;
  let cosSum = 0;

  for (const angle of angles) {
    const rad = (angle * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }

  const avgRad = Math.atan2(sinSum / angles.length, cosSum / angles.length);
  let avgDeg = (avgRad * 180) / Math.PI;

  if (avgDeg < 0) avgDeg += 360;
  return avgDeg;
};

// Filtre passe-bas avec gestion du passage 0°/360°
const lowPassFilter = (
  newValue: number,
  oldValue: number,
  alpha: number = 0.2,
): number => {
  let diff = newValue - oldValue;

  // Gérer le passage de 359° à 0°
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  let result = oldValue + alpha * diff;
  if (result < 0) result += 360;
  if (result >= 360) result -= 360;

  return result;
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

  // Démarrer le watch du heading avec True North
  const startHeadingWatch = useCallback(async () => {
    try {
      // Arrêter l'ancien abonnement s'il existe
      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
      }

      // Utiliser watchHeadingAsync pour obtenir le True North
      // Cela gère automatiquement la déclinaison magnétique
      headingSubscriptionRef.current = await Location.watchHeadingAsync(
        (heading) => {
          // trueHeading = nord géographique (corrigé pour la déclinaison magnétique)
          // magHeading = nord magnétique
          const trueHeading = heading.trueHeading;
          const accuracy = heading.accuracy;

          // Ajouter au buffer pour le lissage
          headingBufferRef.current.push(trueHeading);
          if (headingBufferRef.current.length > SMOOTHING_BUFFER_SIZE) {
            headingBufferRef.current.shift();
          }

          // Calculer la moyenne lissée
          const averagedHeading = circularMean(headingBufferRef.current);

          // Appliquer un filtre passe-bas supplémentaire pour plus de fluidité
          const smoothedHeading = lowPassFilter(
            averagedHeading,
            smoothedHeadingRef.current,
            0.25,
          );
          smoothedHeadingRef.current = smoothedHeading;

          // Déterminer le niveau de précision
          const accuracyLevel = getAccuracyLevel(accuracy);

          setState((prev) => {
            // Vérifier si aligné avec la Qibla (±2°)
            let isAligned = false;
            if (prev.qiblaBearing !== null) {
              const diff = Math.abs(smoothedHeading - prev.qiblaBearing);
              const normalizedDiff = diff > 180 ? 360 - diff : diff;
              isAligned = normalizedDiff <= ALIGNMENT_THRESHOLD;
            }

            return {
              ...prev,
              deviceHeading: smoothedHeading,
              trueHeading: trueHeading,
              isAligned,
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
