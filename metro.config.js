const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Handle .wasm files for expo-sqlite
if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

module.exports = config;
