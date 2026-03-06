import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  FlatList,
} from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import {
  Car,
  Bike,
  Footprints,
  MapPin,
  Navigation,
  ArrowLeftRight,
  X,
  Search,
} from "lucide-react-native";

type RoutePoint = { label: string; coordinate: [number, number] };
type Profile = "driving" | "cycling" | "walking";

interface Props {
  open: boolean;
  start: RoutePoint | null;
  end: RoutePoint | null;
  onClose: () => void;
  onPickStart: () => void;
  onPickEnd: () => void;
  onSwap: () => void;
  onRouteReady: (routes: any[], profile: Profile) => void;
  pickMode: "start" | "end" | null;
  onSetStart: (point: RoutePoint) => void;
  onSetEnd: (point: RoutePoint) => void;
}

const PROFILES: { key: Profile; label: string; Icon: any }[] = [
  { key: "driving", label: "Auto", Icon: Car },
  { key: "cycling", label: "Fahrrad", Icon: Bike },
  { key: "walking", label: "Fuß", Icon: Footprints },
];

type SearchResult = { display_name: string; lat: string; lon: string };

export default function RouteSheet({
  open,
  start,
  end,
  onClose,
  onPickStart,
  onPickEnd,
  onSwap,
  onRouteReady,
  pickMode,
  onSetStart,
  onSetEnd,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const [profile, setProfile] = useState<Profile>("driving");
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Suchfelder
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [startResults, setStartResults] = useState<SearchResult[]>([]);
  const [endResults, setEndResults] = useState<SearchResult[]>([]);
  const [searchingStart, setSearchingStart] = useState(false);
  const [searchingEnd, setSearchingEnd] = useState(false);
  const [focusedField, setFocusedField] = useState<"start" | "end" | null>(
    null,
  );

  useEffect(() => {
    if (open) {
      // Kleiner Delay damit der Sheet gemountet ist
      const timer = setTimeout(() => {
        sheetRef.current?.snapToIndex(1);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      sheetRef.current?.close();
    }
  }, [open]);

  // Sync Labels in Felder wenn extern gesetzt (z.B. per Karten-Tap)
  useEffect(() => {
    if (start) setStartQuery(start.label);
  }, [start]);
  useEffect(() => {
    if (end) setEndQuery(end.label);
  }, [end]);

  // Nominatim Suche
  const searchNominatim = async (query: string): Promise<SearchResult[]> => {
    if (query.length < 2) return [];
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=de`,
      { headers: { "User-Agent": "GPS/1.0 (cactus_apps@proton.me)" } },
    );
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (focusedField !== "start") return;
    if (!startQuery || startQuery.length < 2) {
      setStartResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingStart(true);
      const results = await searchNominatim(startQuery);
      setStartResults(results);
      setSearchingStart(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [startQuery, focusedField]);

  useEffect(() => {
    if (focusedField !== "end") return;
    if (!endQuery || endQuery.length < 2) {
      setEndResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingEnd(true);
      const results = await searchNominatim(endQuery);
      setEndResults(results);
      setSearchingEnd(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [endQuery, focusedField]);

  // Route berechnen
  useEffect(() => {
    if (!start || !end) {
      setRouteInfo(null);
      return;
    }
    const timer = setTimeout(() => fetchRoute(), 100);
    return () => clearTimeout(timer);
  }, [start, end]);

  const OSRM_ENDPOINTS: Record<Profile, string> = {
    driving: "https://routing.openstreetmap.de/routed-car",
    cycling: "https://routing.openstreetmap.de/routed-bike",
    walking: "https://routing.openstreetmap.de/routed-foot",
  };

  const fetchRoute = async () => {
    if (!start || !end) return;
    setLoading(true);
    setRouteError(null);
    try {
      const base = OSRM_ENDPOINTS[profile];
      const url =
        `${base}/route/v1/${profile}/` +
        `${start.coordinate[0]},${start.coordinate[1]};` +
        `${end.coordinate[0]},${end.coordinate[1]}` +
        `?overview=full&alternatives=true&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.routes?.length) {
        setRouteError("Keine Route gefunden");
        return;
      }
      setRouteInfo({
        distance: json.routes[0].distance,
        duration: json.routes[0].duration,
      });
      onRouteReady(json.routes, profile);
    } catch {
      setRouteError("Fehler beim Laden der Route");
    } finally {
      setLoading(false);
    }
  };

  const selectResult = (result: SearchResult, field: "start" | "end") => {
    const point: RoutePoint = {
      label: result.display_name.split(",").slice(0, 2).join(", "),
      coordinate: [parseFloat(result.lon), parseFloat(result.lat)],
    };
    if (field === "start") {
      onSetStart(point);
      setStartQuery(point.label);
      setStartResults([]);
    } else {
      onSetEnd(point);
      setEndQuery(point.label);
      setEndResults([]);
    }
    setFocusedField(null);
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h} Std. ${m} Min.` : `${m} Min.`;
  };
  const formatDistance = (m: number) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["25%", "40%", "55%", "80%"]}
      onClose={onClose}
      backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
      keyboardBehavior="extend"
    >
      <BottomSheetScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Route planen</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Transport-Modi */}
        <View style={s.modeRow}>
          {PROFILES.map(({ key, label, Icon }) => (
            <TouchableOpacity
              key={key}
              style={[s.modeBtn, profile === key && s.modeBtnActive]}
              onPress={() => setProfile(key)}
            >
              <Icon size={20} color={profile === key ? "#fff" : "#64748B"} />
              <Text style={[s.modeLabel, profile === key && s.modeLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Felder */}
        <View style={s.fields}>
          {/* Start-Feld */}
          <View
            style={[
              s.fieldWrapper,
              focusedField === "start" && s.fieldWrapperActive,
            ]}
          >
            <View style={[s.dot, { backgroundColor: "#22C55E" }]} />
            <BottomSheetTextInput
              style={s.fieldInput}
              placeholder="Startpunkt eingeben..."
              placeholderTextColor="#94A3B8"
              value={startQuery}
              onChangeText={setStartQuery}
              onFocus={() => setFocusedField("start")}
            />
            {searchingStart ? (
              <ActivityIndicator size="small" color="#94A3B8" />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  sheetRef.current?.snapToIndex(0);
                  onPickStart();
                }}
              >
                <MapPin
                  size={16}
                  color={pickMode === "start" ? "#2563EB" : "#94A3B8"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Start-Vorschläge */}
          {focusedField === "start" && startResults.length > 0 && (
            <View style={s.suggestBox}>
              {startResults.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.suggestItem}
                  onPress={() => selectResult(r, "start")}
                >
                  <Navigation
                    size={14}
                    color="#64748B"
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.suggestMain} numberOfLines={1}>
                      {r.display_name.split(",")[0]}
                    </Text>
                    <Text style={s.suggestSub} numberOfLines={1}>
                      {r.display_name.split(",").slice(1, 3).join(",")}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Connector + Swap */}
          <View style={s.connectorRow}>
            <View style={s.connectorLine} />
            <TouchableOpacity onPress={onSwap} style={s.swapBtn}>
              <ArrowLeftRight size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Ziel-Feld */}
          <View
            style={[
              s.fieldWrapper,
              focusedField === "end" && s.fieldWrapperActive,
            ]}
          >
            <View style={[s.dot, { backgroundColor: "#EF4444" }]} />
            <BottomSheetTextInput
              style={s.fieldInput}
              placeholder="Ziel eingeben..."
              placeholderTextColor="#94A3B8"
              value={endQuery}
              onChangeText={setEndQuery}
              onFocus={() => setFocusedField("end")}
            />
            {searchingEnd ? (
              <ActivityIndicator size="small" color="#94A3B8" />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  sheetRef.current?.snapToIndex(0);
                  onPickStart();
                }}
              >
                <MapPin
                  size={16}
                  color={pickMode === "end" ? "#2563EB" : "#94A3B8"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Ziel-Vorschläge */}
          {focusedField === "end" && endResults.length > 0 && (
            <View style={s.suggestBox}>
              {endResults.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.suggestItem}
                  onPress={() => selectResult(r, "end")}
                >
                  <Navigation
                    size={14}
                    color="#64748B"
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.suggestMain} numberOfLines={1}>
                      {r.display_name.split(",")[0]}
                    </Text>
                    <Text style={s.suggestSub} numberOfLines={1}>
                      {r.display_name.split(",").slice(1, 3).join(",")}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Pick-Modus Hinweis */}
        {pickMode && (
          <View style={s.pickHint}>
            <Navigation size={16} color="#2563EB" />
            <Text style={s.pickHintText}>
              Tippe auf die Karte um{" "}
              {pickMode === "start" ? "den Startpunkt" : "das Ziel"} zu setzen
            </Text>
          </View>
        )}

        {/* Route-Ergebnis */}
        {loading && (
          <View style={s.infoBox}>
            <ActivityIndicator color="#2563EB" />
            <Text style={s.infoText}>Route wird berechnet...</Text>
          </View>
        )}
        {!loading && routeInfo && (
          <View style={s.resultBox}>
            <View style={s.resultItem}>
              <Text style={s.resultValue}>
                {formatDuration(routeInfo.duration)}
              </Text>
              <Text style={s.resultLabel}>Fahrzeit</Text>
            </View>
            <View style={s.resultDivider} />
            <View style={s.resultItem}>
              <Text style={s.resultValue}>
                {formatDistance(routeInfo.distance)}
              </Text>
              <Text style={s.resultLabel}>Distanz</Text>
            </View>
          </View>
        )}
        {!loading && routeError && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{routeError}</Text>
          </View>
        )}
        {start && end && (
          <TouchableOpacity
            onPress={fetchRoute}
            style={{
              marginTop: 16,
              backgroundColor: "#2563EB",
              borderRadius: 14,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Navigation size={20} color="#fff" />
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                >
                  Route berechnen
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#111" },
  closeBtn: { backgroundColor: "#F1F5F9", borderRadius: 20, padding: 6 },
  modeRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  modeBtnActive: { backgroundColor: "#2563EB" },
  modeLabel: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  modeLabelActive: { color: "#fff" },
  fields: { marginBottom: 16 },
  fieldWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  fieldWrapperActive: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  dot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  fieldInput: { flex: 1, fontSize: 15, color: "#1E293B", paddingVertical: 2 },
  connectorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 19,
    gap: 8,
    marginVertical: 4,
  },
  connectorLine: { width: 2, height: 20, backgroundColor: "#CBD5E1" },
  swapBtn: {
    marginLeft: "auto",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    padding: 6,
  },
  suggestBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  suggestMain: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  suggestSub: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
  pickHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    marginBottom: 12,
  },
  pickHintText: { color: "#2563EB", fontSize: 13, fontWeight: "500", flex: 1 },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  infoText: { color: "#64748B", fontSize: 14 },
  resultBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  resultItem: { flex: 1, alignItems: "center" },
  resultValue: { fontSize: 22, fontWeight: "700", color: "#1E40AF" },
  resultLabel: { fontSize: 12, color: "#64748B", marginTop: 2 },
  resultDivider: { width: 1, height: 40, backgroundColor: "#BFDBFE" },
  errorBox: { padding: 14, backgroundColor: "#FEF2F2", borderRadius: 12 },
  errorText: { color: "#EF4444", fontSize: 14 },
});
