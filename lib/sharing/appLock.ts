import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { AppState } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useSharingStore } from "./state";

const SCREEN_CAPTURE_KEY = "live-share";

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

export async function promptBiometricUnlock(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Standorte teilen",
      cancelLabel: "Abbrechen",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

async function syncScreenCapture(active: boolean): Promise<void> {
  try {
    if (active) {
      await ScreenCapture.preventScreenCaptureAsync(SCREEN_CAPTURE_KEY);
    } else {
      await ScreenCapture.allowScreenCaptureAsync(SCREEN_CAPTURE_KEY);
    }
  } catch {}
}

export function useIsShareActive(): boolean {
  return useSharingStore((s) => s.active);
}

export function useShareLock(): {
  locked: boolean;
  enabled: boolean;
  requestUnlock: () => Promise<boolean>;
} {
  const active = useSharingStore((s) => s.active);
  const [locked, setLocked] = useState<boolean>(false);

  useEffect(() => {
    if (active) {
      setLocked(true);
    } else {
      setLocked(false);
    }
  }, [active]);

  useEffect(() => {
    void syncScreenCapture(active);
    return () => {
      void syncScreenCapture(false);
    };
  }, [active]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const requestUnlock = useCallback(async () => {
    const ok = await promptBiometricUnlock();
    if (ok) setLocked(false);
    return ok;
  }, []);

  return { locked, enabled: active, requestUnlock };
}
