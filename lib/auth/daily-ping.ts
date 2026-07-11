import AsyncStorage from "@react-native-async-storage/async-storage";
import { posthog } from "@/lib/config/posthog";
import { useAuthStore } from "@/lib/storage/zustand";

const LAST_PING_KEY = "atlasys_last_daily_ping";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function sendDailyPing(): Promise<void> {
  const { settings, userId } = useAuthStore.getState();
  if (!settings.ping || !userId) return;

  try {
    const last = await AsyncStorage.getItem(LAST_PING_KEY);
    if (last === todayKey()) return;

    posthog.optIn();
    posthog.identify(userId);
    posthog.capture("daily_active_user");

    await AsyncStorage.setItem(LAST_PING_KEY, todayKey());
  } catch {}
}
