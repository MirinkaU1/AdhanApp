#!/usr/bin/env node

/**
 * Script pour incrémenter la version
 * Usage:
 *   node scripts/bump-version.js patch  (0.1.0 -> 0.1.1)
 *   node scripts/bump-version.js minor  (0.1.0 -> 0.2.0)
 *   node scripts/bump-version.js major  (0.1.0 -> 1.0.0)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const VERSION_FILE = path.join(__dirname, "..", "version.json");

function bumpVersion(type) {
  try {
    // Lire la version actuelle
    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, "utf8"));
    const [major, minor, patch] = versionData.version.split(".").map(Number);

    let newVersion;
    switch (type) {
      case "major":
        newVersion = `${major + 1}.0.0`;
        break;
      case "minor":
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case "patch":
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        console.error("❌ Type invalide. Utilisez: major, minor ou patch");
        process.exit(1);
    }

    console.log(
      `📦 Mise à jour de la version ${versionData.version} -> ${newVersion}`,
    );

    // Mettre à jour version.json
    versionData.version = newVersion;
    fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + "\n");
    console.log("✅ version.json mis à jour");

    // Synchroniser avec les autres fichiers
    console.log("\n🔄 Synchronisation des fichiers...");
    execSync("node scripts/sync-version.js", { stdio: "inherit" });

    console.log(`\n🎉 Version bumped avec succès à ${newVersion} !`);
    console.log(`\n💡 N'oubliez pas de commit et tag:`);
    console.log(`   git add .`);
    console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
    console.log(`   git tag v${newVersion}`);
    console.log(`   git push && git push --tags`);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

const type = process.argv[2];
if (!type) {
  console.error("❌ Usage: node scripts/bump-version.js [major|minor|patch]");
  process.exit(1);
}

bumpVersion(type);
