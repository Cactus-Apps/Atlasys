import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const OFFLINE_CHANNEL_ID = "offline-maps";
const NAVIGATION_CHANNEL_ID = "navigation";

export async function configureNotificationChannels() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(OFFLINE_CHANNEL_ID, {
      name: "Offline Maps",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3B82F6",
    });
    await Notifications.setNotificationChannelAsync(NAVIGATION_CHANNEL_ID, {
      name: "Navigation",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3B82F6",
    });
  } catch (err) {
    console.warn("Failed to configure notification channels", err);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;

    if (!settings.canAskAgain) return false;

    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  } catch (err) {
    console.warn("Failed to request notification permission", err);
    return false;
  }
}

export async function presentNotification(options: {
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  channelId?: "offline-maps" | "navigation";
}) {
  try {
    const channelId =
      Platform.OS === "android"
        ? options.channelId === "navigation"
          ? NAVIGATION_CHANNEL_ID
          : OFFLINE_CHANNEL_ID
        : undefined;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data,
        sound: "default",
      },
      trigger: channelId ? { channelId } : null,
    });
  } catch (err) {
    console.warn("Failed to present notification", err);
  }
}

export {
  Notifications,
  OFFLINE_CHANNEL_ID,
  NAVIGATION_CHANNEL_ID,
};
