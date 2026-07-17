import React from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react-native";

// WMO weather codes (used by Open-Meteo), lowest-to-highest so each
// range is only checked once and nothing gets shadowed.
export function getWeatherIcon(code: number, size = 20) {
  if (code === 0) return <Sun size={size} color="#FFD700" />;
  if (code === 1 || code === 2) return <CloudSun size={size} color="#948b59" />;
  if (code === 3) return <Cloud size={size} color="#94A3B8" />;
  if (code === 45 || code === 48) return <CloudFog size={size} color="#94A3B8" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle size={size} color="#3B82F6" />;
  if (code >= 61 && code <= 67) return <CloudRain size={size} color="#3B82F6" />;
  if (code === 71 || code === 73 || code === 75 || code === 77)
    return <CloudSnow size={size} color="#3e6095" />;
  if (code === 80 || code === 81 || code === 82) return <CloudRain size={size} color="#3B82F6" />;
  if (code === 85 || code === 86) return <CloudSnow size={size} color="#3e6095" />;
  if (code >= 95 && code <= 99) return <CloudLightning size={size} color="#94A3B8" />;
  return <Cloud size={size} color="#94A3B8" />;
}

export function getWeekdayLabel(isoDate: string, index: number): string {
  if (index === 0) return "Today";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}
