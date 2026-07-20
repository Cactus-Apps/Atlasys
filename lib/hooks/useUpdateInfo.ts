import { supabase } from "@/lib/auth/supabase";

/**
 * Fetches the current published app version from the Supabase `app_config` table.
 * Returns the version string (e.g. "1.7.6") or null if not found.
 */
export async function fetchCurrentVersion(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "current_version")
      .single();

    if (error || !data) return null;
    return data.value;
  } catch {
    return null;
  }
}
