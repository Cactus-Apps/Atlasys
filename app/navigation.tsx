import { useRouter } from "expo-router";
import { MapProvider, Map, Marker, MapRef } from "react-native-maplibre-gl-js";
import type { StyleSpecification } from "maplibre-gl";
import * as Location from "expo-location";
import * as Sentry from "@sentry/react-native";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { useAppTheme } from "@/lib/theme";
import { useAuthStore } from "@/lib/storage/zustand";
import { posthog } from "@/lib/config/posthog";
import {
  Navigation,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react-native";
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
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
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

function getInstructionText(step: any): string {
  if (!step) return "";
  const type = step.maneuver?.type || "";
  const modifier = step.maneuver?.modifier || "";
  const name = step.name || "";

  if (type === "depart")
    return name ? `Fahren Sie in Richtung ${name}` : "Losfahren";
  if (type === "arrive") return "Sie haben Ihr Ziel erreicht";
  if (type === "roundabout" || type === "rotary") {
    const exit = step.maneuver?.exit || 1;
    return `${exit}. Ausfahrt nehmen`;
  }
  if (type === "fork") {
    if (modifier === "left") return "Links halten";
    if (modifier === "right") return "Rechts halten";
    return "Der Gabelung folgen";
  }
  if (type === "merge") return "Einfädeln";
  if (type === "on ramp" || type === "off ramp") {
    return name ? `Auffahrt ${name} nehmen` : "Auffahrt nehmen";
  }
  if (type === "motorway_junction") {
    return name ? `Ausfahrt ${name} nehmen` : "Ausfahrt nehmen";
  }
  if (type === "end of road") {
    if (modifier === "left") return "Am Ende der Straße links abbiegen";
    if (modifier === "right") return "Am Ende der Straße rechts abbiegen";
    return "Am Ende der Straße geradeaus";
  }
  if (type === "turn" || type === "new name") {
    const dir: Record<string, string> = {
      left: "Links abbiegen",
      right: "Rechts abbiegen",
      straight: "Geradeaus",
      slight_left: "Leicht links",
      slight_right: "Leicht rechts",
      sharp_left: "Scharf links",
      sharp_right: "Scharf rechts",
      uturn: "Wenden",
    };
    const dirText = dir[modifier] || modifier;
    if (name) return `${dirText} in ${name}`;
    return dirText;
  }
  if (type === "notification") {
    return name ? `Weiter auf ${name}` : "Weiterfahren";
  }
  return name || "Weiterfahren";
}

export default function NavigationScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const navRoute = useAuthStore((s) => s.navRoute);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [bearing, setBearing] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [remainingDist, setRemainingDist] = useState(navRoute?.distance || 0);
  const [remainingTime, setRemainingTime] = useState(navRoute?.duration || 0);
  const [progress, setProgress] = useState(0);
  const [mapStyle, setMapStyle] = useState<string | StyleSpecification>(
    "https://tiles.openfreemap.org/styles/bright",
  );
  const mapRef = useRef<MapRef>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const [stopped, setStopped] = useState(false);

  const coords = useMemo(() => navRoute?.geometry?.coordinates || [], [navRoute?.geometry?.coordinates]);
  const steps = useMemo(() => navRoute?.steps || [], [navRoute?.steps]);
  const currentStep = steps[currentStepIdx];
  const nextStep = steps[currentStepIdx + 1];
  const destCoords = navRoute?.destinationCoords;

  const stopNavigation = useCallback(() => {
    setStopped(true);
    subRef.current?.remove();
    subRef.current = null;
    useAuthStore.getState().setNavRoute(null);
    posthog.capture("navigation_stopped");
    router.back();
  }, [router]);

  useEffect(() => {
    if (!navRoute) return;
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 3,
          },
          (loc) => {
            if (cancelled || stopped) return;
            const { latitude, longitude, speed: sp, heading } = loc.coords;
            const pos: [number, number] = [longitude, latitude];
            setLocation(pos);
            setSpeed(sp || 0);
            if (heading != null && heading >= 0) {
              setBearing(heading);
            }
          },
        );
        if (!cancelled) subRef.current = sub;
      } catch (e) {
        Sentry.captureException(e);
      }
    })();

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [navRoute, stopped]);

  useEffect(() => {
    if (!location || !coords.length || !navRoute) return;

    const { index } = findNearestPointOnRoute(location, coords);
    const remaining = coords.slice(index);
    let totalRemaining = 0;
    for (let i = 0; i < remaining.length - 1; i++) {
      const [lon1, lat1] = remaining[i];
      const [lon2, lat2] = remaining[i + 1];
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      totalRemaining += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    if (navRoute.duration && navRoute.distance) {
      const ratio = Math.max(0, totalRemaining / navRoute.distance);
      Promise.resolve().then(() => {
        setRemainingDist(totalRemaining);
        setRemainingTime(navRoute.duration * ratio);
        setProgress(Math.max(0, Math.min(1, 1 - ratio)));
      });
    }

    Promise.resolve().then(() => {
      const nextIdx = Math.min(index + 5, coords.length - 1);
      if (nextIdx > index) {
        const brng = getBearing(coords[index], coords[nextIdx]);
        setBearing((prev) => prev * 0.3 + brng * 0.7);
      }

      let stepDistSum = 0;
      for (let i = 0; i < steps.length; i++) {
        const stepDist = steps[i].distance || 0;
        stepDistSum += stepDist;
        if (totalRemaining <= navRoute.distance - stepDistSum + stepDist) {
          setCurrentStepIdx(Math.max(0, i));
          break;
        }
      }
    });
  }, [location, coords, steps, navRoute]);

  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.flyTo({
        center: location,
        zoom: 16,
        pitch: 60,
        bearing: bearing,
        duration: 500,
      });
    }
  }, [location, bearing]);

  // Build map style with embedded route source
  useEffect(() => {
    if (!navRoute?.geometry) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("https://tiles.openfreemap.org/styles/bright");
        const style = await res.json();

        if (cancelled) return;

        style.sources["nav-route"] = {
          type: "geojson",
          data: navRoute.geometry,
        };

        style.layers.push({
          id: "nav-route-line",
          type: "line",
          source: "nav-route",
          paint: {
            "line-width": 6,
            "line-color": "#2563EB",
          },
        });

        setMapStyle(style as StyleSpecification);
      } catch (e) {
        Sentry.captureException(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navRoute?.geometry]);

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

  // Cleanup when navigating away
  useEffect(() => {
    return () => {
      subRef.current?.remove();
      subRef.current = null;
      useAuthStore.getState().setNavRoute(null);
    };
  }, []);

  if (!navRoute) {
    return (
      <View style={[s.container, { backgroundColor: theme.bg }]}>
        <View style={s.errorContainer}>
          <AlertTriangle size={48} color={theme.danger || "#EF4444"} />
          <Text style={[s.errorText, { color: theme.textColor }]}>
            Keine Route ausgewählt
          </Text>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: theme.primary || "#2563EB" }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: theme.white || "#fff", fontWeight: "600" }}>
              Zurück zur Karte
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
          options={{
            style: mapStyle,
            center: location || coords[0] || [0, 0],
            zoom: 16,
            pitch: 60,
          }}
        />

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
          <View style={s.instructionTextWrap}>
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
              {getInstructionText(currentStep)}
            </Text>
          </View>
        </View>
      </View>

      <View style={[s.bottomBar, { backgroundColor: theme.cardBg || "#fff" }]}>
        <View style={s.etaRow}>
          <View style={s.etaItem}>
            <Text style={[s.etaLabel, { color: theme.subTextColor || "#888" }]}>
              Ankunft
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
              Entfernung
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
              Geschw.
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
          <Text style={s.stopBtnText}>Navigation beenden</Text>
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
  instructionTextWrap: { flex: 1 },
  instructionDist: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: "700",
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
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: "800",
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
    fontWeight: "700",
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
    fontWeight: "600",
    textAlign: "center",
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
