// Service de chargement du Quran - Support FR + EN avec translitération
// Charge les données depuis assets/raw/ via expo-file-system/legacy
// ET les persiste dans AsyncStorage pour un accès ultra-rapide aux lancements suivants

import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuranVerse {
  id: number;
  text: string;
  translation: string;
  transliteration?: string;
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
const PHONETIC_FILE = QURAN_DIR + 'quran_transliteration.json';

const ASYNC_STORAGE_FR_DATA = '@quran_fr_data';
const ASYNC_STORAGE_EN_DATA = '@quran_en_data';
const ASYNC_STORAGE_PHONETIC_DATA = '@quran_phonetic_data';
const ASYNC_STORAGE_FR_INDEX = '@quran_fr_index';
const ASYNC_STORAGE_EN_INDEX = '@quran_en_index';

// Imports des fichiers .bin
// @ts-ignore
const FR_ASSET = require('../assets/raw/quran_fr.bin');
// @ts-ignore
const EN_ASSET = require('../assets/raw/quran_en.bin');
// @ts-ignore
const PHONETIC_ASSET = require('../assets/raw/quran_transliteration.bin');

// Cache en mémoire
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

async function saveToStorage(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erreur sauvegarde ${key}:`, error);
  }
}

async function loadFromStorage(key: string): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Erreur chargement ${key}:`, error);
    return null;
  }
}

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

function mergeQuranData(translationData: any[], phoneticData: any[]): QuranSurah[] {
  return translationData.map((surah) => {
    const surahPhone = phoneticData.find((s: any) => s.id === surah.id);

    const mergedVerses = surah.verses.map((verse: any) => {
      const versePhone = surahPhone?.verses.find((v: any) => v.id === verse.id);
      
      return {
        id: verse.id,
        text: verse.text,
        translation: verse.translation,
        transliteration: versePhone?.transliteration || "",
      };
    });

    return {
      ...surah,
      verses: mergedVerses
    };
  });
}

export async function initQuranLoader(): Promise<void> {
  if (memoryCache.isInitialized) return;

  try {
    const dirInfo = await FileSystem.getInfoAsync(QURAN_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(QURAN_DIR, { intermediates: true });
    }

    // Copier FR
    const frInfo = await FileSystem.getInfoAsync(FR_FILE);
    if (!frInfo.exists) {
      const frSource = await loadRawAsset(FR_ASSET);
      if (frSource) {
        await FileSystem.copyAsync({ from: frSource, to: FR_FILE });
        console.log('✅ Quran FR copié');
      }
    }

    // Copier EN
    const enInfo = await FileSystem.getInfoAsync(EN_FILE);
    if (!enInfo.exists) {
      const enSource = await loadRawAsset(EN_ASSET);
      if (enSource) {
        await FileSystem.copyAsync({ from: enSource, to: EN_FILE });
        console.log('✅ Quran EN copié');
      }
    }

    // Copier translitération
    const phoneticInfo = await FileSystem.getInfoAsync(PHONETIC_FILE);
    if (!phoneticInfo.exists) {
      const phoneticSource = await loadRawAsset(PHONETIC_ASSET);
      if (phoneticSource) {
        await FileSystem.copyAsync({ from: phoneticSource, to: PHONETIC_FILE });
        console.log('✅ Quran Transliteration copié');
      }
    }

    memoryCache.isInitialized = true;
    console.log('✅ QuranLoader initialisé');
  } catch (error) {
    console.error('Erreur initialisation QuranLoader:', error);
    throw error;
  }
}

