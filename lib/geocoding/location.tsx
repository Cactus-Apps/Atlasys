import * as Location from "expo-location";
import { useEffect } from "react";
import { AppState } from "react-native";
import { create } from "zustand";

export type LocationCoords = [longitude: number, latitude: number];

type LocationStore = {
  location: LocationCoords | undefined;
  locationObject: Location.LocationObject | null;
  permission: Location.PermissionStatus | null;
  error: string | null;
  watching: boolean;
  setLocation: (object: Location.LocationObject) => void;
  setPermission: (status: Location.PermissionStatus) => void;
  setError: (message: string | null) => void;
  setWatching: (watching: boolean) => void;
};

export const useLocationStore = create<LocationStore>()((set) => ({
  location: undefined,
  locationObject: null,
  permission: null,
  error: null,
  watching: false,
  setLocation: (object) =>
    set({
      location: [object.coords.longitude, object.coords.latitude],
      locationObject: object,
      error: null,
    }),
  setPermission: (status) => set({ permission: status }),
  setError: (message) => set({ error: message }),
  setWatching: (watching) => set({ watching }),
}));

const DEFAULT_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  timeInterval: 1000,
  distanceInterval: 1,
};

let options: Location.LocationOptions = DEFAULT_OPTIONS;
let owners = 0;
let subscription: Location.LocationSubscription | null = null;
let starting: Promise<boolean> | null = null;

function openWatcher(): Promise<boolean> {
  if (subscription) return Promise.resolve(true);
  if (starting) return starting;
  if (owners === 0) return Promise.resolve(false);

  starting = (async () => {
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();
      useLocationStore.getState().setPermission(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        useLocationStore
          .getState()
          .setError(
            canAskAgain
              ? "permission-denied"
              : "permission-denied-permanently",
          );
        return false;
      }

      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && owners > 0) {
          useLocationStore.getState().setLocation(lastKnown);
        }
      } catch {
        useLocationStore.getState().setError("last-known-position-unavailable");
      }

      const watcher = await Location.watchPositionAsync(options, (object) => {
        useLocationStore.getState().setLocation(object);
      });

      if (owners === 0) {
        watcher.remove();
        return false;
      }

      subscription = watcher;
      useLocationStore.getState().setWatching(true);
      useLocationStore.getState().setError(null);
      return true;
    } catch (err) {
      useLocationStore
        .getState()
        .setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      starting = null;
    }
  })();

  return starting;
}

function closeWatcher(): void {
  subscription?.remove();
  subscription = null;
  useLocationStore.getState().setWatching(false);
}

function restartWatcher(): void {
  if (owners === 0 || starting) return;
  closeWatcher();
  void openWatcher();
}

export function startLocationTracking(
  watchOptions?: Location.LocationOptions,
): () => void {
  if (watchOptions) options = watchOptions;
  owners += 1;
  void openWatcher();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    owners = Math.max(0, owners - 1);
    if (owners === 0) closeWatcher();
  };
}

export function stopLocationTracking(): void {
  owners = 0;
  closeWatcher();
}

export function getLocation(): LocationCoords | undefined {
  return useLocationStore.getState().location;
}

export function getLocationObject(): Location.LocationObject | null {
  return useLocationStore.getState().locationObject;
}

function useLocationTracking(): void {
  useEffect(() => {
    const release = startLocationTracking();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") restartWatcher();
    });

    return () => {
      release();
      appState.remove();
    };
  }, []);
}

export function useLocation(): LocationCoords | undefined {
  useLocationTracking();
  return useLocationStore((state) => state.location);
}

export function useLocationObject(): Location.LocationObject | null {
  useLocationTracking();
  return useLocationStore((state) => state.locationObject);
}
