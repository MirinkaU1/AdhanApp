/**
 * usePrayerLocation - Main hook for location-based prayer times
 *
 * Combines:
 * - Location detection with fallback
 * - Local prayer calculation (instant)
 * - API sync for Hijri dates (async)
 * - Store updates
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import { useCurrentLocation, LocationData } from "@/hooks/useCurrentLocation";
import usePrayerStore from "@/stores/usePrayerStore";
import {
  calculatePrayerTimes,
  fetchAladhanData,
  getLocalHijriDate,
  calculateHijriOffset,
} from "@/utils/prayerEngine";

type UsePrayerLocationResult = {
  // Location state
  location: LocationData | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  hasPermission: boolean;
  isUsingDefaultLocation: boolean;

  // Status
  isOnline: boolean;
  isSyncingApi: boolean;

  // Actions
  refreshLocation: () => Promise<void>;
  syncWithApi: () => Promise<void>;
};

export function usePrayerLocation(): UsePrayerLocationResult {
  const netInfo = useNetInfo();
  const {
    autoLocation,
    location: storeLocation,
    autoHijriSync,
    calculationMethod,
    hijriOffset,
    setLocation,
    setLoadingLocation,
    setPrayerTimes,
    setHijriDate,
    setNextPrayer,
    setHijriOffset,
  } = usePrayerStore();

  const {
    location: gpsLocation,
    isLoading: isLoadingLocation,
    error: locationError,
    hasPermission,
    isUsingDefault: isUsingDefaultLocation,
    refresh: refreshLocation,
  } = useCurrentLocation({ enabled: autoLocation });

  // Utiliser la localisation du store (manuelle) si autoLocation est false
  // Sinon utiliser la géolocalisation GPS
  // useMemo pour éviter de recréer l'objet à chaque render
  const activeLocation = useMemo(() => {
    if (autoLocation) {
      return gpsLocation;
    }
    if (storeLocation) {
      return {
        coords: {
          latitude: storeLocation.latitude,
          longitude: storeLocation.longitude,
        },
        city: storeLocation.city,
        country: storeLocation.country,
      };
    }
    return null;
  }, [
    autoLocation,
    gpsLocation,
    storeLocation?.latitude,
    storeLocation?.longitude,
    storeLocation?.city,
    storeLocation?.country,
  ]);

  const isSyncingRef = useRef(false);
  const isOnline = Boolean(
    netInfo.isConnected && netInfo.isInternetReachable !== false,
  );

  // =====================================================
  // STEP A: Local Calculation (immediate)
  // =====================================================

  useEffect(() => {
    if (!activeLocation?.coords) {
      return;
    }

    // Update store with location (seulement si en mode auto)
    if (autoLocation) {
      setLocation({
        latitude: activeLocation.coords.latitude,
        longitude: activeLocation.coords.longitude,
        city: activeLocation.city,
        country: activeLocation.country,
      });
    }

    // Calculate prayer times locally (instant)
    const result = calculatePrayerTimes(
      activeLocation.coords,
      new Date(),
      calculationMethod,
    );

    // Update store with calculated times
    setPrayerTimes(new Date(), result.times);
    setNextPrayer(result.nextPrayer);

    // Set local Hijri date
    const hijri = getLocalHijriDate(new Date(), hijriOffset);
    setHijriDate(hijri.formatted);

    setLoadingLocation(false);
  }, [
    // Utiliser des valeurs primitives au lieu de l'objet activeLocation pour éviter les re-renders infinis
    activeLocation?.coords?.latitude,
    activeLocation?.coords?.longitude,
    activeLocation?.city,
    activeLocation?.country,
    autoLocation,
    calculationMethod,
    hijriOffset,
    setLocation,
    setPrayerTimes,
    setNextPrayer,
    setHijriDate,
    setLoadingLocation,
  ]);

  // =====================================================
  // STEP B: API Sync (async, for Hijri accuracy)
  // =====================================================

  const syncWithApi = useCallback(async () => {
    if (!activeLocation?.coords || !isOnline || isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;

    try {
      const apiData = await fetchAladhanData(
        activeLocation.coords,
        calculationMethod,
      );

      if (apiData?.hijriDate) {
        // Check if we need to adjust Hijri offset
        if (autoHijriSync) {
          const localHijri = getLocalHijriDate(new Date(), hijriOffset);
          const suggestedOffset = calculateHijriOffset(
            localHijri,
            apiData.hijriDate,
            hijriOffset,
          );

          if (suggestedOffset !== null) {
            setHijriOffset(suggestedOffset);
          }
        }

        // Update formatted Hijri date from API (more accurate)
        setHijriDate(apiData.hijriDate.formatted);
      }
    } catch (err) {
      console.warn("[usePrayerLocation] API sync failed:", err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [
    activeLocation,
    isOnline,
    calculationMethod,
    autoHijriSync,
    hijriOffset,
    setHijriDate,
    setHijriOffset,
  ]);

  // Auto-sync with API when online and location is available
  useEffect(() => {
    if (location?.coords && isOnline) {
      syncWithApi();
    }
  }, [location?.coords, isOnline, syncWithApi]);

  // =====================================================
  // Refresh next prayer every minute
  // =====================================================

  useEffect(() => {
    if (!location?.coords) {
      return;
    }

    const updateNextPrayer = () => {
      const result = calculatePrayerTimes(
        location.coords,
        new Date(),
        calculationMethod,
      );
      setNextPrayer(result.nextPrayer);
    };

    // Update every minute
    const interval = setInterval(updateNextPrayer, 60_000);

    return () => clearInterval(interval);
  }, [location?.coords, calculationMethod, setNextPrayer]);

  return {
    location: activeLocation,
    isLoadingLocation: autoLocation ? isLoadingLocation : false,
    locationError,
    hasPermission,
    isUsingDefaultLocation,
    isOnline,
    isSyncingApi: isSyncingRef.current,
    refreshLocation,
    syncWithApi,
  };
}

export default usePrayerLocation;
