import * as Updates from "expo-updates";
import * as Sentry from "@sentry/react-native";

/** Prüft und lädt OTA-Updates im Hintergrund (wirkt beim nächsten App-Start). */
export async function runExpoUpdateCheck(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
    }
  } catch (error) {
    Sentry.captureException(error);
  }
}
