module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins,
    "./plugins/withAndroidSizeOptimization",
    "expo-document-picker",
    "expo-sharing",
  ],
  extra: {
    ...config.extra,
    posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
    posthogHost: process.env.POSTHOG_HOST,
  },
});
