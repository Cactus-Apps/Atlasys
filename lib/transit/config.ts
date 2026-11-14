import Constants from "expo-constants";

export const TRANSIT_API_BASE =
  process.env.EXPO_PUBLIC_TRANSIT_API_URL?.replace(/\/+$/, "") ||
  "https://api.transitous.org/api";

export const TRANSIT_ENABLED =
  process.env.EXPO_PUBLIC_TRANSIT_ENABLED !== "false";

export const TRANSIT_ATTRIBUTION_URL = "https://transitous.org/sources/";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0";
const CONTACT =
  process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL || "https://github.com/Cactus-Apps/Atlasys";

export const TRANSIT_USER_AGENT = `Atlasys/${APP_VERSION} (${CONTACT})`;
