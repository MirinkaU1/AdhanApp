#!/usr/bin/env node

/**
 * Script pour synchroniser la version depuis version.json vers package.json et app.json
 * Usage: node scripts/sync-version.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const VERSION_FILE = path.join(ROOT_DIR, 'version.json');
const PACKAGE_FILE = path.join(ROOT_DIR, 'package.json');
const APP_FILE = path.join(ROOT_DIR, 'app.json');

function syncVersion() {
  try {
    // Lire la version depuis version.json
    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    const version = versionData.version;

    if (!version) {
      console.error('❌ Version non trouvée dans version.json');
      process.exit(1);
    }

    console.log(`📦 Synchronisation de la version ${version}...`);

    // Mettre à jour package.json
    const packageData = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));
    packageData.version = version;
    fs.writeFileSync(PACKAGE_FILE, JSON.stringify(packageData, null, 2) + '\n');
    console.log('✅ package.json mis à jour');

    // Mettre à jour app.json
    const appData = JSON.parse(fs.readFileSync(APP_FILE, 'utf8'));
    appData.expo.version = version;
    fs.writeFileSync(APP_FILE, JSON.stringify(appData, null, 2) + '\n');
    console.log('✅ app.json mis à jour');

    console.log(`\n🎉 Version ${version} synchronisée avec succès !`);
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation :', error.message);
    process.exit(1);
  }
}

syncVersion();
