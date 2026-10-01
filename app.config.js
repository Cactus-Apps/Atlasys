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
  },
});
