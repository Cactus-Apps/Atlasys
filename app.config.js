module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins,
    "./plugins/withAndroidSizeOptimization",
    "expo-document-picker",
    "expo-sharing",
    [
      "react-native-android-widget/app.plugin",
      {
        widgets: [
          {
            name: "TestWidget",
            label: "Atlasys Test Widget",
            description: "Ein simples Test Widget",
            minWidth: "250dp",
            minHeight: "110dp",
            targetCellWidth: 4,
            targetCellHeight: 2,
            maxResizeWidth: "400dp",
            maxResizeHeight: "400dp",
            resizeMode: "horizontal|vertical",
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
