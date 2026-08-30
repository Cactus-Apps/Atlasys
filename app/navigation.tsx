import { useRouter, useFocusEffect } from "expo-router";
import {
  MapProvider,
  Map,
  Marker,
  MapRef,
  GeoJSONSource,
} from "react-native-maplibre-gl-js";
import * as Location from "expo-location";
import * as Sentry from "@sentry/react-native";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import Tts from "@iternio/react-native-tts";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  AppState,
} from "react-native";
import { useAppTheme } from "@/lib/theme";
import { useAuthStore } from "@/lib/storage/zustand";
import { fonts } from "@/lib/fonts";
import { fetchOsrmRoutes } from "@/lib/osrm";
import { useTranslation } from "react-i18next";
import i18n from "@/app/i18n";
import {
  Navigation,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  House,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { darken } from "./(tabs)/mapscreen";

function pointToSegmentDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  let cx: number;
  let cy: number;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    cx = ax;
    cy = ay;
  } else {
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    cx = ax + t * dx;
    cy = ay + t * dy;
  }
  // Umrechnung der Grad-Differenzen nach Metern (~1° lat = 111320 m,
  // 1° lon = 111320 * cos(lat) m), für kleine Distanzen genau genug.
  const lat = (ay + by) / 2;
  const mPerDegLon = 111320 * Math.cos((lat * Math.PI) / 180);
  const dLonM = (px - cx) * mPerDegLon;
  const dLatM = (py - cy) * 111320;
  return Math.hypot(dLonM, dLatM);
}

