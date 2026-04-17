/**
 * QuranLoader v2 — Chargement par sourate individuelle
 *
 * Chaque sourate est un fichier .bin séparé (~2–300 Ko).
 * On ne charge plus jamais les 7 Mo d'un coup.
 *
 * Flux :
 *   1. Premier lancement → copie des assets vers FileSystem (à la demande)
 *   2. loadSurah(id, lang) → lit un seul fichier depuis FileSystem
 *   3. Cache mémoire par sourate chargée
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SURAH_ASSETS, QURAN_INDEX_ASSET } from './surahAssets';

// ── Types publics ─────────────────────────────────────────────────────────────

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
  type: 'meccan' | 'medinan';
  total_verses: number;
  verses: QuranVerse[];
}

export interface SurahIndexInfo {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: 'meccan' | 'medinan';
  total_verses: number;
}

// ── Format de stockage interne ────────────────────────────────────────────────

interface StoredVerse {
  id: number;
  text: string;
  translation_fr: string;
  translation_en: string;
  transliteration: string;
}

interface StoredSurah {
  id: number;
  name: string;
  transliteration: string;
  translation_fr: string;
  translation_en: string;
  type: 'meccan' | 'medinan';
  total_verses: number;
  verses: StoredVerse[];
}

// ── Chemins ───────────────────────────────────────────────────────────────────

const SURAHS_DIR = FileSystem.documentDirectory + 'quran/surahs/';
const INDEX_FILE = FileSystem.documentDirectory + 'quran/index.bin';

const ASYNC_INDEX_FR = '@quran_index_fr_v2';
const ASYNC_INDEX_EN = '@quran_index_en_v2';

// ── Cache mémoire par sourate ─────────────────────────────────────────────────

const surahCache = new Map<number, StoredSurah>();
let indexCacheFr: SurahIndexInfo[] | null = null;
let indexCacheEn: SurahIndexInfo[] | null = null;

// ── Helpers filesystem ────────────────────────────────────────────────────────

async function ensureSurahsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(SURAHS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SURAHS_DIR, { intermediates: true });
  }
}

async function copyAssetToFs(assetModule: number, destPath: string): Promise<void> {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('Asset sans URI locale');
  await FileSystem.copyAsync({ from: asset.localUri, to: destPath });
}

// ── Chargement de l'index ─────────────────────────────────────────────────────

export function getSurahIndexSync(language = 'fr'): SurahIndexInfo[] | null {
  return language === 'fr' ? indexCacheFr : indexCacheEn;
}

export async function loadSurahIndex(language = 'fr'): Promise<SurahIndexInfo[]> {
  const isFr = language === 'fr';

  if (isFr && indexCacheFr) return indexCacheFr;
  if (!isFr && indexCacheEn) return indexCacheEn;

  const storageKey = isFr ? ASYNC_INDEX_FR : ASYNC_INDEX_EN;

  // Essai depuis AsyncStorage
  try {
    const stored = await AsyncStorage.getItem(storageKey);
    if (stored) {
      const index: SurahIndexInfo[] = JSON.parse(stored);
      if (isFr) indexCacheFr = index; else indexCacheEn = index;
      return index;
    }
  } catch {}

  // Construire depuis le fichier index
  const indexData = await loadIndexFile();
  const index: SurahIndexInfo[] = indexData.map((s) => ({
    id: s.id,
    name: s.name,
    transliteration: s.transliteration,
    translation: isFr ? s.translation_fr : s.translation_en,
    type: s.type,
    total_verses: s.total_verses,
  }));

  if (isFr) indexCacheFr = index; else indexCacheEn = index;
  await AsyncStorage.setItem(storageKey, JSON.stringify(index));
  return index;
}

async function loadIndexFile(): Promise<Array<{
  id: number; name: string; transliteration: string;
  translation_fr: string; translation_en: string;
  type: 'meccan' | 'medinan'; total_verses: number;
}>> {
  const info = await FileSystem.getInfoAsync(INDEX_FILE);
  if (!info.exists) {
    await ensureSurahsDir();
    await copyAssetToFs(QURAN_INDEX_ASSET, INDEX_FILE);
  }
  const content = await FileSystem.readAsStringAsync(INDEX_FILE);
  return JSON.parse(content);
}

// ── Chargement d'une sourate ──────────────────────────────────────────────────

export async function loadSurah(
  surahNumber: number,
  language = 'fr',
): Promise<QuranSurah | null> {
  if (surahNumber < 1 || surahNumber > 114) return null;

  // 1. Cache mémoire
  if (surahCache.has(surahNumber)) {
    return mapToPublic(surahCache.get(surahNumber)!, language);
  }

  // 2. Filesystem
  const filePath = SURAHS_DIR + `surah_${surahNumber}.bin`;
  const info = await FileSystem.getInfoAsync(filePath);

  if (!info.exists) {
    await ensureSurahsDir();
    const asset = SURAH_ASSETS[surahNumber];
    if (!asset) return null;
    await copyAssetToFs(asset, filePath);
  }

  const content = await FileSystem.readAsStringAsync(filePath);
  const stored: StoredSurah = JSON.parse(content);
  surahCache.set(surahNumber, stored);

  return mapToPublic(stored, language);
}

function mapToPublic(stored: StoredSurah, language: string): QuranSurah {
  const isFr = language === 'fr';
  return {
    id: stored.id,
    name: stored.name,
    transliteration: stored.transliteration,
    translation: isFr ? stored.translation_fr : stored.translation_en,
    type: stored.type,
    total_verses: stored.total_verses,
    verses: stored.verses.map((v) => ({
      id: v.id,
      text: v.text,
      translation: isFr ? v.translation_fr : v.translation_en,
      transliteration: v.transliteration,
    })),
  };
}

// ── Préchargement au démarrage ────────────────────────────────────────────────

export async function preloadQuranToStorage(): Promise<void> {
  // Préchauffer les index (18 Ko seulement)
  await Promise.all([loadSurahIndex('fr'), loadSurahIndex('en')]);
}

// ── Utilitaires ───────────────────────────────────────────────────────────────

export async function getVerse(
  surahNumber: number,
  verseNumber: number,
  language = 'fr',
): Promise<QuranVerse | null> {
  const surah = await loadSurah(surahNumber, language);
  return surah?.verses.find((v) => v.id === verseNumber) ?? null;
}

export async function loadEssentialSurahs(language = 'fr'): Promise<QuranSurah[]> {
  const essentialIds = [1, 67, 18, 94, 112, 113, 114];
  const results = await Promise.all(essentialIds.map((id) => loadSurah(id, language)));
  return results.filter((s): s is QuranSurah => s !== null);
}

export function isSurahIndexCached(language = 'fr'): boolean {
  return language === 'fr' ? indexCacheFr !== null : indexCacheEn !== null;
}

export async function clearQuranCache(): Promise<void> {
  surahCache.clear();
  indexCacheFr = null;
  indexCacheEn = null;
  await AsyncStorage.multiRemove([ASYNC_INDEX_FR, ASYNC_INDEX_EN]);
}

export async function resetQuranLoader(): Promise<void> {
  await clearQuranCache();
  try {
    const info = await FileSystem.getInfoAsync(SURAHS_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(SURAHS_DIR, { idempotent: true });
    }
    const indexInfo = await FileSystem.getInfoAsync(INDEX_FILE);
    if (indexInfo.exists) {
      await FileSystem.deleteAsync(INDEX_FILE, { idempotent: true });
    }
  } catch (error) {
    console.warn('Erreur reset QuranLoader:', error);
  }
}

// ── Compat avec l'ancien loader ───────────────────────────────────────────────

/** @deprecated — conservé pour compatibilité, ne fait plus rien de coûteux */
export async function initQuranLoader(): Promise<void> {
  await preloadQuranToStorage();
}

export async function isQuranPersisted(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(INDEX_FILE);
  return info.exists;
}
