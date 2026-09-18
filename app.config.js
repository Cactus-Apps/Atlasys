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
        fonts: [
          "./assets/fonts/DMSans_400Regular.ttf",
          "./assets/fonts/DMSans_500Medium.ttf",
          "./assets/fonts/DMSans_600SemiBold.ttf",
          "./assets/fonts/DMSans_700Bold.ttf",
          "./assets/fonts/Lora_600SemiBold.ttf",
          "./assets/fonts/Lora_700Bold.ttf",
        ],
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
          {
            name: "CompassWidget",
            label: "Atlasys Kompass",
            description: "Kompass Widget",
            minWidth: "110dp",
            minHeight: "110dp",
            targetCellWidth: 2,
            targetCellHeight: 2,
            maxResizeWidth: "250dp",
            maxResizeHeight: "250dp",
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
