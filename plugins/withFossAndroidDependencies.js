const { withProjectBuildGradle } = require("expo/config-plugins");

const ANCHOR = "allprojects {";
const MARKER = "excluded all com.google.android.gms";

// F-Droid builds must not depend on Google Play Services. None of the runtime
// code paths need them: location runs through the AOSP LocationManager (see
// scripts/patch-geolocation-service.js) and QR decoding runs through ZXing in
// JS. Stripping the group from the dependency graph keeps the Play Services
// artefacts out of the APK instead of shipping them unused.
const BLOCK = [
  "allprojects {",
  `  // ${MARKER}`,
  "  configurations.configureEach {",
  '    exclude group: "com.google.android.gms"',
  "  }",
].join("\n");

module.exports = function withFossAndroidDependencies(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error(
        "withFossAndroidDependencies: expected a Groovy root build.gradle",
      );
    }

    if (cfg.modResults.contents.includes(MARKER)) {
      return cfg;
    }

    if (!cfg.modResults.contents.includes(ANCHOR)) {
      throw new Error(
        `withFossAndroidDependencies: could not find "${ANCHOR}" in the root build.gradle`,
      );
    }

    cfg.modResults.contents = cfg.modResults.contents.replace(
      ANCHOR,
      BLOCK,
    );

    return cfg;
  });
};