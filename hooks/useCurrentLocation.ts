import { useEffect, useState, useCallback } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationData = {
  coords: Coordinates;
  city: string;
  country: string;
};

type LocationState = {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  isUsingDefault: boolean;
};

// Location par défaut (Abidjan, Côte d'Ivoire)
const DEFAULT_LOCATION: LocationData = {
  coords: { latitude: 5.3599517, longitude: -4.0082563 },
  city: "Abidjan",
  country: "Côte d'Ivoire",
};

const LOCATION_STORAGE_KEY = "@prayerapp/last-known-location";

async function getLastKnownLocation(): Promise<LocationData | null> {
  try {
    const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as LocationData;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

async function saveLocation(location: LocationData): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Ignore storage errors
  }
}

export function useCurrentLocation(
  options: { enabled?: boolean } = {},
): LocationState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: true,
    error: null,
    hasPermission: false,
    isUsingDefault: false,
  });

  const loadLocation = useCallback(async (forceRefresh = false) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. D'abord, essayer de charger le cache si on ne force pas le refresh
      if (!forceRefresh) {
        const lastKnown = await getLastKnownLocation();
        if (lastKnown) {
          console.log("Using cached location:", lastKnown.city);
          setState({
            location: lastKnown,
            isLoading: false,
            error: null,
            hasPermission: true, // On suppose qu'on avait la permission quand on l'a sauvegardé
            isUsingDefault: false,
          });
          return; // STOP ICI, on ne lance pas le GPS
        }
      }

      // 2. Si pas de cache ou refresh forcé, on demande la permission et le GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === "granted";

      if (!hasPermission) {
        // Fallback sur défaut si pas de cache et pas de permission
        setState({
          location: DEFAULT_LOCATION,
          isLoading: false,
          error: "Permission de localisation refusée",
          hasPermission: false,
          isUsingDefault: true,
        });
        return;
      }

      // Récupérer la position GPS
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Reverse geocode pour ville et pays
      let city = "";
      let country = "";
      try {
        const results = await Location.reverseGeocodeAsync(coords);
        if (results.length > 0) {
          const result = results[0];
          city = result.city ?? result.subregion ?? result.region ?? "";
          country = result.country ?? "";
        }
      } catch {
        // Continuer sans le nom de la ville
      }

      const locationData: LocationData = { coords, city, country };

      // Sauvegarder pour utilisation future
      await saveLocation(locationData);

      setState({
        location: locationData,
        isLoading: false,
        error: null,
        hasPermission: true,
        isUsingDefault: false,
      });
    } catch (err) {
      // En cas d'erreur, utiliser le fallback
      const lastKnown = await getLastKnownLocation();
      const fallbackLocation = lastKnown ?? DEFAULT_LOCATION;

      setState({
        location: fallbackLocation,
        isLoading: false,
        error: err instanceof Error ? err.message : "Erreur de localisation",
        hasPermission: false,
        isUsingDefault: !lastKnown,
      });
    }
  }, []);

  useEffect(() => {
    if (options.enabled === false) {
      // Si désactivé, charger la dernière position connue ou défaut
      getLastKnownLocation().then((lastKnown) => {
        setState({
          location: lastKnown ?? DEFAULT_LOCATION,
          isLoading: false,
          error: null,
          hasPermission: false,
          isUsingDefault: !lastKnown,
        });
      });
      return;
    }

    loadLocation(false);
  }, [options.enabled, loadLocation]);

  return { ...state, refresh: () => loadLocation(true) };
}

export { DEFAULT_LOCATION };
