import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as Sentry from "@sentry/react-native";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANNON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

function createSupabaseStorage(): SupportedStorage {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return {
      getItem: (key) => {
        return Promise.resolve(window.localStorage.getItem(key));
      },
      setItem: (key, value) => {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }

  if (Platform.OS !== "web") {
    try {
      require("react-native-url-polyfill/auto");
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      return AsyncStorage;
    } catch (err) {
      Sentry.captureException(err);
    }
  }

  return {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANNON_KEY, {
  auth: {
    storage: createSupabaseStorage(),
    autoRefreshToken: typeof window !== "undefined",
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
