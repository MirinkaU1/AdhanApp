const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Ajouter 'bin' à la liste des extensions de fichiers reconnues comme assets
config.resolver.assetExts.push('bin');

// ── NativeWind ───────────────────────────────────────────────────────────────
// withNativeWind modifie babelTransformerPath ; on doit appliquer le transformer
// SVG APRÈS pour ne pas être écrasé.
const nativeWindConfig = withNativeWind(config, { input: './global.css' });

// ── SVG transformer ──────────────────────────────────────────────────────────
// Appliqué en dernier pour prendre la priorité sur le transformer Babel de NativeWind.
// Les fichiers .svg sont transformés en composants React via react-native-svg-transformer,
// qui délègue ensuite au transformer précédent (NativeWind) pour les fichiers non-SVG.
nativeWindConfig.transformer = {
  ...nativeWindConfig.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
nativeWindConfig.resolver = {
  ...nativeWindConfig.resolver,
  // Retirer 'svg' des assets (traité comme source, pas comme image statique)
  assetExts: nativeWindConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...nativeWindConfig.resolver.sourceExts, 'svg'],
};

module.exports = nativeWindConfig;
