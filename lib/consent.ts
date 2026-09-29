import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";
import * as Application from "expo-application";
import { Platform } from "react-native";

export const CONSENT_VERSION = "1.2";
export const CONSENT_KEY = "atlasys_consent_v" + CONSENT_VERSION;
export const APP_VERSION = Application.nativeApplicationVersion ?? "dev";

export type StoredConsent = {
  version: string;
  acceptedAt: string;
  platform: string;
};

export async function getStoredConsent(): Promise<StoredConsent | null> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as StoredConsent;
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}

export async function hasAcceptedCurrentConsent(): Promise<boolean> {
  const consent = await getStoredConsent();
  return !!consent && consent.version === CONSENT_VERSION;
}

export async function saveConsentLocally(): Promise<void> {
  await AsyncStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
      platform: Platform.OS,
    }),
  );
}

export async function syncConsentToServer(
  userId: string,
  supabase: any,
): Promise<void> {
  try {
    const consent = await getStoredConsent();
    if (!consent) return;
    await supabase.from("user_consents").upsert({
      user_id: userId,
      consent_version: consent.version,
      accepted_at: consent.acceptedAt,
      platform: consent.platform,
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}
