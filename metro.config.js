const path = require("path");

// Handle .wasm files for expo-sqlite
config.resolver.assetExts = [...(config.resolver.assetExts || []), "wasm"];

// Properly resolve .wasm imports
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), "wasm"];

module.exports = config;
