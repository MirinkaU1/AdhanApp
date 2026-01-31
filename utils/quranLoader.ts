// Service de chargement du Quran - Version avec persistence AsyncStorage
// Charge les données depuis assets/raw/ via expo-file-system/legacy
// ET les persiste dans AsyncStorage pour un accès ultra-rapide aux lancements suivants

import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuranVerse {
  id: number;
  text: string;
  translation: string;
}

export interface QuranSurah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: "meccan" | "medinan";
  total_verses: number;
  verses: QuranVerse[];
}

export interface SurahIndexInfo {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: "meccan" | "medinan";
  total_verses: number;
}

const QURAN_DIR = FileSystem.documentDirectory + 'quran/';
const FR_FILE = QURAN_DIR + 'quran_fr.json';
const EN_FILE = QURAN_DIR + 'quran_en.json';
const ASYNC_STORAGE_FR_DATA = '@quran_fr_data';
const ASYNC_STORAGE_EN_DATA = '@quran_en_data';
const ASYNC_STORAGE_FR_INDEX = '@quran_fr_index';
const ASYNC_STORAGE_EN_INDEX = '@quran_en_index';

// Noms des fichiers source dans assets/raw/
const FR_FILENAME = 'quran_fr.bin';
const EN_FILENAME = 'quran_en.bin';

// Imports des fichiers .bin (configurés dans metro.config.js)
// @ts-ignore
const FR_ASSET = require('../assets/raw/quran_fr.bin');
// @ts-ignore
const EN_ASSET = require('../assets/raw/quran_en.bin');

// Cache en mémoire pour la session actuelle (ultra-rapide)
const memoryCache: {
  frData: QuranSurah[] | null;
  enData: QuranSurah[] | null;
  frIndex: SurahIndexInfo[] | null;
  enIndex: SurahIndexInfo[] | null;
  isInitialized: boolean;
} = {
  frData: null,
  enData: null,
  frIndex: null,
  enIndex: null,
  isInitialized: false,
};

/**
 * Sauvegarde les données dans AsyncStorage
 */
async function saveToStorage(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erreur sauvegarde ${key}:`, error);
  }
}

/**
 * Charge les données depuis AsyncStorage
 */
async function loadFromStorage(key: string): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Erreur chargement ${key}:`, error);
    return null;
  }
}

/**
 * Charge un asset depuis assets/raw/ et retourne son URI locale
 */
async function loadRawAsset(assetModule: any): Promise<string | null> {
  try {
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    
    if (!asset.localUri) {
      console.error("Asset téléchargé mais pas d'URI locale");
      return null;
    }
    
    return asset.localUri;
  } catch (error) {
    console.error('Erreur chargement asset:', error);
    return null;
  }
}

/**
 * Initialise le service en copiant les fichiers depuis assets vers FileSystem
 * À appeler au démarrage de l'app
 */
export async function initQuranLoader(): Promise<void> {
  if (memoryCache.isInitialized) return;

  try {
    // Créer le répertoire s'il n'existe pas
    const dirInfo = await FileSystem.getInfoAsync(QURAN_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(QURAN_DIR, { intermediates: true });
    }

    // Copier le fichier français s'il n'existe pas
    const frInfo = await FileSystem.getInfoAsync(FR_FILE);
    if (!frInfo.exists) {
      const frSource = await loadRawAsset(FR_ASSET);
      if (frSource) {
        await FileSystem.copyAsync({
          from: frSource,
          to: FR_FILE
        });
        console.log('✅ Quran FR copié dans le cache fichiers');
      } else {
        throw new Error('Impossible de charger quran_fr.bin');
      }
    }

    // Copier le fichier anglais s'il n'existe pas
    const enInfo = await FileSystem.getInfoAsync(EN_FILE);
    if (!enInfo.exists) {
      const enSource = await loadRawAsset(EN_ASSET);
      if (enSource) {
        await FileSystem.copyAsync({
          from: enSource,
          to: EN_FILE
        });
        console.log('✅ Quran EN copié dans le cache fichiers');
      } else {
        throw new Error('Impossible de charger quran_en.bin');
      }
    }

    memoryCache.isInitialized = true;
    console.log('✅ QuranLoader initialisé avec succès');
  } catch (error) {
    console.error('Erreur initialisation QuranLoader:', error);
    throw error;
  }
}

/**
 * Charge les données du Quran depuis AsyncStorage ou FileSystem
 * Ultra-rapide si déjà en AsyncStorage
 */
async function getQuranData(language: string): Promise<QuranSurah[]> {
  const cacheKey = language === "fr" ? "frData" : "enData";
  const storageKey = language === "fr" ? ASYNC_STORAGE_FR_DATA : ASYNC_STORAGE_EN_DATA;
  
  // 1. Vérifier le cache mémoire (instantané)
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey]!;
  }
  
  // 2. Essayer AsyncStorage (très rapide, <100ms)
  const storedData = await loadFromStorage(storageKey);
  if (storedData) {
    memoryCache[cacheKey] = storedData;
    return storedData;
  }
  
  // 3. Charger depuis les fichiers (lent, 2-3s, première fois seulement)
  if (!memoryCache.isInitialized) {
    await initQuranLoader();
  }

  const fileUri = language === "fr" ? FR_FILE : EN_FILE;
  const content = await FileSystem.readAsStringAsync(fileUri);
  const data = JSON.parse(content) as QuranSurah[];
  
  // Mettre en cache mémoire
  memoryCache[cacheKey] = data;
  
  // Sauvegarder dans AsyncStorage pour les prochains lancements
  await saveToStorage(storageKey, data);
  
  return data;
}

