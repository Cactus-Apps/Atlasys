import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { useIsFocused } from "expo-router";
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

const blockRequests = new Set<symbol>();
let appliedBlocked: boolean | null = null;

function applyScreenCapture(blocked: boolean): void {
  if (appliedBlocked === blocked) return;
  appliedBlocked = blocked;
  void (async () => {
    try {
      if (blocked) {
        await ScreenCapture.preventScreenCaptureAsync(SCREEN_CAPTURE_KEY);
      } else {
        await ScreenCapture.allowScreenCaptureAsync(SCREEN_CAPTURE_KEY);
      }
    } catch {
      appliedBlocked = null;
    }
  })();
}

function setBlockRequest(token: symbol, blocked: boolean): void {
  if (blocked) {
    blockRequests.add(token);
  } else {
    blockRequests.delete(token);
  }
  applyScreenCapture(blockRequests.size > 0);
}

function useScreenCaptureGuard(block: boolean): void {
  const focused = useIsFocused();
  const [token] = useState(() => Symbol("screen-capture"));

  useEffect(() => {
    setBlockRequest(token, block && focused);
    return () => setBlockRequest(token, false);
  }, [block, focused, token]);
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
  const unlocked = useSharingStore((s) => s.unlocked);
  const locked = active && !unlocked;

  useScreenCaptureGuard(active);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        useSharingStore.getState().setUnlocked(false);
      }
    });
    return () => sub.remove();
  }, []);

  const requestUnlock = useCallback(async () => {
    const ok = await promptBiometricUnlock();
    if (ok) useSharingStore.getState().setUnlocked(true);
    return ok;
  }, []);

  return { locked, enabled: active, requestUnlock };
}
export function useFamilyScreenCaptureGuard(): void {
  useScreenCaptureGuard(true);
}
