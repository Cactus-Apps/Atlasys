import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { useAuthStore } from "../storage/zustand";

export type LowPowerPreference = "auto" | "on" | "off";

export type DevicePerformanceProfile = {
  lowEnd: boolean;
  reason: "memory" | "yearClass" | null;
  totalMemoryGb: number | null;
  deviceYearClass: number | null;
};

const LOW_MEMORY_THRESHOLD_BYTES = 3 * 1024 ** 3;
const LOW_YEAR_CLASS_THRESHOLD = 2019;
const RUNTIME_FRAME_THRESHOLD_MS = 32;
const RUNTIME_MIN_SAMPLES = 60;
const RUNTIME_PROBE_DELAY_MS = 1500;
const RUNTIME_PROBE_MAX_MS = 6000;

let cachedProfile: DevicePerformanceProfile | null = null;
let runtimeSlowDevice = false;
let runtimeProbeStarted = false;
const runtimeListeners = new Set<() => void>();

function emitRuntimeChange() {
  runtimeListeners.forEach((listener) => listener());
}

export function getDevicePerformanceProfile(): DevicePerformanceProfile {
  if (cachedProfile) return cachedProfile;

  if (Platform.OS === "web") {
    cachedProfile = {
      lowEnd: false,
      reason: null,
      totalMemoryGb: null,
      deviceYearClass: null,
    };
    return cachedProfile;
  }

  const totalMemory = Device.totalMemory ?? null;
  const deviceYearClass = Device.deviceYearClass ?? null;

  let reason: DevicePerformanceProfile["reason"] = null;
  if (
    totalMemory != null &&
    totalMemory > 0 &&
    totalMemory <= LOW_MEMORY_THRESHOLD_BYTES
  ) {
    reason = "memory";
  } else if (
    deviceYearClass != null &&
    deviceYearClass > 0 &&
    deviceYearClass <= LOW_YEAR_CLASS_THRESHOLD
  ) {
    reason = "yearClass";
  }

  cachedProfile = {
    lowEnd: reason !== null,
    reason,
    totalMemoryGb:
      totalMemory != null
        ? Math.round((totalMemory / 1024 ** 3) * 10) / 10
        : null,
    deviceYearClass,
  };

  return cachedProfile;
}

function subscribeRuntime(listener: () => void) {
  runtimeListeners.add(listener);
  return () => runtimeListeners.delete(listener);
}

function getRuntimeSnapshot() {
  return runtimeSlowDevice;
}

function getRuntimeServerSnapshot() {
  return false;
}

export function markRuntimeSlowDevice() {
  if (runtimeSlowDevice) return;
  runtimeSlowDevice = true;
  emitRuntimeChange();
}

export function useRuntimeSlowDevice() {
  return useSyncExternalStore(
    subscribeRuntime,
    getRuntimeSnapshot,
    getRuntimeServerSnapshot,
  );
}

export function useLowPowerMode() {
  const preference = useAuthStore(
    (state) => state.settings.lowPowerMode ?? "auto",
  ) as LowPowerPreference;
  const runtimeSlow = useRuntimeSlowDevice();
  const profile = useMemo(() => getDevicePerformanceProfile(), []);

  const detectedLowEnd = profile.lowEnd || runtimeSlow;
  const enabled =
    preference === "on" || (preference === "auto" && detectedLowEnd);

  return {
    enabled,
    preference,
    detectedLowEnd,
    hardwareLowEnd: profile.lowEnd,
    runtimeSlow,
    profile,
  };
}

/**
 * Samples frame timings after the map has settled. On devices that are not
 * flagged by their hardware profile but still run at a sustained low frame
 * rate, this enables low-power rendering automatically for the rest of the
 * session. Turning low-power mode off in Settings disables the probe.
 */
export function useAdaptivePerformanceProbe(active: boolean) {
  const preference = useAuthStore(
    (state) => state.settings.lowPowerMode ?? "auto",
  ) as LowPowerPreference;
  const runtimeSlow = useRuntimeSlowDevice();

  useEffect(() => {
    if (!active || preference !== "auto" || runtimeSlow) return;
    if (getDevicePerformanceProfile().lowEnd) return;
    if (runtimeProbeStarted) return;

    runtimeProbeStarted = true;
    let cancelled = false;
    let finished = false;
    let raf: ReturnType<typeof requestAnimationFrame> | null = null;
    const frames: number[] = [];
    let lastFrame = 0;
    let probeStart = -1;

    const finishProbe = () => {
      finished = true;
      const samples = frames.slice(5);
      if (samples.length < RUNTIME_MIN_SAMPLES) return;
      const average =
        samples.reduce((sum, value) => sum + value, 0) / samples.length;
      if (average >= RUNTIME_FRAME_THRESHOLD_MS) {
        markRuntimeSlowDevice();
      }
    };

    const step = (time: number) => {
      if (cancelled) return;

      if (probeStart < 0) {
        probeStart = time;
        lastFrame = time;
        raf = requestAnimationFrame(step);
        return;
      }

      const delta = time - lastFrame;
      lastFrame = time;
      if (delta > 0 && delta < 250) frames.push(delta);

      if (frames.length < 90 && time - probeStart < RUNTIME_PROBE_MAX_MS) {
        raf = requestAnimationFrame(step);
      } else {
        finishProbe();
      }
    };

    const delay = setTimeout(() => {
      if (cancelled) return;
      raf = requestAnimationFrame(step);
    }, RUNTIME_PROBE_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(delay);
      if (raf) cancelAnimationFrame(raf);
      if (!finished) runtimeProbeStarted = false;
    };
  }, [active, preference, runtimeSlow]);
}
