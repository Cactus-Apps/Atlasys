import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_KEY = "ONBOARDING_COMPLETED";

export const setOnboardingCompleted = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  } catch (e) {
    console.error("Fehler beim Speichern:", e);
  }
};

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === "true";
  } catch (e) {
    console.error("Fehler beim Lesen:", e);
    return false;
  }
};
