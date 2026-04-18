import {
  Pressable,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import usePrayerStore from "@/stores/usePrayerStore";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { usePrayerLocation } from "@/hooks/usePrayerLocation";
import {
  Switch,
  AppButton,
  AppInput,
  AppCard,
  AlertDialog,
} from "@/components/ui";

export default function LocationScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();

  // Store et Hooks
  const {
    autoLocation,
    setAutoLocation,
    location: storeLocation,
    setLocation,
  } = usePrayerStore();

  const { refreshLocation, isLoadingLocation } = usePrayerLocation();

  const [manualCity, setManualCity] = useState(storeLocation?.city || "");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<
    Array<{
      display_name: string;
      lat: string;
      lon: string;
      name: string;
      address?: any;
    }>
  >([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // États pour AlertDialog
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: "check-circle" | "error" | "location-on";
    iconColor?: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  // Cleanup du timer au démontage
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Mettre à jour le champ texte si la location change
  useEffect(() => {
    if (storeLocation) {
      setManualCity(storeLocation.city);
      setLatInput(storeLocation.latitude.toString());
      setLngInput(storeLocation.longitude.toString());
    }
  }, [storeLocation]);

  // Fonction de recherche de suggestions
  const searchCitySuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: { "User-Agent": "PrayerApp/1.0" },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setCitySuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error: any) {
      console.warn("Nominatim indisponible:", error.message);
      setCitySuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleCityInputChange = (text: string) => {
    setManualCity(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.length >= 3) {
      debounceTimer.current = setTimeout(() => {
        searchCitySuggestions(text);
      }, 500);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const cityName =
      suggestion.address?.city ||
      suggestion.address?.town ||
      suggestion.address?.village ||
      suggestion.name;

    setManualCity(suggestion.display_name);
    setShowSuggestions(false);
    setCitySuggestions([]);

    await updateLocation(lat, lng, cityName);
  };

  const handleManualSearch = async () => {
    if (!manualCity.trim()) return;

    setIsSearching(true);
    try {
      const results = await Location.geocodeAsync(manualCity);

      if (results.length > 0) {
        const firstResult = results[0];
        await updateLocation(
          firstResult.latitude,
          firstResult.longitude,
          manualCity,
        );
      } else {
        setAlertConfig({
          visible: true,
          title: t("location.error"),
          message: t("location.cityNotFound"),
          icon: "error",
          iconColor: "#EF4444",
        });
      }
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: t("location.error"),
        message: t("location.searchFailed"),
        icon: "error",
        iconColor: "#EF4444",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCoordinateSave = async () => {
    const lat = parseFloat(latInput.replace(",", "."));
    const lng = parseFloat(lngInput.replace(",", "."));

    if (isNaN(lat) || isNaN(lng)) {
      setAlertConfig({
        visible: true,
        title: t("location.error"),
        message: t("location.invalidCoordinates"),
        icon: "error",
        iconColor: "#EF4444",
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setAlertConfig({
        visible: true,
        title: t("location.error"),
        message: t("location.coordinatesOutOfRange"),
        icon: "error",
        iconColor: "#EF4444",
      });
      return;
    }

    setIsSearching(true);
    try {
      await updateLocation(lat, lng);
    } finally {
      setIsSearching(false);
    }
  };

  const updateLocation = async (
    lat: number,
    lng: number,
    fallbackCity = "",
  ) => {
    try {
      const reverse = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      const city =
        reverse[0]?.city ||
        reverse[0]?.region ||
        fallbackCity ||
        t("location.customLocation");
      const country = reverse[0]?.country || "";

      setAutoLocation(false);
      setLocation({
        latitude: lat,
        longitude: lng,
        city: city,
        country: country,
      });

      setAlertConfig({
        visible: true,
        title: t("location.success"),
        message: `${t("location.manualLocationSet")}: ${city}\n\n${t("location.prayerTimesRecalculated")}`,
        icon: "check-circle",
        iconColor: "#10B981",
      });
    } catch (e) {
      setAutoLocation(false);
      setLocation({
        latitude: lat,
        longitude: lng,
        city: fallbackCity || t("location.manualPosition"),
        country: "",
      });
      setAlertConfig({
        visible: true,
        title: t("location.success"),
        message: `${t("location.coordinatesSaved")}\n\n${t("location.prayerTimesRecalculated")}`,
        icon: "check-circle",
        iconColor: "#10B981",
      });
    }
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <LinearGradient
        colors={appTheme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: 48,
          paddingBottom: 24,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-white font-outfit-bold"
              style={{ fontSize: 24 }}
            >
              {t("location.title")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {autoLocation ? t("location.autoMode") : t("location.manualMode")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.2)" }}
          >
            <MaterialIconsRound name="location-on" size={26} color="#22C55E" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingVertical: 24,
          paddingHorizontal: 16,
        }}
      >
        {/* Carte Mode Auto */}
        <AppCard className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 pr-4">
              <Text
                className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold mb-1"
                style={{ fontSize: 18 }}
              >
                {t("location.autoLocation")}
              </Text>
              <Text
                className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                style={{ fontSize: 14, lineHeight: 20 }}
              >
                {t("location.autoLocationDesc")}
              </Text>
            </View>
            <Switch
              value={autoLocation}
              onValueChange={setAutoLocation}
              activeColor="#22C55E"
            />
          </View>

          {autoLocation && (
            <View className="mt-2">
              <View
                className="p-4 rounded-xl mb-4 border border-border-light dark:border-border-dark"
                style={{ backgroundColor: isDark ? "#1E293B" : "#F8FAFC" }}
              >
                <View className="flex-row items-center gap-3 mb-1">
                  <MaterialIconsRound
                    name="my-location"
                    size={20}
                    color="#22C55E"
                  />
                  <Text
                    className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
                    style={{ fontSize: 16 }}
                  >
                    {storeLocation?.city || t("location.unknown")}
                  </Text>
                </View>
                <Text
                  className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular"
                  style={{ fontSize: 13, marginLeft: 32 }}
                >
                  {storeLocation?.country || "---"}
                </Text>
                <Text
                  className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-light mt-1"
                  style={{ fontSize: 12, marginLeft: 32 }}
                >
                  {storeLocation?.latitude.toFixed(4)},{" "}
                  {storeLocation?.longitude.toFixed(4)}
                </Text>
              </View>

              <AppButton
                title={
                  isLoadingLocation
                    ? t("location.searching")
                    : t("location.refresh")
                }
                onPress={() => refreshLocation()}
                loading={isLoadingLocation}
                variant="outline"
                icon="refresh"
              />
            </View>
          )}
        </AppCard>

        {/* Mode Manuel */}
        {!autoLocation && (
          <AppCard>
            <Text
              className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold mb-4"
              style={{ fontSize: 18 }}
            >
              {t("location.searchByCity")}
            </Text>

            <View style={{ position: "relative", zIndex: 10 }}>
              <AppInput
                label={t("location.city")}
                placeholder={t("location.cityPlaceholder")}
                value={manualCity}
                onChangeText={handleCityInputChange}
                icon="location-city"
                containerClassName="mb-0"
              />

              {/* Liste de suggestions */}
              {showSuggestions && citySuggestions.length > 0 && (
                <View
                  className="absolute left-0 right-0 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden"
                  style={{
                    top: "100%",
                    marginTop: 4,
                    maxHeight: 200,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                  >
                    {citySuggestions.map((item, index) => (
                      <TouchableOpacity
                        key={`${item.lat}-${index}`}
                        onPress={() => handleSuggestionSelect(item)}
                        activeOpacity={0.7}
                        className="p-3"
                        style={{
                          borderBottomWidth:
                            index < citySuggestions.length - 1 ? 1 : 0,
                          borderBottomColor: isDark ? "#334155" : "#F1F5F9",
                        }}
                      >
                        <Text
                          className="text-text-primary-light dark:text-text-primary-dark font-outfit-medium"
                          style={{ fontSize: 14 }}
                          numberOfLines={2}
                        >
                          {item.display_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TouchableOpacity
                    onPress={() => setShowSuggestions(false)}
                    className="p-2 items-center border-t border-border-light dark:border-border-dark"
                    style={{ backgroundColor: isDark ? "#1E293B" : "#F8FAFC" }}
                  >
                    <Text
                      className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium"
                      style={{ fontSize: 12 }}
                    >
                      {t("location.close")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {isLoadingSuggestions && (
                <View style={{ position: "absolute", right: 12, top: 42 }}>
                  <ActivityIndicator size="small" color="#22C55E" />
                </View>
              )}
            </View>

            <View className="h-4" />

            <AppButton
              title={t("location.search")}
              onPress={handleManualSearch}
              loading={isSearching}
              variant="primary"
              style={{ backgroundColor: "#22C55E", marginBottom: 24 }}
            />

            {/* Séparateur */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-border-light dark:bg-border-dark" />
              <Text className="mx-4 text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium">
                {t("location.or")}
              </Text>
              <View className="flex-1 h-px bg-border-light dark:bg-border-dark" />
            </View>

            <Text
              className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold mb-4"
              style={{ fontSize: 18 }}
            >
              {t("location.gpsCoordinates")}
            </Text>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <AppInput
                  label={t("location.latitude")}
                  placeholder="0.0000"
                  value={latInput}
                  onChangeText={setLatInput}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <AppInput
                  label={t("location.longitude")}
                  placeholder="0.0000"
                  value={lngInput}
                  onChangeText={setLngInput}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <AppButton
              title={t("location.applyCoordinates")}
              onPress={handleCoordinateSave}
              loading={isSearching}
              variant="outline"
            />

            <Text
              className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular text-center mt-4"
              style={{ fontSize: 13 }}
            >
              {t("location.instantRecalculation")}
            </Text>
          </AppCard>
        )}

        <View className="h-10" />
      </ScrollView>

      {/* AlertDialog */}
      <AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
        buttons={[{ text: t("common.ok"), style: "primary" }]}
      />
    </View>
  );
}
