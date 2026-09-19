import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import type { LocationObject } from "expo-location";

// Registered at module load. Runs for foreground AND background updates.
export const SHARE_LOCATION_TASK_NAME = "atlasys-share-location";

let locationHandler: ((loc: LocationObject) => void) | null = null;

TaskManager.defineTask(SHARE_LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    return;
  }
  const locations = (data as { locations?: LocationObject[] } | undefined)
    ?.locations;
  const loc = locations?.[locations.length - 1];
  if (!loc) return;
  locationHandler?.(loc);
});

export function registerBackgroundLocationHandler(
  cb: (loc: LocationObject) => void,
): void {
  locationHandler = cb;
}

export function clearBackgroundLocationHandler(): void {
  locationHandler = null;
}

export async function startShareLocationTask(options: {
  accuracy: Location.Accuracy;
  minimumUpdateMs: number;
  distanceMeters: number;
  notificationTitle: string;
  notificationBody: string;
}): Promise<void> {
  await Location.startLocationUpdatesAsync(SHARE_LOCATION_TASK_NAME, {
    accuracy: options.accuracy,
    timeInterval: options.minimumUpdateMs,
    distanceInterval: options.distanceMeters,
    deferredUpdatesInterval: options.minimumUpdateMs,
    deferredUpdatesDistance: options.distanceMeters * 4,
    showsBackgroundLocationIndicator: true,
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: options.notificationTitle,
      notificationBody: options.notificationBody,
      notificationColor: "#4F46E5",
    },
  });
}

export async function isShareLocationTaskStarted(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(SHARE_LOCATION_TASK_NAME);
}

export async function stopShareLocationTask(): Promise<void> {
  try {
    if (await isShareLocationTaskStarted()) {
      await Location.stopLocationUpdatesAsync(SHARE_LOCATION_TASK_NAME);
    }
  } catch {}
}
