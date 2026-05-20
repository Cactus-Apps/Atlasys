import * as Sentry from "@sentry/react-native";
import { useTranslation } from "react-i18next";

export async function reverseGeocode(
  lat: number,
  lng: number,
  fallback?: string,
): Promise<string> {
  const { t, i18n } = useTranslation();

  const defaultFallback = fallback ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "Accept-Language": i18n.language || "en",
          "User-Agent": `GPS/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL!})`,
        },
      },
    );
    const text = await res.text();
    const data = JSON.parse(text);
    return (
      data.display_name?.split(",").slice(0, 2).join(", ") ?? defaultFallback
    );
  } catch (err: any) {
    Sentry.captureException(err);
    return defaultFallback;
  }
}
