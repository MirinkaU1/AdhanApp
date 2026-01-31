const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Ajouter 'bin' à la liste des extensions de fichiers reconnues comme assets
config.resolver.assetExts.push('bin');

module.exports = withNativeWind(config, { input: './global.css' });
