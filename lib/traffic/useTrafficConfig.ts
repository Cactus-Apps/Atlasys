import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  DEFAULT_TRAFFIC_CONFIG,
  fetchTrafficConfig,
  isTrafficAvailable,
  type TrafficConfig,
} from "./config";

const CACHE_TTL_MS = 5 * 60 * 1000;

let remoteCache: { at: number; value: TrafficConfig } | null = null;

export type UseTrafficConfigResult = TrafficConfig & {
  /** Feature is configured locally and enabled remotely. */
  available: boolean;
};

export function useTrafficConfig(): UseTrafficConfigResult {
  const [config, setConfig] = useState<TrafficConfig>(
    remoteCache?.value ?? DEFAULT_TRAFFIC_CONFIG,
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const load = async (force: boolean) => {
      if (!isTrafficAvailable()) return;
      if (
        !force &&
        remoteCache &&
        Date.now() - remoteCache.at < CACHE_TTL_MS
      ) {
        if (mounted.current) setConfig(remoteCache.value);
        return;
      }

      const value = await fetchTrafficConfig();
      remoteCache = { at: Date.now(), value };
      if (mounted.current) setConfig(value);
    };

    void load(false);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void load(true);
    });

    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, []);

  return {
    ...config,
    available: isTrafficAvailable() && config.enabled,
  };
}
