module.exports = function (api) {
  api.cache(true);

  // En build production, on retire les console.log/info/debug pour ne pas
  // fuiter d'informations dans logcat / les rapports de crash.
  // On garde console.error et console.warn (utiles pour Sentry et le debug
  // en cas de crash réel).
  const isProduction = process.env.NODE_ENV === "production";

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
      ...(isProduction
        ? [
            [
              "transform-remove-console",
              { exclude: ["error", "warn"] },
            ],
          ]
        : []),
    ],
  };
};
