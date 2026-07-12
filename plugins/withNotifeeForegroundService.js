const { withAndroidManifest } = require("expo/config-plugins");

function withNotifeeForegroundService(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) return cfg;

    const serviceEntry = {
      $: {
        "android:name": "app.notifee.core.ForegroundService",
        "android:foregroundServiceType": "location|dataSync",
      },
    };

    if (!application.service) {
      application.service = [];
    }

    const exists = application.service.some(
      (s) => s.$?.["android:name"] === "app.notifee.core.ForegroundService",
    );
    if (!exists) {
      application.service.push(serviceEntry);
    }

    return cfg;
  });
}

module.exports = function (config) {
  return withNotifeeForegroundService(config);
};
