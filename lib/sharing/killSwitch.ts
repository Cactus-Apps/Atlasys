import { supabase } from "@/lib/auth/supabase";
import type { KillSwitchReason } from "./state";

export const KILL_SWITCH_KEY = "live_location_sharing";
export const KILL_SWITCH_REASON_KEY = "live_location_sharing_reason";
export const KILL_SWITCH_MESSAGE_KEY = "live_location_sharing_message";
export const SUPPORT_EMAIL = "cactus_apps@proton.me";

export type SharingFeatureConfig = {
  enabled: boolean;
  reason: KillSwitchReason | null;
  message: string | null;
};

const ENABLED: SharingFeatureConfig = {
  enabled: true,
  reason: null,
  message: null,
};

export async function fetchSharingConfig(): Promise<SharingFeatureConfig> {
  try {
    const { data } = await supabase
      .from("app_config")
      .select("key, value")
      .in("key", [
        KILL_SWITCH_KEY,
        KILL_SWITCH_REASON_KEY,
        KILL_SWITCH_MESSAGE_KEY,
      ]);
    if (!data || data.length === 0) return ENABLED;

    const map = new Map(data.map((row) => [row.key, row.value]));
    const enabledValue = map.get(KILL_SWITCH_KEY);

    if (enabledValue !== "false" && enabledValue !== "true") {
      return await readLegacyColumns();
    }

    if (enabledValue === "true") return ENABLED;

    const rawReason = map.get(KILL_SWITCH_REASON_KEY);
    const reason: KillSwitchReason =
      rawReason === "maintenance" ? "maintenance" : "safety";
    const rawMessage = map.get(KILL_SWITCH_MESSAGE_KEY);
    const message =
      typeof rawMessage === "string" && rawMessage.trim().length > 0
        ? rawMessage.trim()
        : null;
    return { enabled: false, reason, message };
  } catch {
    return ENABLED;
  }
}

async function readLegacyColumns(): Promise<SharingFeatureConfig> {
  try {
    const { data } = await supabase
      .from("app_config")
      .select("enabled, reason, message")
      .eq("key", KILL_SWITCH_KEY)
      .maybeSingle();
    if (!data || data.enabled !== false) return ENABLED;
    const reason: KillSwitchReason =
      data.reason === "maintenance" ? "maintenance" : "safety";
    const message =
      typeof data.message === "string" && data.message.trim().length > 0
        ? data.message.trim()
        : null;
    return { enabled: false, reason, message };
  } catch {
    return ENABLED;
  }
}

export function killSwitchText(
  t: (key: string) => string,
  reason: KillSwitchReason | null,
  serverMessage: string | null,
): string {
  if (serverMessage) return serverMessage;
  return reason === "maintenance"
    ? t("Sharing_disabled_maintenance")
    : t("Sharing_disabled_safety");
}
