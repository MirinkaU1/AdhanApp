import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import fr from "./translations/fr";
import en from "./translations/en";

const LANGUAGE_STORAGE_KEY = "@app_language";

// Ressources de traduction
const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

// Détecte la langue du système
const getDeviceLanguage = (): string => {
  const locale = Localization.getLocales()[0]?.languageCode || "fr";
  return locale === "en" ? "en" : "fr"; // Par défaut français
};

// Initialisation d'i18next
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: "fr",
  compatibilityJSON: "v4",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Charger la langue sauvegardée
export const loadSavedLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLang && (savedLang === "fr" || savedLang === "en")) {
      await i18n.changeLanguage(savedLang);
    }
  } catch (error) {
    console.log("Erreur chargement langue:", error);
  }
};

// Changer et sauvegarder la langue
export const changeLanguage = async (lang: "fr" | "en") => {
  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (error) {
    console.log("Erreur changement langue:", error);
  }
};

// Obtenir la langue courante
export const getCurrentLanguage = (): "fr" | "en" => {
  return (i18n.language as "fr" | "en") || "fr";
};

export default i18n;
