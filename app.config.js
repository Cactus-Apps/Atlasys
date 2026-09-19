module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins,
    "./plugins/withAndroidSizeOptimization",
    "expo-document-picker",
    "expo-sharing",
    [
      "expo-widgets",
      {
        enableAndroid: true,
        widgets: [
          {
            name: "TestWidget",
            displayName: "Atlasys Test Widget",
            description: "Ein simples Test Widget",
            android: {
              minWidth: 250,
              minHeight: 110,
              targetCellWidth: 4,
              targetCellHeight: 2,
              resizeMode: "both",
              initialLayout: "./widgets/test-widget",
            },
            ios: {
              supportedFamilies: ["systemSmall", "systemMedium", "systemLarge"],
              initialLayout: "./widgets/test-widget",
            },
          },
          {
            name: "CompassWidget",
            displayName: "Atlasys Kompass",
            description: "Kompass Widget",
            android: {
              minWidth: 110,
              minHeight: 110,
              targetCellWidth: 2,
              targetCellHeight: 2,
              resizeMode: "both",
            },
            ios: {
              supportedFamilies: ["systemSmall", "systemMedium"],
            },
          },
          {
            name: "MapWidget",
            displayName: "Atlasys Karte",
            description: "Karte der geteilten Standorte",
            android: {
              minWidth: 250,
              minHeight: 110,
              targetCellWidth: 4,
              targetCellHeight: 2,
              resizeMode: "both",
            },
            ios: {
              supportedFamilies: ["systemSmall", "systemMedium", "systemLarge"],
            },
          },
        ],
      },
    ],
  ],
  extra: {
    ...config.extra,
    posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
    posthogHost: process.env.POSTHOG_HOST,
  },
});
