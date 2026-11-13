import { supabase } from "@/lib/auth/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Must be EXPO_PUBLIC_* so Expo inlines it into the client bundle.
const PROXY_TOKEN = process.env.EXPO_PUBLIC_TRAFFIC_PROXY_TOKEN ?? "";

/**
 * TomTom's raster flow line width multiplier (1-20, default 10).
 * Lower = thinner traffic lines.
 */
const FLOW_THICKNESS = 4;

export const TRAFFIC_ATTRIBUTION = "© TomTom";
export const TRAFFIC_LEGAL_URL = "https://www.tomtom.com/legal/";

export const TRAFFIC_PROXY_BASE = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/traffic-tiles`
  : null;

/**
 * Layer below which the traffic raster is inserted, per map theme.
 * Without this the raster would draw over street and place labels.
 */
export const TRAFFIC_BEFORE_ID: Record<string, string> = {
  bright: "road_oneway",
  dark: "road_oneway",
  liberty: "road_one_way_arrow",
  Satelite3D: "road_one_way_arrow",
  city: "poi-sight",
  Satelite: "place-all",
};

export type TrafficConfig = {
  enabled: boolean;
  incidentsEnabled: boolean;
};

export const DEFAULT_TRAFFIC_CONFIG: TrafficConfig = {
  enabled: true,
  incidentsEnabled: true,
};

export function isTrafficAvailable(): boolean {
  return Boolean(TRAFFIC_PROXY_BASE && PROXY_TOKEN);
}

/**
 * MapLibre tile template for the proxy. Returns null when the proxy or token
 * is not configured, so callers can hide the feature entirely.
 */
export function trafficTileTemplate(kind: "flow" | "incidents"): string | null {
  if (!TRAFFIC_PROXY_BASE || !PROXY_TOKEN) return null;
  const style = kind === "flow" ? "relative" : "s1";
  const thickness = kind === "flow" ? `&thickness=${FLOW_THICKNESS}` : "";
  const token = encodeURIComponent(PROXY_TOKEN);
  return `${TRAFFIC_PROXY_BASE}/${kind}/{z}/{x}/{y}.png?style=${style}${thickness}&t=${token}`;
}

export async function fetchTrafficConfig(): Promise<TrafficConfig> {
  try {
    const { data } = await supabase
      .from("app_config")
      .select("key, value")
      .in("key", ["traffic_enabled", "traffic_incidents_enabled"]);

    if (!data || data.length === 0) return DEFAULT_TRAFFIC_CONFIG;

    const map = new Map(data.map((row) => [row.key, String(row.value)]));
    return {
      enabled: map.get("traffic_enabled") !== "false",
      incidentsEnabled: map.get("traffic_incidents_enabled") !== "false",
    };
  } catch {
    return DEFAULT_TRAFFIC_CONFIG;
  }
}
