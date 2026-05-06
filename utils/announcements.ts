import { supabase } from "@/lib/auth/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "info" | "update" | "warning";
  min_app_version: string | null;
  created_at: string;
};

const SEEN_KEY = "seen_announcements";

function parseVersion(v: string): number[] {
  return v.split(".").map(Number);
}

function meetsMinVersion(appVersion: string, minVersion: string): boolean {
  const app = parseVersion(appVersion);
  const min = parseVersion(minVersion);
  for (let i = 0; i < Math.max(app.length, min.length); i++) {
    const a = app[i] ?? 0;
    const m = min[i] ?? 0;
    if (a > m) return true;
    if (a < m) return false;
  }
  return true;
}

export async function fetchUnseen(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const appVersion = Application.nativeApplicationVersion ?? "0.0.0";

  const versionFiltered = data.filter((a) => {
    if (!a.min_app_version) return true;
    return meetsMinVersion(appVersion, a.min_app_version);
  });

  const raw = await AsyncStorage.getItem(SEEN_KEY);
  const seen: string[] = raw ? JSON.parse(raw) : [];

  return versionFiltered.filter((a) => !seen.includes(a.id));
}

export async function markAllSeen(ids: string[]) {
  const raw = await AsyncStorage.getItem(SEEN_KEY);
  const seen: string[] = raw ? JSON.parse(raw) : [];
  const updated = [...new Set([...seen, ...ids])];
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(updated));
}

export async function fetchAll() {
  const { data, error } = await supabase.from("announcements").select("*");
}
