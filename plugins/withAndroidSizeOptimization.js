const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PROPS_TO_SET = {
  reactNativeArchitectures: "armeabi-v7a,arm64-v8a",
  newArchEnabled: "false",
  "android.enableMinifyInReleaseBuilds": "true",
  "android.enableShrinkResourcesInReleaseBuilds": "true",
};

module.exports = function withAndroidSizeOptimization(config) {
  return withDangerousMod(config, [
    "android",
    (cfg) => {
      const gradlePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "gradle.properties",
      );
      let contents = fs.readFileSync(gradlePath, "utf-8");

      for (const [key, value] of Object.entries(PROPS_TO_SET)) {
        const regex = new RegExp(`^${key.replace(/\./g, "\\.")}=.*$`, "m");
        if (regex.test(contents)) {
          contents = contents.replace(regex, `${key}=${value}`);
        } else {
          contents += `\n${key}=${value}`;
        }
      }

      fs.writeFileSync(gradlePath, contents);
      return cfg;
    },
  ]);
};
