import * as Sentry from "@sentry/react-native";
import { useTranslation } from "react-i18next";

export async function fetchCityDetails(cityName: string, countryCode?: string) {
  const { t, i18n } = useTranslation();

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=${(i18n.language || "en").split("-")[0]}&format=json`;
    const res = await fetch(url);

    if (!res.ok)
      (err: any) => {
        Sentry.captureException(err);

        return null;
      };

    const json = await res.json();
    const cityData = json.results?.[0];
    if (!cityData) return null;

    return {
      id: cityData.id,
      name: cityData.name,
      city: cityData.name,
      country: cityData.country,
      countryCode: cityData.country_code,
      region: cityData.admin1,
      regionCode: cityData.admin1_id,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
      population: cityData.population,
      elevationMeters: cityData.elevation,
      timezone: cityData.timezone,
      wikiDataId: null, // Open-Meteo has no wikiDataId
      type: "city",
    };
  } catch (err: any) {
    Sentry.captureException(err);
    Sentry.captureException(err);

    return null;
  }
}
