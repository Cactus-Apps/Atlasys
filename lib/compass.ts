import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const HEADING_KEY = "@atlasys/widget-compass-heading";

export async function saveWidgetHeading(heading: number): Promise<void> {
  try {
    await AsyncStorage.setItem(HEADING_KEY, String(heading));
  } catch (error) {
    console.warn("Failed to save widget compass heading", error);
  }
}

export async function loadWidgetHeading(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(HEADING_KEY);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch (error) {
    console.warn("Failed to load widget compass heading", error);
    return null;
  }
}

export async function getDeviceHeading(): Promise<number> {
  const stored = await loadWidgetHeading();

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return stored ?? 0;

    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown && typeof lastKnown.coords.heading === "number") {
      return lastKnown.coords.heading;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    if (typeof pos.coords.heading === "number") {
      return pos.coords.heading;
    }
  } catch (error) {
    console.warn("Failed to read device heading", error);
  }

  return stored ?? 0;
}