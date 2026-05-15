import * as Sentry from "@sentry/react-native";

type LogLevel = "debug" | "info" | "warn" | "error" | "none";

export function setupMapLibreLogger(level: LogLevel = "error") {
  try {
    // react-native-maplibre-gl-js uses console.* internally; we wrap those methods
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: any[]) => {
      const msg = args.join(" ");
      // Only intercept MapLibre-related logs
      if (msg.includes("react-native-maplibre-gl-js")) {
        if (level === "none" || level === "error") return; // suppress
        Sentry.addBreadcrumb({
          category: "maplibre",
          message: msg,
          level: "warning",
        });
        return;
      }
      originalWarn(...args);
    };

    console.error = (...args: any[]) => {
      const msg = args.join(" ");
      if (msg.includes("react-native-maplibre-gl-js")) {
        // Always forward MapLibre errors to Sentry
        Sentry.captureMessage(`MapLibre: ${msg}`, "error");
        if (level === "none") return; // still suppress console noise
      }
      originalError(...args);
    };
  } catch (e) {
    // Sentry may not be initialized yet — ignore
  }
}