function findNearestPointOnRoute(
  pos: [number, number],
  coords: [number, number][],
): { index: number; dist: number; nearest: [number, number] } {
  let bestDist = Infinity;
  let bestIdx = 0;
  let bestPoint: [number, number] = coords[0];
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const d = pointToSegmentDist(pos[0], pos[1], a[0], a[1], b[0], b[1]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) {
        bestPoint = a;
      } else {
        let t = ((pos[0] - a[0]) * dx + (pos[1] - a[1]) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        bestPoint = [a[0] + t * dx, a[1] + t * dy];
      }
    }
  }
  return { index: bestIdx, dist: bestDist, nearest: bestPoint };
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) *
      Math.cos((b[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function getBearing(from: [number, number], to: [number, number]): number {
  const [lon1, lat1] = from;
  const [lon2, lat2] = to;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function getInstructionText(
  step: any,
  t: (key: string, opts?: any) => string,
): string {
  if (!step) return "";
  const type = step.maneuver?.type || "";
  const modifier = step.maneuver?.modifier || "";
  const name = step.name || "";

  if (type === "depart")
    return name
      ? t("Nav_instruction_depart_with_name", { name })
      : t("Nav_instruction_depart");
  if (type === "arrive") return t("Nav_instruction_arrive");
  if (type === "roundabout" || type === "rotary") {
    const exit = step.maneuver?.exit || 1;
    return t("Nav_instruction_roundabout", { exit });
  }
  if (type === "fork") {
    if (modifier === "left") return t("Nav_instruction_fork_left");
    if (modifier === "right") return t("Nav_instruction_fork_right");
    return t("Nav_instruction_fork");
  }
  if (type === "merge") return t("Nav_instruction_merge");
  if (type === "on ramp") {
    return name
      ? t("Nav_instruction_on_ramp_with_name", { name })
      : t("Nav_instruction_on_ramp");
  }
  if (type === "off ramp") {
    return name
      ? t("Nav_instruction_off_ramp_with_name", { name })
      : t("Nav_instruction_off_ramp");
  }
  if (type === "motorway_junction") {
    return name
      ? t("Nav_instruction_motorway_junction_with_name", { name })
      : t("Nav_instruction_motorway_junction");
  }
  if (type === "end of road") {
    if (modifier === "left") return t("Nav_instruction_end_of_road_left");
    if (modifier === "right") return t("Nav_instruction_end_of_road_right");
    return t("Nav_instruction_end_of_road_straight");
  }
  if (type === "turn" || type === "new name") {
    const dirText = t(`Nav_instruction_turn_${modifier}`, {
      defaultValue: modifier,
    });
    if (name) return t("Nav_instruction_turn_with_name", { dirText, name });
    return dirText;
  }
  if (type === "notification") {
    return name
      ? t("Nav_instruction_notification_with_name", { name })
      : t("Nav_instruction_notification");
  }
  return name || t("Nav_instruction_continue");
}

function speechLanguage(lng: string): string {
  if (lng === "de") return "de-DE";
  if (lng === "es") return "es-ES";
  return "en-US";
}

export default function NavigationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const navRoute = useAuthStore((s) => s.navRoute);

  useFocusEffect(
    useCallback(() => {
      activateKeepAwake("navigation");
      return () => {
        deactivateKeepAwake("navigation");
      };
    }, []),
  );
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [speed, setSpeed] = useState(0);
  const bearingRef = useRef(0);
  const locationRef = useRef<[number, number] | null>(null);
  const flyToPending = useRef(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [remainingDist, setRemainingDist] = useState(navRoute?.distance || 0);
  const [remainingTime, setRemainingTime] = useState(navRoute?.duration || 0);
  const [progress, setProgress] = useState(0);
  const [mapStyle] = useState<string>(
    "https://tiles.openfreemap.org/styles/bright",
  );
  const mapRef = useRef<MapRef>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const [stopped, setStopped] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const lastLocRef = useRef<[number, number] | null>(null);
  const lastTimeRef = useRef<number>(0);
  const filteredSpeedRef = useRef<number>(0);

  const [arrived, setArrived] = useState(false);
  const arrivedRef = useRef(false);
  const [showWelcomeHome, setShowWelcomeHome] = useState(false);
  const [recalcNotice, setRecalcNotice] = useState(false);
  const offRouteSinceRef = useRef<number | null>(null);
  const lastRecalcRef = useRef<number>(0);
  const delayFinishRef = useRef(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechError, setSpeechError] = useState(false);
  const [speechErrorMsg, setSpeechErrorMsg] = useState("");
  const [speechNoEngine, setSpeechNoEngine] = useState(false);
  const spokenStepId = useRef<number | null>(null);
  const initPromise = useRef<Promise<boolean> | null>(null);

  const coords = useMemo(
    () => navRoute?.geometry?.coordinates || [],
    [navRoute?.geometry?.coordinates],
  );
  const steps = useMemo(() => navRoute?.steps || [], [navRoute?.steps]);
  const currentStep = steps[currentStepIdx];
  const nextStep = steps[currentStepIdx + 1];
  const destCoords = navRoute?.destinationCoords;  const mapOptions = useMemo(
    () => ({
      style: mapStyle,
      center: coords[0] || [0, 0],
      zoom: 16,
      pitch: 60,
    }),
    [mapStyle, coords],
  );

  const fetchNewRoute = useCallback(
    async (
      from: [number, number],
      to: [number, number],
      profile: "driving" | "cycling" | "walking",
    ) => {
      try {
        return await fetchOsrmRoutes(from, to, profile);
      } catch (e) {
        Sentry.captureException(e);
        return null;
      }
    },
    [],
  );

  const recalculateRoute = useCallback(
    async (from: [number, number]) => {
      const current = useAuthStore.getState().navRoute;
      if (!current || !from) return;
      const routes = await fetchNewRoute(
        from,
        current.destinationCoords,
        current.profile,
      );
      if (!routes?.length) return;
      const r = routes[0];
      useAuthStore.getState().setNavRoute({
        ...current,
        geometry: r.geometry,
        steps: r.legs?.[0]?.steps || [],
        distance: r.distance,
        duration: r.duration,
        id: `nav-${Date.now()}`,
      });
      setRecalcNotice(true);
      setTimeout(() => setRecalcNotice(false), 3000);
    },
    [fetchNewRoute],
  );

  const stopNavigation = useCallback(() => {
    setStopped(true);
    subRef.current?.remove();
    subRef.current = null;
    Tts.stop();
    useAuthStore.getState().setNavRoute(null);
    router.back();
  }, [router]);

  const speak = useCallback(
    async (text: string) => {
      if (!text || !voiceEnabled) return;
      try {
        if (!initPromise.current) {
          initPromise.current = (async () => {
            try {
              const ready = await Tts.getInitStatus();
              if (!ready) throw new Error("not_ready");
              try {
                await Tts.setDucking(true);
              } catch {
                // Ducking ist optional – Fehler hier ignorieren.
              }
              return true;
            } catch {
              return false;
            }
          })();
        }
        const ready = await initPromise.current;
        if (!ready) {
          setSpeechError(true);
          setSpeechNoEngine(true);
          setSpeechErrorMsg("no_engine");
          return;
        }
        await Tts.setDefaultLanguage(speechLanguage(i18n.language));
        await Tts.stop();
        await Tts.speak(text, { rate: 0.95 });
      } catch (e) {
        const err = e as Error;
        console.warn("[Speech] Fehler:", err?.message ?? e);
        Sentry.captureException(e);
        const msg = err?.message ?? String(e);
        setSpeechError(true);
        setSpeechNoEngine(msg === "no_engine" || msg === "not_ready");
        setSpeechErrorMsg(msg);
      }
    },
    [
      voiceEnabled,
      setSpeechError,
      setSpeechErrorMsg,
      setSpeechNoEngine,
    ],
  );

  const installSpeechEngine = useCallback(async () => {
    try {
      setSpeechErrorMsg("");
      const installed = await Tts.requestInstallEngine();
      if (!installed) {
        setSpeechErrorMsg(t("Nav_engine_install_failed"));
      } else {
        initPromise.current = null;
        setSpeechNoEngine(false);
        setSpeechError(false);
      }
    } catch (e) {
      console.warn("[Speech] Engine-Installation fehlgeschlagen:", e);
      Sentry.captureException(e);
      setSpeechErrorMsg(t("Nav_engine_install_failed"));
    }
  }, [t, setSpeechError, setSpeechErrorMsg, setSpeechNoEngine]);

  const startNavLocationWatcher = useCallback(async () => {
    if (subRef.current || stopped) return;
    let cancelled = false;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500,
          distanceInterval: 1,
        },
        (loc) => {
          if (cancelled || stopped) return;
          const { latitude, longitude, speed: sp, heading } = loc.coords;
          const pos: [number, number] = [longitude, latitude];
          const now = Date.now();

          // Plausibility filter: reject jumps that are physically impossible
          if (lastLocRef.current && lastTimeRef.current > 0) {
            const dt = (now - lastTimeRef.current) / 1000;
            const dist = haversineMeters(lastLocRef.current, pos);
            const rawSpeed = sp || 0;
            const maxAllowedSpeed =
              Math.max(rawSpeed, filteredSpeedRef.current, 5) * 2.5 + 15;
            const impliedSpeed = dt > 0 ? dist / dt : 0;

            if (impliedSpeed > maxAllowedSpeed && dist > 80) {
              return;
            }
          }

          lastLocRef.current = pos;
          lastTimeRef.current = now;

          // Smooth speed
          const rawSpeed = sp || 0;
          filteredSpeedRef.current =
            filteredSpeedRef.current * 0.7 + rawSpeed * 0.3;

          locationRef.current = pos;
          if (heading != null && heading >= 0) {
            bearingRef.current = heading;
          }

          setLocation(pos);
          setSpeed(filteredSpeedRef.current);

          if (!flyToPending.current && mapRef.current) {
            flyToPending.current = true;
            requestAnimationFrame(() => {
              if (mapRef.current && locationRef.current) {
                mapRef.current.flyTo({
                  center: locationRef.current,
                  zoom: 16,
                  pitch: 60,
                  bearing: bearingRef.current,
                  duration: 1000,
                });
              }
              flyToPending.current = false;
            });
          }
        },
      );
      if (!cancelled) subRef.current = sub;
    } catch (e) {
      Sentry.captureException(e);
    }
  }, [stopped]);

  useEffect(() => {
    startNavLocationWatcher();
    return () => {
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [startNavLocationWatcher]);

  // Restart GPS watcher when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        startNavLocationWatcher();
      }
    });
    return () => sub.remove();
  }, [startNavLocationWatcher]);

  useEffect(() => {
    if (!location || !coords.length || !navRoute) return;

    const { index, dist: offRouteDist } = findNearestPointOnRoute(
      location,
      coords,
    );

    // Ankunftserkennung: nahe am Ziel und nahezu stillstehend
    if (!arrivedRef.current && navRoute.destinationCoords) {
      const distToDest = haversineMeters(location, navRoute.destinationCoords);
      if (distToDest < 30 && filteredSpeedRef.current < 3) {
        arrivedRef.current = true;
        delayFinishRef.current = !!navRoute.isHome;
        requestAnimationFrame(() => {
          setArrived(true);
          if (navRoute.isHome) setShowWelcomeHome(true);
        });
      }
    }

    // Abweichungserkennung: deutlich von der Route entfernt über längere Zeit
    if (!arrivedRef.current) {
      const now = Date.now();
      if (offRouteDist > 200) {
        if (offRouteSinceRef.current == null) offRouteSinceRef.current = now;
        else if (
          now - offRouteSinceRef.current > 8000 &&
          now - lastRecalcRef.current > 15000
        ) {
          lastRecalcRef.current = now;
          offRouteSinceRef.current = null;
          recalculateRoute(location);
        }
      } else {
        offRouteSinceRef.current = null;
      }
    }

    const remaining = coords.slice(index);
    let totalRemaining = 0;
    for (let i = 0; i < remaining.length - 1; i++) {
      totalRemaining += haversineMeters(remaining[i], remaining[i + 1]);
    }
    const t = setTimeout(() => {
      if (navRoute.duration && navRoute.distance) {
        const ratio = Math.max(0, totalRemaining / navRoute.distance);
        setRemainingDist(totalRemaining);
        setRemainingTime(navRoute.duration * ratio);
        setProgress(Math.max(0, Math.min(1, 1 - ratio)));
      }

      const nextIdx = Math.min(index + 5, coords.length - 1);
      if (nextIdx > index) {
        const brng = getBearing(coords[index], coords[nextIdx]);
        bearingRef.current = bearingRef.current * 0.3 + brng * 0.7;
      }

      const traveled = navRoute.distance - totalRemaining;
      let cumulative = 0;
      for (let i = 0; i < steps.length; i++) {
        cumulative += steps[i].distance || 0;
        if (traveled < cumulative) {
          setCurrentStepIdx(i);
          break;
        }
      }
    });
    return () => clearTimeout(t);
  }, [location, coords, steps, navRoute, recalculateRoute]);

  // Navigation automatisch beenden, sobald das Ziel erreicht ist
  useEffect(() => {
    if (!arrived) return;
    const finish = () => stopNavigation();
    if (delayFinishRef.current) {
      const timer = setTimeout(finish, 3200);
      return () => clearTimeout(timer);
    }
    requestAnimationFrame(finish);
  }, [arrived, stopNavigation]);

  // Fit route bounds on mount
  useEffect(() => {
    if (!coords.length || !mapRef.current) return;
    const lons = coords.map(([lon]) => lon);
    const lats = coords.map(([, lat]) => lat);
    mapRef.current.fitBounds(
      [
        Math.min(...lons),
        Math.min(...lats),
        Math.max(...lons),
        Math.max(...lats),
      ],
      { padding: 80, duration: 0 },
    );
    setTimeout(() => {
      mapRef.current?.flyTo({ pitch: 60, duration: 300 });
    }, 200);
  }, [coords, mapStyle]);

  useEffect(() => {
    if (!navRoute || !steps.length) return;
    if (spokenStepId.current != null) return;
    speak(`${t("Nav_start")}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navRoute, steps]);

  useEffect(() => {
    if (!steps.length || !currentStep || !navRoute) return;
    if (spokenStepId.current === currentStepIdx) return;
    spokenStepId.current = currentStepIdx;

    const distanceText =
      currentStepIdx === 0 && steps.length > 1 && currentStep.distance
        ? ` ${formatDistance(currentStep.distance)}`
        : "";
    const stepText = getInstructionText(currentStep, t);
    speak(`${distanceText} ${stepText}`.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIdx, steps, currentStep, navRoute]);

  useEffect(() => {
    if (!arrived) return;
    // speak() ist async: alle setState laufen nach await (Microtask), nie
    // synchron im Effect-Body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (showWelcomeHome) speak(t("Nav_welcome_home"));
    else speak(t("Nav_arrived"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrived, showWelcomeHome]);

  // Sprachausgabe: Neuberechnung
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (recalcNotice) speak(t("Nav_recalculating"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalcNotice]);

  // Cleanup when navigating away (keep navRoute so route survives re-mount)
  useEffect(() => {
    return () => {
      subRef.current?.remove();
      subRef.current = null;
      Tts.stop();
    };
  }, []);

  if (!navRoute) {
    return (
      <View style={[s.container, { backgroundColor: theme.bg }]}>
        <View style={s.errorContainer}>
          <AlertTriangle size={48} color={theme.danger || "#EF4444"} />
          <Text style={[s.errorText, { color: theme.textColor }]}>
            {t("Nav_no_route_selected")}
          </Text>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: theme.primary || "#2563EB" }]}
            onPress={() => router.back()}
          >
            <Text
              style={{
                color: theme.white || "#fff",
                fontFamily: fonts.semibold,
              }}
            >
              {t("Nav_back_to_map")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: "#000" }]}>
      <StatusBar hidden />

      <MapProvider>
        <Map
          ref={mapRef}
          options={mapOptions}
          listeners={{
            load: {
              objectListener: () => setMapReady(true),
            },
          }}
        />

        {mapReady && navRoute?.geometry && (
          <GeoJSONSource
            key={`nav-route-${navRoute.id}-${navRoute.geometry.coordinates?.length ?? 0}`}
            id="nav-route"
            source={{
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: navRoute.geometry,
              },
            }}
            layers={[
              {
                layer: {
                  id: "nav-route-line",
                  type: "line",
                  paint: {
                    "line-width": 6,
                    "line-color": "#2563EB",
                  },
                },
              },
            ]}
          />
        )}

        {location && (
          <Marker
            options={{
              coordinate: location,
              element: {
                innerHTML: `
              <style>
                .pin {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 40px;
                  height: 40px;
                   background: radial-gradient(circle at 50% 50%, ${theme.accentColor}, ${darken(theme.accentColor, 0.4)});
                   border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
                  box-shadow:
                    0 4px 8px rgba(0, 0, 0, 0.3),
                    inset 0 2px 4px rgba(255, 255, 255, 0.6);
                  position: relative;
                  cursor: pointer;
                  transition: transform 0.2s ease;
                }
                .pin:hover {
                  transform: scale(1.1);
                }
                .pin-icon {
                  font-size: 20px;
                  color: white;
                  text-shadow: 0 0 3px rgba(0,0,0,0.3);
                  user-select: none;
                  pointer-events: none;
                  line-height: 1;
                }
              </style>
              <div class="pin" title="Location">
              </div>
            `,
              },
            }}
          />
        )}

        {destCoords && (
          <Marker
            options={{
              coordinate: destCoords,
              element: {
                innerHTML: `
                  <div style="
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    background: #EF4444;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  ">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>
                  </div>
                `,
              },
            }}
          />
        )}
      </MapProvider>

      <View style={[s.topBar, { backgroundColor: theme.cardBg || "#fff" }]}>
        <View style={s.instructionRow}>
          <View style={s.turnBadge}>
            <Navigation size={22} color={theme.primary || "#2563EB"} />
          </View>
          <TouchableOpacity
            style={s.instructionTextWrap}
            onPress={() => {
              const stepText = currentStep
                ? getInstructionText(currentStep, t)
                : "";
              speak(stepText || t("Nav_voice_on"));
            }}
            accessibilityRole="button"
            accessibilityLabel={t("Nav_replay")}
          >
            <Text
              style={[
                s.instructionDist,
                { color: theme.subTextColor || "#888" },
              ]}
              numberOfLines={1}
            >
              {currentStep ? formatDistance(currentStep.distance) : ""}
            </Text>
            <Text
              style={[s.instructionText, { color: theme.textColor || "#111" }]}
              numberOfLines={2}
            >
              {getInstructionText(currentStep, t)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (voiceEnabled) {
                Tts.stop();
                setVoiceEnabled(false);
              } else {
                setVoiceEnabled(true);
                setSpeechError(false);
                setSpeechErrorMsg("");
                setSpeechNoEngine(false);
                const stepText = currentStep
                  ? getInstructionText(currentStep, t)
                  : "";
                speak(stepText || t("Nav_voice_on"));
              }
            }}
            style={[
              s.voiceBtn,
              { backgroundColor: theme.borderColor || "#eee" },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              voiceEnabled ? t("Nav_voice_on") : t("Nav_voice_off")
            }
          >
            {voiceEnabled ? (
              <Volume2 size={20} color={theme.textColor || "#111"} />
            ) : (
              <VolumeX size={20} color={theme.textColor || "#111"} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={[s.bottomBar, { backgroundColor: theme.cardBg || "#fff" }]}>
        <View style={s.etaRow}>
          <View style={s.etaItem}>
            <Text style={[s.etaLabel, { color: theme.subTextColor || "#888" }]}>
              {t("Nav_arrival")}
            </Text>
            <Text style={[s.etaValue, { color: theme.textColor || "#111" }]}>
              {formatTime(remainingTime)}
            </Text>
          </View>
          <View
            style={[
              s.etaDivider,
              { backgroundColor: theme.borderColor || "#eee" },
            ]}
          />
          <View style={s.etaItem}>
            <Text style={[s.etaLabel, { color: theme.subTextColor || "#888" }]}>
              {t("Nav_distance")}
            </Text>
            <Text style={[s.etaValue, { color: theme.textColor || "#111" }]}>
              {formatDistance(remainingDist)}
            </Text>
          </View>
          <View
            style={[
              s.etaDivider,
              { backgroundColor: theme.borderColor || "#eee" },
            ]}
          />
          <View style={s.etaItem}>
            <Text style={[s.etaLabel, { color: theme.subTextColor || "#888" }]}>
              {t("Nav_speed")}
            </Text>
            <Text style={[s.etaValue, { color: theme.textColor || "#111" }]}>
              {(speed * 3.6).toFixed(0)} km/h
            </Text>
          </View>
        </View>

        <View
          style={[
            s.progressBar,
            { backgroundColor: theme.borderColor || "#eee" },
          ]}
        >
          <View
            style={[
              s.progressFill,
              {
                width: `${Math.max(2, progress * 100)}%`,
                backgroundColor: theme.primary || "#2563EB",
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[s.stopBtn, { backgroundColor: "#EF4444" }]}
          onPress={stopNavigation}
          activeOpacity={0.8}
        >
          <X size={18} color="#fff" />
          <Text style={s.stopBtnText}>{t("Nav_stop_navigation")}</Text>
        </TouchableOpacity>
      </View>

      {steps.length > 1 && (
        <View style={s.stepNavRow}>
          {currentStepIdx > 0 && (
            <TouchableOpacity
              style={[s.stepArrow, { backgroundColor: theme.cardBg || "#fff" }]}
              onPress={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
            >
              <ChevronLeft size={20} color={theme.textColor || "#111"} />
            </TouchableOpacity>
          )}
          {nextStep && (
            <TouchableOpacity
              style={[s.stepArrow, { backgroundColor: theme.cardBg || "#fff" }]}
              onPress={() =>
                setCurrentStepIdx(
                  Math.min(steps.length - 1, currentStepIdx + 1),
                )
              }
            >
              <ChevronRight size={20} color={theme.textColor || "#111"} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {showWelcomeHome && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
          style={s.welcomeOverlay}
        >
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={s.welcomeCard}
          >
            <House size={64} color="#fff" strokeWidth={2} />
            <Text style={s.welcomeTitle}>{t("Nav_welcome_home")}</Text>
          </Animated.View>
        </Animated.View>
      )}

      {recalcNotice && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          exiting={FadeOut.duration(300)}
          style={[s.recalcBanner, { backgroundColor: theme.cardBg || "#fff" }]}
        >
          <AlertTriangle
            size={16}
            color={theme.primary || "#2563EB"}
            strokeWidth={2}
          />
          <Text style={[s.recalcText, { color: theme.textColor || "#111" }]}>
            {t("Nav_recalculating")}
          </Text>
        </Animated.View>
      )}

      {speechError && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          exiting={FadeOut.duration(300)}
          style={[s.speechBanner, { backgroundColor: theme.cardBg || "#fff" }]}
        >
          <AlertTriangle size={16} color="#D97706" strokeWidth={2} />
          <View style={s.speechBannerBody}>
            <Text
              style={[s.speechBannerText, { color: theme.textColor || "#111" }]}
            >
              {t("Nav_no_speech")}
            </Text>
            {!!speechErrorMsg && (
              <Text
                style={[
                  s.speechBannerDebug,
                  { color: theme.subTextColor || "#888" },
                ]}
                numberOfLines={3}
              >
                {speechErrorMsg}
              </Text>
            )}
            {speechNoEngine && (
              <TouchableOpacity
                onPress={installSpeechEngine}
                style={[s.engineBtn, { backgroundColor: theme.primary || "#2563EB" }]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    s.engineBtnText,
                    { color: theme.white || "#fff" },
                  ]}
                >
                  {t("Nav_engine_install")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 30,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  turnBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  instructionTextWrap: { flex: 1 },
  instructionDist: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  bottomBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
    left: 16,
    right: 16,
    borderRadius: 20,
    padding: 16,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  etaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  etaItem: {
    flex: 1,
    alignItems: "center",
  },
  etaLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  etaDivider: {
    width: 1,
    height: 32,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
  },
  stopBtnText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  stepNavRow: {
    position: "absolute",
    right: 16,
    top: Platform.OS === "ios" ? 130 : 100,
    gap: 8,
  },
  stepArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    textAlign: "center",
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  welcomeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(37, 99, 235, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  welcomeCard: {
    alignItems: "center",
    gap: 16,
  },
  welcomeTitle: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 28,
  },
  recalcBanner: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 30,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 100,
  },
  recalcText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  speechBanner: {
    position: "absolute",
    top: Platform.OS === "ios" ? 130 : 100,
    left: 16,
    right: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 100,
  },
  speechBannerText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  speechBannerBody: {
    flex: 1,
    gap: 4,
  },
  speechBannerDebug: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  engineBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  engineBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
