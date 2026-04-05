import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";

export const ONBOARDING_KEY = "ONBOARDING_COMPLETED";

export const setOnboardingCompleted = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  } catch (err: any) {
    Sentry.captureException(err);

    console.error("Fehler beim Speichern:", err);
  }
};

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === "true";
  } catch (err: any) {
    Sentry.captureException(err);

    console.error("Fehler beim Lesen:", err);
    return false;
  }
};
