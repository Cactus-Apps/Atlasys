import { Platform } from "react-native";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidForegroundServiceType,
} from "@notifee/react-native";

const DOWNLOAD_CHANNEL_ID = "offline-maps-download";
const NAVIGATION_CHANNEL_ID = "navigation";

let channelsCreated = false;

// Must be registered at module level, outside React components.
// The promise never resolves on its own — it's kept alive until
// stopForegroundService() is called.
notifee.registerForegroundService(() => {
  return new Promise(() => {
    // Service runs until stopForegroundService() is called from our helpers.
  });
});

export async function createNotificationChannels() {
  if (channelsCreated || Platform.OS !== "android") return;

  await notifee.createChannel({
    id: DOWNLOAD_CHANNEL_ID,
    name: "Offline Maps Download",
    importance: AndroidImportance.LOW,
    visibility: AndroidVisibility.PUBLIC,
    sound: undefined,
  });

  await notifee.createChannel({
    id: NAVIGATION_CHANNEL_ID,
    name: "Navigation",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
  });

  channelsCreated = true;
}

export async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus;
}

const DOWNLOAD_NOTIF_ID = "atlasys-download";
const NAV_NOTIF_ID = "atlasys-navigation";

export async function showDownloadNotification(
  regionName: string,
  totalTiles: number,
): Promise<string> {
  if (Platform.OS === "ios") {
    const id = await notifee.displayNotification({
      title: "Offline Map Download",
      body: `Downloading "${regionName}" (${totalTiles.toLocaleString()} tiles)…`,
      ios: {
        sound: undefined,
      },
    });
    return id ?? DOWNLOAD_NOTIF_ID;
  }

  await createNotificationChannels();

  const id = await notifee.displayNotification({
    id: DOWNLOAD_NOTIF_ID,
    title: "Downloading offline map",
    body: `"${regionName}" — 0%`,
    android: {
      channelId: DOWNLOAD_CHANNEL_ID,
      asForegroundService: true,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_DATA_SYNC,
      ],
      progress: {
        max: 100,
        current: 0,
      },
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      pressAction: { id: "default" },
    },
  });

  return id ?? DOWNLOAD_NOTIF_ID;
}

export async function updateDownloadProgress(
  regionName: string,
  downloaded: number,
  total: number,
) {
  const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0;

  if (Platform.OS === "ios") return;

  await notifee.displayNotification({
    id: DOWNLOAD_NOTIF_ID,
    title: "Downloading offline map",
    body: `"${regionName}" — ${percent}% (${downloaded.toLocaleString()} / ${total.toLocaleString()} tiles)`,
    android: {
      channelId: DOWNLOAD_CHANNEL_ID,
      asForegroundService: true,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_DATA_SYNC,
      ],
      progress: {
        max: total,
        current: downloaded,
      },
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      pressAction: { id: "default" },
    },
  });
}

export async function completeDownloadNotification(regionName: string) {
  if (Platform.OS === "ios") {
    await notifee.displayNotification({
      title: "Download complete",
      body: `"${regionName}" is ready for offline use.`,
      ios: {
        sound: undefined,
      },
    });
    return;
  }

  await notifee.displayNotification({
    id: DOWNLOAD_NOTIF_ID,
    title: "Download complete",
    body: `"${regionName}" is ready for offline use.`,
    android: {
      channelId: DOWNLOAD_CHANNEL_ID,
      progress: {
        max: 100,
        current: 100,
      },
      autoCancel: true,
      onlyAlertOnce: true,
      pressAction: { id: "default" },
    },
  });

  await notifee.stopForegroundService();
}

export async function cancelDownloadNotification() {
  if (Platform.OS === "ios") {
    await notifee.cancelNotification(DOWNLOAD_NOTIF_ID);
    return;
  }

  await notifee.stopForegroundService();
}

export async function showNavigationNotification(
  destinationName: string,
): Promise<string> {
  if (Platform.OS === "ios") {
    const id = await notifee.displayNotification({
      title: "Navigation started",
      body: `Navigating to "${destinationName}"`,
      ios: {
        sound: undefined,
      },
    });
    return id ?? NAV_NOTIF_ID;
  }

  await createNotificationChannels();

  const id = await notifee.displayNotification({
    id: NAV_NOTIF_ID,
    title: "Navigation active",
    body: `To: ${destinationName}`,
    android: {
      channelId: NAVIGATION_CHANNEL_ID,
      asForegroundService: true,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION,
      ],
      progress: {
        max: 100,
        current: 0,
      },
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      pressAction: { id: "default" },
    },
  });

  return id ?? NAV_NOTIF_ID;
}

export async function updateNavigationProgress(opts: {
  instruction: string;
  remainingDist: string;
  remainingTime: string;
  progress: number;
}) {
  if (Platform.OS === "ios") return;

  await notifee.displayNotification({
    id: NAV_NOTIF_ID,
    title: opts.instruction,
    body: `${opts.remainingTime} · ${opts.remainingDist}`,
    android: {
      channelId: NAVIGATION_CHANNEL_ID,
      asForegroundService: true,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION,
      ],
      progress: {
        max: 100,
        current: Math.round(opts.progress * 100),
      },
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: false,
      pressAction: { id: "default" },
    },
  });
}

export async function stopNavigationNotification() {
  if (Platform.OS === "ios") {
    await notifee.cancelNotification(NAV_NOTIF_ID);
    return;
  }

  await notifee.stopForegroundService();
}