/**
 * Récupère l'index depuis le cache de manière synchrone
 * Retourne null si pas encore en mémoire
 */
export function getSurahIndexSync(language: string = "fr"): SurahIndexInfo[] | null {
  const cacheKey = language === "fr" ? "frIndex" : "enIndex";
  return memoryCache[cacheKey];
}

/**
 * Charge l'index de toutes les sourates
 * Version optimisée : AsyncStorage d'abord, puis cache mémoire
 */
export async function loadSurahIndex(language: string = "fr"): Promise<SurahIndexInfo[]> {
  const cacheKey = language === "fr" ? "frIndex" : "enIndex";
  const storageKey = language === "fr" ? ASYNC_STORAGE_FR_INDEX : ASYNC_STORAGE_EN_INDEX;
  
  // 1. Cache mémoire (instantané)
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey]!;
  }
  
  // 2. AsyncStorage (très rapide)
  const storedIndex = await loadFromStorage(storageKey);
  if (storedIndex) {
    memoryCache[cacheKey] = storedIndex;
    return storedIndex;
  }
  
  // 3. Générer depuis les données complètes
  const data = await getQuranData(language);
  const index: SurahIndexInfo[] = data.map((surah) => ({
    id: surah.id,
    name: surah.name,
    transliteration: surah.transliteration,
    translation: surah.translation,
    type: surah.type,
    total_verses: surah.total_verses,
  }));

  // Mettre en cache mémoire et AsyncStorage
  memoryCache[cacheKey] = index;
  await saveToStorage(storageKey, index);
  
  return index;
}

/**
 * Vérifie si les données sont déjà persistées dans AsyncStorage
 */
export async function isQuranPersisted(): Promise<boolean> {
  const frData = await AsyncStorage.getItem(ASYNC_STORAGE_FR_DATA);
  return frData !== null;
}

/**
 * Précharge tout le Quran dans AsyncStorage au premier lancement
 * À appeler dans _layout.tsx au démarrage de l'app
 */
export async function preloadQuranToStorage(): Promise<void> {
  const isPersisted = await isQuranPersisted();
  
  if (!isPersisted) {
    console.log('📚 Premier lancement : Préchargement du Quran...');
    // Charger et sauvegarder les deux langues
    await getQuranData('fr');
    await getQuranData('en');
    await loadSurahIndex('fr');
    await loadSurahIndex('en');
    console.log('✅ Quran préchargé et persisté !');
  }
}

/**
 * Vérifie si l'index est déjà en cache mémoire
 */
export function isSurahIndexCached(language: string = "fr"): boolean {
  const cacheKey = language === "fr" ? "frIndex" : "enIndex";
  return memoryCache[cacheKey] !== null;
}

/**
 * Charge une sourate spécifique avec tous ses versets
 */
export async function loadSurah(
  surahNumber: number,
  language: string = "fr"
): Promise<QuranSurah | null> {
  const data = await getQuranData(language);
  return data.find((s) => s.id === surahNumber) || null;
}

/**
 * Recherche un verset spécifique
 */
export async function getVerse(
  surahNumber: number,
  verseNumber: number,
  language: string = "fr"
): Promise<QuranVerse | null> {
  const surah = await loadSurah(surahNumber, language);
  if (!surah) return null;
  return surah.verses.find((v) => v.id === verseNumber) || null;
}

/**
 * Récupère les sourates essentielles (favorites)
 */
export async function loadEssentialSurahs(language: string = "fr"): Promise<QuranSurah[]> {
  const essentialIds = [1, 67, 18, 94, 112, 113, 114];
  const surahs = await Promise.all(
    essentialIds.map((id) => loadSurah(id, language))
  );
  return surahs.filter((s): s is QuranSurah => s !== null);
}

/**
 * Vide tous les caches (mémoire + AsyncStorage)
 */
export async function clearQuranCache(): Promise<void> {
  // Vider mémoire
  memoryCache.frData = null;
  memoryCache.enData = null;
  memoryCache.frIndex = null;
  memoryCache.enIndex = null;
  
  // Vider AsyncStorage
  await AsyncStorage.multiRemove([
    ASYNC_STORAGE_FR_DATA,
    ASYNC_STORAGE_EN_DATA,
    ASYNC_STORAGE_FR_INDEX,
    ASYNC_STORAGE_EN_INDEX,
  ]);
}

/**
 * Force la réinitialisation complète
 */
export async function resetQuranLoader(): Promise<void> {
  await clearQuranCache();
  memoryCache.isInitialized = false;
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(QURAN_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(QURAN_DIR, { idempotent: true });
    }
  } catch (error) {
    console.warn('Erreur lors du reset:', error);
  }
}
