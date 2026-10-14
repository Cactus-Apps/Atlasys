module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins,
    "./plugins/withAndroidSizeOptimization",
    "./plugins/withFossAndroidDependencies",
    "expo-document-picker",
    "expo-sharing",
  ],
  extra: {
    ...config.extra,
  },
});
