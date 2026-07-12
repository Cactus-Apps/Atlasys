const { withGradleProperties } = require("expo/config-plugins");

function setProp(props, key, value) {
  const idx = props.findIndex((p) => p.type === "property" && p.key === key);
  if (idx >= 0) {
    props[idx].value = value;
  } else {
    props.push({ type: "property", key, value });
  }
}

function withAndroidBuildOptimizations(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;

    // Reduce ABIs: remove x86 and x86_64
    setProp(props, "reactNativeArchitectures", "armeabi-v7a,arm64-v8a");

    // Disable New Architecture
    setProp(props, "newArchEnabled", "false");

    // Enable R8 minification
    setProp(props, "android.enableMinifyInReleaseBuilds", "true");

    // Enable resource shrinking
    setProp(props, "android.enableShrinkResourcesInReleaseBuilds", "true");

    return cfg;
  });
}

module.exports = function (config) {
  return withAndroidBuildOptimizations(config);
};
