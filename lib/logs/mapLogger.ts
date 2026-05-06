import * as Sentry from "@sentry/react-native";

type LogLevel = "debug" | "info" | "warn" | "error" | "none";

export function setupMapLibreLogger(level: LogLevel = "error") {
  try {
    // react-native-maplibre-gl-js nutzt console.* intern
    // Wir überschreiben die relevanten Methoden
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: any[]) => {
      const msg = args.join(" ");
      // Nur MapLibre-Logs abfangen
      if (msg.includes("react-native-maplibre-gl-js")) {
        if (level === "none" || level === "error") return; // unterdrücken
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
        // Fehler immer zu Sentry
        Sentry.captureMessage(`MapLibre: ${msg}`, "error");
        if (level === "none") return; // trotzdem unterdrücken im Log
      }
      originalError(...args);
    };
  } catch (e) {
    // Sentry noch nicht initialisiert – ignorieren
  }
}
