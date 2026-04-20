const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const baseTargets = [
  path.join(root, "android", ".gradle"),
  path.join(root, "android", "build"),
  path.join(root, "android", "app", "build"),
  path.join(root, "android", "app", ".cxx"),
];

function removeDir(dirPath, stats) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  fs.rmSync(dirPath, { recursive: true, force: true });
  stats.removed.push(path.relative(root, dirPath));
}

function collectNodeModuleAndroidBuildDirs(nodeModulesPath) {
  if (!fs.existsSync(nodeModulesPath)) {
    return [];
  }

  const result = [];
  const topLevel = fs.readdirSync(nodeModulesPath, { withFileTypes: true });

  for (const entry of topLevel) {
    if (!entry.isDirectory()) {
      continue;
    }

    const entryPath = path.join(nodeModulesPath, entry.name);

    if (entry.name.startsWith("@")) {
      const scoped = fs.readdirSync(entryPath, { withFileTypes: true });
      for (const scopedEntry of scoped) {
        if (!scopedEntry.isDirectory()) {
          continue;
        }
        result.push(path.join(entryPath, scopedEntry.name, "android", "build"));
      }
      continue;
    }

    result.push(path.join(entryPath, "android", "build"));
  }

  return result;
}

function main() {
  const stats = { removed: [] };

  for (const target of baseTargets) {
    removeDir(target, stats);
  }

  const nodeModulesPath = path.join(root, "node_modules");
  const androidBuildDirs = collectNodeModuleAndroidBuildDirs(nodeModulesPath);
  for (const dirPath of androidBuildDirs) {
    removeDir(dirPath, stats);
  }

  if (!stats.removed.length) {
    console.log("Aucun dossier de build local a supprimer.");
    return;
  }

  console.log("Dossiers supprimes:");
  for (const removed of stats.removed) {
    console.log(`- ${removed}`);
  }

  console.log(`Total: ${stats.removed.length}`);
}

main();
