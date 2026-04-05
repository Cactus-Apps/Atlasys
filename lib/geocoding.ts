import * as Sentry from "@sentry/react-native";

export async function reverseGeocode(
  lat: number,
  lng: number,
  fallback?: string,
): Promise<string> {
  const defaultFallback = fallback ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "Accept-Language": "de",
          "User-Agent": "GPS/1.0 (cactus_apps@proton.me)",
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
