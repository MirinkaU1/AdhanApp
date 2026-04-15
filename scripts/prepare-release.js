#!/usr/bin/env node

/**
 * Script pour préparer une release avec l'APK/AAB Android
 * Usage: node scripts/prepare-release.js
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const VERSION_FILE = path.join(ROOT_DIR, "version.json");
const RELEASES_DIR = path.join(ROOT_DIR, "releases");

// Chemins des builds Android
const APK_SOURCE = path.join(
  ROOT_DIR,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
);
const AAB_SOURCE = path.join(
  ROOT_DIR,
  "android",
  "app",
  "build",
  "outputs",
  "bundle",
  "release",
);

function prepareRelease() {
  try {
    // Lire la version
    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, "utf8"));
    const version = versionData.version;

    console.log(`📦 Préparation de la release v${version}...\n`);

    // Créer le dossier releases s'il n'existe pas
    if (!fs.existsSync(RELEASES_DIR)) {
      fs.mkdirSync(RELEASES_DIR, { recursive: true });
      console.log("✅ Dossier releases/ créé");
    }

    // Chercher l'APK
    if (fs.existsSync(APK_SOURCE)) {
      const apkFiles = fs
        .readdirSync(APK_SOURCE)
        .filter((f) => f.endsWith(".apk"));

      if (apkFiles.length > 0) {
        const sourceApk = path.join(APK_SOURCE, apkFiles[0]);
        const targetApk = path.join(RELEASES_DIR, `AdhanApp_v${version}.apk`);

        fs.copyFileSync(sourceApk, targetApk);
        const stats = fs.statSync(targetApk);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`✅ APK copié: AdhanApp_v${version}.apk (${sizeMB} MB)`);
      } else {
        console.log(
          "⚠️  Aucun APK trouvé. Lancez d'abord: cd android && ./gradlew assembleRelease",
        );
      }
    } else {
      console.log("⚠️  Dossier de build APK non trouvé");
    }

    // Chercher l'AAB (Android App Bundle)
    if (fs.existsSync(AAB_SOURCE)) {
      const aabFiles = fs
        .readdirSync(AAB_SOURCE)
        .filter((f) => f.endsWith(".aab"));

      if (aabFiles.length > 0) {
        const sourceAab = path.join(AAB_SOURCE, aabFiles[0]);
        const targetAab = path.join(RELEASES_DIR, `AdhanApp_v${version}.aab`);

        fs.copyFileSync(sourceAab, targetAab);
        const stats = fs.statSync(targetAab);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`✅ AAB copié: AdhanApp_v${version}.aab (${sizeMB} MB)`);
      }
    }

    console.log(`\n🎉 Release v${version} prête dans le dossier releases/`);
    console.log(`\n📋 Étapes suivantes:`);
    console.log(`   1. Créer le tag: git tag v${version}`);
    console.log(`   2. Push le tag: git push --tags`);
    console.log(`   3. Créer la release sur GitHub`);
    console.log(
      `   4. Glisser-déposer les fichiers du dossier releases/ dans la release`,
    );
    console.log(`\n💡 Tip: Pour automatiser avec GitHub CLI:`);
    console.log(
      `   gh release create v${version} releases/* --title "Release v${version}" --notes-file GITHUB_RELEASE.md`,
    );
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

prepareRelease();
