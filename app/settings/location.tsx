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
import MaterialIconsRound from "@/components/MaterialIconsRound";
import usePrayerStore from "@/stores/usePrayerStore";
import { usePrayerLocation } from "@/hooks/usePrayerLocation";
import {
  ModernSwitch,
  AppButton,
  AppInput,
  AppCard,
  AlertDialog,
} from "@/components/ui";
import useThemeColors from "@/hooks/useThemeColors";
import { palette } from "@/constants/theme";
import { tealBase, tealDark } from "@/constants/Colors";

export default function LocationScreen() {
  const colors = useThemeColors();
  const accent = palette.success.main;
  const accentBg = palette.success.light;

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

  // Mettre à jour le champ texte si la location change (sans focus)
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
          headers: {
            "User-Agent": "PrayerApp/1.0",
          },
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
      console.warn(
        "Nominatim indisponible (normal dans Expo Go):",
        error.message,
      );
      setCitySuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleCityInputChange = (text: string) => {
    setManualCity(text);

    // Debounce : annuler la recherche précédente
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Nouvelle recherche après 500ms
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
          title: "Erreur",
          message: "Aucune ville trouvée avec ce nom.",
          icon: "error",
          iconColor: palette.error.main,
        });
      }
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Erreur",
        message: "Impossible de trouver cette ville.",
        icon: "error",
        iconColor: palette.error.main,
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
        title: "Erreur",
        message: "Veuillez entrer des coordonnées valides.",
        icon: "error",
        iconColor: palette.error.main,
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setAlertConfig({
        visible: true,
        title: "Erreur",
        message: "Coordonnées hors limites.",
        icon: "error",
        iconColor: palette.error.main,
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
      // Reverse geocode pour avoir le nom
      const reverse = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      const city =
        reverse[0]?.city ||
        reverse[0]?.region ||
        fallbackCity ||
        "Localisation personnalisée";
      const country = reverse[0]?.country || "";

      // Désactiver le mode auto et sauvegarder la localisation manuelle
      setAutoLocation(false);
      setLocation({
        latitude: lat,
        longitude: lng,
        city: city,
        country: country,
      });

      setAlertConfig({
        visible: true,
        title: "Succès",
        message: `Localisation manuelle définie : ${city}\n\nLes horaires de prière seront calculés pour cette position.`,
        icon: "check-circle",
        iconColor: palette.success.main,
      });
    } catch (e) {
      // Fallback si reverse geocoding échoue (ex: hors ligne)
      setAutoLocation(false);
      setLocation({
        latitude: lat,
        longitude: lng,
        city: fallbackCity || "Position manuelle",
        country: "",
      });
      setAlertConfig({
        visible: true,
        title: "Succès",
        message:
          "Coordonnées manuelles sauvegardées.\n\nLes horaires de prière seront calculés pour cette position.",
        icon: "check-circle",
        iconColor: palette.success.main,
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <LinearGradient
        colors={[tealBase, tealDark]}
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Outfit_700Bold",
                color: "#fff",
              }}
            >
              Localisation
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Outfit_400Regular",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {autoLocation ? "Mode Automatique (GPS)" : "Mode Manuel"}
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: accentBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound name="location-on" size={26} color={accent} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingVertical: 24,
          paddingHorizontal: 16,
        }}
      >
        {/* Carte Mode Auto */}
        <AppCard style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Outfit_600SemiBold",
                  color: colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                Localisation Automatique
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Outfit_400Regular",
                  color: colors.textSecondary,
                  lineHeight: 20,
                }}
              >
                Utilise le GPS pour détecter votre position exacte.
              </Text>
            </View>
            <ModernSwitch
              value={autoLocation}
              onValueChange={setAutoLocation}
              activeColor={accent}
            />
          </View>

          {autoLocation && (
            <View style={{ marginTop: 8 }}>
              <View
                style={{
                  backgroundColor: colors.bgAlt,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 4,
                  }}
                >
                  <MaterialIconsRound
                    name="my-location"
                    size={20}
                    color={accent}
                  />
                  <Text
                    style={{
                      fontFamily: "Outfit_600SemiBold",
                      fontSize: 16,
                      color: colors.textPrimary,
                    }}
                  >
                    {storeLocation?.city || "Localisation inconnue"}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginLeft: 32,
                  }}
                >
                  {storeLocation?.country || "---"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Outfit_300Light",
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginLeft: 32,
                    marginTop: 4,
                  }}
                >
                  {storeLocation?.latitude.toFixed(4)},{" "}
                  {storeLocation?.longitude.toFixed(4)}
                </Text>
              </View>

              <AppButton
                title={
                  isLoadingLocation ? "Recherche..." : "Actualiser ma position"
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
              style={{
                fontSize: 18,
                fontFamily: "Outfit_600SemiBold",
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              Recherche par ville
            </Text>

            <View style={{ position: "relative", zIndex: 10 }}>
              <AppInput
                label="Ville"
                placeholder="Ex: Paris, France"
                value={manualCity}
                onChangeText={handleCityInputChange}
                icon="location-city"
                containerStyle={{ marginBottom: 0 }}
              />

              {/* Liste de suggestions */}
              {showSuggestions && citySuggestions.length > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginTop: 4,
                    maxHeight: 200,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    overflow: "hidden",
                  }}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                >
                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    bounces={false}
                  >
                    {citySuggestions.map((item, index) => (
                      <TouchableOpacity
                        key={`${item.lat}-${index}`}
                        onPress={() => handleSuggestionSelect(item)}
                        activeOpacity={0.7}
                        style={{
                          padding: 12,
                          borderBottomWidth:
                            index < citySuggestions.length - 1 ? 1 : 0,
                          borderBottomColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Outfit_500Medium",
                            fontSize: 14,
                            color: colors.textPrimary,
                          }}
                          numberOfLines={2}
                        >
                          {item.display_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Bouton pour fermer */}
                  <TouchableOpacity
                    onPress={() => setShowSuggestions(false)}
                    style={{
                      padding: 8,
                      backgroundColor: colors.bgAlt,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Outfit_500Medium",
                        fontSize: 12,
                        color: colors.textSecondary,
                      }}
                    >
                      Fermer
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {isLoadingSuggestions && (
                <View style={{ position: "absolute", right: 12, top: 42 }}>
                  <ActivityIndicator size="small" color={accent} />
                </View>
              )}
            </View>

            <View style={{ height: 16 }} />

            <AppButton
              title="Rechercher"
              onPress={handleManualSearch}
              loading={isSearching}
              variant="primary"
              style={{ backgroundColor: accent, marginBottom: 24 }}
            />

            {/* Séparateur */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />
              <Text
                style={{
                  marginHorizontal: 16,
                  color: colors.textSecondary,
                  fontFamily: "Outfit_500Medium",
                }}
              >
                OU
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 18,
                fontFamily: "Outfit_600SemiBold",
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              Coordonnées GPS
            </Text>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Latitude"
                  placeholder="0.0000"
                  value={latInput}
                  onChangeText={setLatInput}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Longitude"
                  placeholder="0.0000"
                  value={lngInput}
                  onChangeText={setLngInput}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <AppButton
              title="Appliquer Coordonnées"
              onPress={handleCoordinateSave}
              loading={isSearching}
              variant="outline"
            />

            <Text
              style={{
                marginTop: 16,
                fontSize: 13,
                color: colors.textSecondary,
                fontFamily: "Outfit_400Regular",
                textAlign: "center",
              }}
            >
              Les horaires de prière seront recalculés instantanément.
            </Text>
          </AppCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* AlertDialog */}
      <AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
        buttons={[{ text: "OK", style: "primary" }]}
      />
    </View>
  );
}
