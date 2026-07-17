import { useEffect, useState } from "react";
import * as Sentry from "@sentry/react-native";

export type DailyForecast = {
  date: string; // ISO date, e.g. "2026-07-18"
  code: number; // WMO weather code
  tempMax: number;
  tempMin: number;
};

export type WeatherState = {
  temp: number;
  code: number;
  daily: DailyForecast[];
};

type City = {
  latitude?: number;
  longitude?: number;
};

export function useWeatherForecast(city: City | null | undefined) {
  const [weather, setWeather] = useState<WeatherState | null>(null);

  useEffect(() => {
    if (!city?.latitude || !city?.longitude) return;

    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`,
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.current_weather) {
          const daily: DailyForecast[] =
            data.daily?.time?.map((date: string, i: number) => ({
              date,
              code: data.daily.weathercode[i],
              tempMax: Math.round(data.daily.temperature_2m_max[i]),
              tempMin: Math.round(data.daily.temperature_2m_min[i]),
            })) ?? [];

          setWeather({
            temp: Math.round(data.current_weather.temperature),
            code: data.current_weather.weathercode,
            daily,
          });
        }
      } catch (error) {
        Sentry.captureException(error);
      }
    };

    fetchWeather();
  }, [city?.latitude, city?.longitude]);

  return weather;
}
