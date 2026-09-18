import AsyncStorage from "@react-native-async-storage/async-storage";

const SNAPSHOT_KEY = "@atlasys/widget-map-snapshot";

export async function saveWidgetMapSnapshot(uri: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SNAPSHOT_KEY, uri);
  } catch (error) {
    console.warn("Failed to save widget map snapshot", error);
  }
}

export async function loadWidgetMapSnapshot(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SNAPSHOT_KEY);
  } catch (error) {
    console.warn("Failed to load widget map snapshot", error);
    return null;
  }
}