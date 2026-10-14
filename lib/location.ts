import { PermissionsAndroid, Platform } from "react-native";
import Geolocation from "react-native-geolocation-service";

/**
 * Location access for F-Droid builds.
 *
 * This replaces `expo-location`, whose Android implementation hard-depends on
 * `com.google.android.gms:play-services-location`. Everything here runs on the
 * AOSP `LocationManager` instead (see `scripts/patch-geolocation-service.js`),
 * so the app ships no Google Play Services.
 *
 * The shape mirrors the handful of `expo-location` APIs this app used so the
 * call sites stay close to what they were.
 *
 * Note: there are deliberately no background updates here. Continuous location
 * sharing therefore only runs while the app is in the foreground.
 */

export type LocationPermissionStatus = "granted" | "denied" | "undetermined";

export type ForegroundPermissionResult = {
  status: LocationPermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
};

export type Accuracy = "high" | "balanced" | "low" | "passive";

export type LocationCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
};

export type LocationObject = {
  coords: LocationCoords;
  timestamp: number;
};

export type LocationSubscription = { remove(): void };

export type WatchPositionOptions = {
  accuracy?: Accuracy;
  timeInterval?: number;
  distanceInterval?: number;
};

type PositionErrorCode =
  | 1 // PERMISSION_DENIED
  | 2 // POSITION_UNAVAILABLE
  | 3 // TIMEOUT
  | 4 // PLAY_SERVICE_NOT_AVAILABLE
  | 5 // SETTINGS_NOT_SATISFIED
  | -1; // INTERNAL_ERROR

type NativeError = { code: PositionErrorCode; message: string };

function isCanceled(error: unknown): boolean {
  const code = (error as NativeError | undefined)?.code;
  return code === 1 || code === 4;
}

/** Keeps the last fix around so "last known position" never blocks on a scan. */
let cachedLastPosition: LocationObject | null = null;

function toLocationObject(position: {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}): LocationObject {
  const coords: LocationCoords = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    // Native reports -1 for "no reading"; treat that as unknown, like expo.
    accuracy:
      position.coords.accuracy != null && position.coords.accuracy >= 0
        ? position.coords.accuracy
        : null,
    altitude:
      position.coords.altitude != null && position.coords.altitude >= 0
        ? position.coords.altitude
        : null,
    heading:
      position.coords.heading != null && position.coords.heading >= 0
        ? position.coords.heading
        : null,
    speed: position.coords.speed != null && position.coords.speed >= 0
      ? position.coords.speed
      : null,
  };

  return { coords, timestamp: position.timestamp };
}

async function requestAndroidPermissions(): Promise<ForegroundPermissionResult> {
  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

  // Coarse is enough to show where the user roughly is, so treat either grant
  // as success.
  const alreadyGranted =
    (await PermissionsAndroid.check(fine)) ||
    (await PermissionsAndroid.check(coarse));
  if (alreadyGranted) {
    return { status: "granted", granted: true, canAskAgain: true };
  }

  try {
    // Android 12+ ignores a runtime request for ACCESS_FINE_LOCATION unless
    // ACCESS_COARSE_LOCATION is requested in the same call, so ask for both.
    const results = await PermissionsAndroid.requestMultiple([fine, coarse]);
    const granted =
      results[fine] === PermissionsAndroid.RESULTS.GRANTED ||
      results[coarse] === PermissionsAndroid.RESULTS.GRANTED;
    const blocked =
      results[fine] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN &&
      results[coarse] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

    return {
      status: granted ? "granted" : "denied",
      granted,
      canAskAgain: granted ? true : !blocked,
    };
  } catch {
    return { status: "denied", granted: false, canAskAgain: false };
  }
}

export async function requestForegroundPermissionsAsync(): Promise<ForegroundPermissionResult> {
  if (Platform.OS !== "android") {
    const result = await Geolocation.requestAuthorization("whenInUse");
    const granted = result === "granted";
    return {
      status: granted ? "granted" : result === "denied" ? "denied" : "undetermined",
      granted,
      canAskAgain: result !== "restricted" && result !== "disabled",
    };
  }

  return requestAndroidPermissions();
}

/**
 * Background location is not supported on this build. Always reports denied so
 * the sharing UI can surface that limitation instead of silently pretending.
 */
export async function requestBackgroundPermissionsAsync(): Promise<ForegroundPermissionResult> {
  return { status: "denied", granted: false, canAskAgain: false };
}

export async function getLastKnownPositionAsync(): Promise<LocationObject | null> {
  if (cachedLastPosition) {
    return cachedLastPosition;
  }

  return new Promise<LocationObject | null>((resolve) => {
    let settled = false;
    const finish = (value: LocationObject | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    // The patched module routes to the AOSP LocationManager, so ask it for a
    // cached fix rather than spinning up a scan.
    Geolocation.getCurrentPosition(
      (position) => {
        const mapped = toLocationObject(position);
        cachedLastPosition = mapped;
        finish(mapped);
      },
      (error) => {
        if (!isCanceled(error)) {
          console.warn("[location] getCurrentPosition failed:", error.message);
        }
        finish(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 5 * 60_000,
        forceLocationManager: true,
        forceRequestLocation: false,
        showLocationDialog: false,
      },
    );
  });
}

export async function watchPositionAsync(
  options: WatchPositionOptions,
  callback: (location: LocationObject) => void,
): Promise<LocationSubscription> {
  const id = Geolocation.watchPosition(
    (position) => {
      const mapped = toLocationObject(position);
      cachedLastPosition = mapped;
      callback(mapped);
    },
    (error) => {
      // Position unavailable happens transiently while the GPS warms up.
      if (isCanceled(error)) return;
      console.warn("[location] watchPosition error:", error.message);
    },
    {
      enableHighAccuracy: options.accuracy === "high",
      interval: options.timeInterval ?? 1_000,
      distanceFilter: options.distanceInterval ?? 0,
      // AOSP LocationManager only: never fall back to the fused provider.
      forceLocationManager: true,
      forceRequestLocation: true,
      showLocationDialog: true,
    },
  );

  return {
    remove() {
      Geolocation.clearWatch(id);
    },
  };
}

export function stopObserving(): void {
  Geolocation.stopObserving();
}