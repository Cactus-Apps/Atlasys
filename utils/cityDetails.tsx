const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST!;

export async function fetchCityDetails(cityName: string, countryCode?: string) {
  const params = new URLSearchParams({
    namePrefix: cityName,
    limit: "1",
    sort: "-population",
  });

  if (countryCode) {
    params.append("countryIds", countryCode);
  }

  try {
    const res = await fetch(
      `https://${RAPIDAPI_HOST}/v1/geo/cities?${params.toString()}`,
      {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY ?? "",
          "X-RapidAPI-Host": RAPIDAPI_HOST ?? "",
        },
      }
    );

    if (!res.ok) {
      console.error("GeoDB Error", res.status);
      return null;
    }

    const json = await res.json();
    const cityData = json.data?.[0];
    if (!cityData) return null;

    return {
      id: cityData.id,
      name: cityData.name,
      city: cityData.city,
      country: cityData.country,
      countryCode: cityData.countryCode,
      region: cityData.region,
      regionCode: cityData.regionCode,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
      population: cityData.population,
      elevationMeters: cityData.elevationMeters,
      timezone: cityData.timezone,
      wikiDataId: cityData.wikiDataId,
      type: cityData.type,
    };
  } catch (err) {
    console.error("GeoDB Fetch Error:", err);
    return null;
  }
}