async function getQuranData(language: string = "fr"): Promise<QuranSurah[]> {
  const isFr = language === "fr";
  const storageKey = isFr ? ASYNC_STORAGE_FR_DATA : ASYNC_STORAGE_EN_DATA;
  const cacheKey = isFr ? "frData" : "enData";

  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey]!;
  }

  const storedData = await loadFromStorage(storageKey);
  if (storedData) {
    memoryCache[cacheKey] = storedData;
    return storedData;
  }

  if (!memoryCache.isInitialized) {
    await initQuranLoader();
  }

  const translationContent = await FileSystem.readAsStringAsync(isFr ? FR_FILE : EN_FILE);
  const phoneticContent = await FileSystem.readAsStringAsync(PHONETIC_FILE);
  
  const translationJson = JSON.parse(translationContent);
  const phoneticJson = JSON.parse(phoneticContent);
  
  const mergedData = mergeQuranData(translationJson, phoneticJson);
  
  memoryCache[cacheKey] = mergedData;
  await saveToStorage(storageKey, mergedData);
  
  return mergedData;
}

export function getSurahIndexSync(language: string = "fr"): SurahIndexInfo[] | null {
  return language === "fr" ? memoryCache.frIndex : memoryCache.enIndex;
}

export async function loadSurahIndex(language: string = "fr"): Promise<SurahIndexInfo[]> {
  const isFr = language === "fr";
  const cacheKey = isFr ? "frIndex" : "enIndex";
  const storageKey = isFr ? ASYNC_STORAGE_FR_INDEX : ASYNC_STORAGE_EN_INDEX;

  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey]!;
  }

  const storedIndex = await loadFromStorage(storageKey);
  if (storedIndex) {
    memoryCache[cacheKey] = storedIndex;
    return storedIndex;
  }

  const data = await getQuranData(language);
  const index: SurahIndexInfo[] = data.map((surah) => ({
    id: surah.id,
    name: surah.name,
    transliteration: surah.transliteration,
    translation: surah.translation,
    type: surah.type,
    total_verses: surah.total_verses,
  }));

  memoryCache[cacheKey] = index;
  await saveToStorage(storageKey, index);
  
  return index;
}

export async function isQuranPersisted(): Promise<boolean> {
  const frData = await AsyncStorage.getItem(ASYNC_STORAGE_FR_DATA);
  return frData !== null;
}

export async function preloadQuranToStorage(): Promise<void> {
  const isPersisted = await isQuranPersisted();
  
  if (!isPersisted) {
    console.log('📚 Premier lancement : Préchargement du Quran...');
    await getQuranData('fr');
    await getQuranData('en');
    await loadSurahIndex('fr');
    await loadSurahIndex('en');
    console.log('✅ Quran préchargé !');
  }
}

export function isSurahIndexCached(language: string = "fr"): boolean {
  return language === "fr" ? memoryCache.frIndex !== null : memoryCache.enIndex !== null;
}

export async function loadSurah(
  surahNumber: number,
  language: string = "fr"
): Promise<QuranSurah | null> {
  const data = await getQuranData(language);
  return data.find((s) => s.id === surahNumber) || null;
}

export async function getVerse(
  surahNumber: number,
  verseNumber: number,
  language: string = "fr"
): Promise<QuranVerse | null> {
  const surah = await loadSurah(surahNumber, language);
  if (!surah) return null;
  return surah.verses.find((v) => v.id === verseNumber) || null;
}

export async function loadEssentialSurahs(language: string = "fr"): Promise<QuranSurah[]> {
  const essentialIds = [1, 67, 18, 94, 112, 113, 114];
  const surahs = await Promise.all(
    essentialIds.map((id) => loadSurah(id, language))
  );
  return surahs.filter((s): s is QuranSurah => s !== null);
}

export async function clearQuranCache(): Promise<void> {
  memoryCache.frData = null;
  memoryCache.enData = null;
  memoryCache.frIndex = null;
  memoryCache.enIndex = null;
  
  await AsyncStorage.multiRemove([
    ASYNC_STORAGE_FR_DATA,
    ASYNC_STORAGE_EN_DATA,
    ASYNC_STORAGE_PHONETIC_DATA,
    ASYNC_STORAGE_FR_INDEX,
    ASYNC_STORAGE_EN_INDEX,
  ]);
}

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
