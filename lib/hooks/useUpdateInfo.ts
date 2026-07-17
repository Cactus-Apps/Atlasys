import { useEffect, useState } from "react";
import { supabase } from "@/lib/auth/supabase";
import * as Application from "expo-application";

export interface UpdateSlide {
  icon: string;
  title: string;
  body: string;
  showPingToggle?: boolean;
}

export interface AppUpdate {
  version: string;
  title: string;
  slides: UpdateSlide[];
}

/**
 * Fetches the current app version's update info from Supabase.
 * Returns null if no active update exists for this version.
 */
export async function fetchCurrentUpdate(): Promise<AppUpdate | null> {
  try {
    const appVersion = Application.nativeApplicationVersion ?? "0.0.0";
    const { data, error } = await supabase
      .from("app_updates")
      .select("version, title, slides")
      .eq("active", true)
      .eq("version", appVersion)
      .single();

    if (error || !data) return null;
    return data as AppUpdate;
  } catch {
    return null;
  }
}
