/**
 * Génère 114 fichiers .bin individuels (un par sourate) dans assets/raw/surahs/
 *
 * Sources :
 *   - assets/raw/quran_fr.bin         → arabe + traduction FR + métadonnées sourate
 *   - assets/quran/chapters/en.json   → titre EN de chaque sourate
 *   - assets/quran/editions/en.json   → traductions EN des versets
 *   - assets/raw/quran_transliteration.bin → translitérations
 *
 * Lancer : node scripts/generateSurahFiles.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const FR_BIN       = path.join(ROOT, "assets/raw/quran_fr.bin");
const TRANS_BIN    = path.join(ROOT, "assets/raw/quran_transliteration.bin");
const CHAPTERS_EN  = path.join(ROOT, "assets/quran/chapters/en.json");
const EDITIONS_EN  = path.join(ROOT, "assets/quran/editions/en.json");
const OUT_DIR      = path.join(ROOT, "assets/raw/surahs");

console.log("📖 Lecture des sources...");

const frData      = JSON.parse(fs.readFileSync(FR_BIN,      "utf8"));
const transData   = JSON.parse(fs.readFileSync(TRANS_BIN,   "utf8"));
const chaptersEn  = JSON.parse(fs.readFileSync(CHAPTERS_EN, "utf8"));
const editionsEn  = JSON.parse(fs.readFileSync(EDITIONS_EN, "utf8"));

// Index rapide : surahId → données EN
const chapEnMap = Object.fromEntries(chaptersEn.map((c) => [c.id, c]));

// Index rapide : surahId → Map<verseNumber, textEN>
const enVerseMap = {};
for (const [surahId, verses] of Object.entries(editionsEn)) {
  enVerseMap[surahId] = {};
  for (const v of verses) {
    enVerseMap[surahId][v.verse] = v.text;
  }
}

// Index rapide : surahId → Map<verseId, transliteration>
const transMap = {};
for (const surah of transData) {
  transMap[surah.id] = {};
  for (const v of surah.verses) {
    transMap[surah.id][v.id] = v.transliteration;
  }
}

console.log("⚙️  Génération des 114 fichiers...");

let count = 0;

for (const surah of frData) {
  const sid       = surah.id;
  const chapEn    = chapEnMap[sid] || {};
  const enVerses  = enVerseMap[sid] || {};
  const transSura = transMap[sid]   || {};

  const verses = surah.verses.map((v) => ({
    id:             v.id,
    text:           v.text,
    translation_fr: v.translation,
    translation_en: enVerses[v.id] || "",
    transliteration: transSura[v.id] || "",
  }));

  const output = {
    id:             sid,
    name:           surah.name,
    transliteration: surah.transliteration,
    translation_fr: surah.translation,
    translation_en: chapEn.translation || "",
    type:           surah.type,
    total_verses:   surah.total_verses,
    verses,
  };

  const outPath = path.join(OUT_DIR, `surah_${sid}.bin`);
  fs.writeFileSync(outPath, JSON.stringify(output), "utf8");
  count++;
}

console.log(`✅ ${count} fichiers générés dans assets/raw/surahs/`);

// Vérification rapide
const sample = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "surah_2.bin"), "utf8"));
console.log(`\n📋 Vérification surah_2 (Al-Baqarah) :`);
console.log(`   - ${sample.total_verses} versets`);
console.log(`   - translation_fr : "${sample.translation_fr}"`);
console.log(`   - translation_en : "${sample.translation_en}"`);
console.log(`   - verset 1 FR : "${sample.verses[0].translation_fr}"`);
console.log(`   - verset 1 EN : "${sample.verses[0].translation_en}"`);
console.log(`   - verset 1 translitération : "${sample.verses[0].transliteration}"`);
