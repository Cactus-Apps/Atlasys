import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useAppTheme } from "@/lib/theme";
import {
  Car,
  Bike,
  Footprints,
  MapPin,
  Navigation,
  ArrowLeftRight,
  X,
} from "lucide-react-native";
import * as Sentry from "@sentry/react-native";
import { useTranslation } from "react-i18next";
import { posthog } from "@/lib/config/posthog";

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

const PROFILE_DEFS: {
  key: Profile;
  labelKey: string;
  Icon: any;
}[] = [
  { key: "driving", labelKey: "Route_profile_driving", Icon: Car },
  { key: "cycling", labelKey: "Route_profile_cycling", Icon: Bike },
  { key: "walking", labelKey: "Route_profile_walking", Icon: Footprints },
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
  const { t, i18n } = useTranslation();
  const profiles = React.useMemo(
    () =>
      PROFILE_DEFS.map((p) => ({
        ...p,
        label: t(p.labelKey),
      })),
    [t],
  );
  const [profile, setProfile] = useState<Profile>("driving");
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const theme = useAppTheme();
  const s = getStyles(theme);

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
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=${encodeURIComponent(i18n.language || "en")}`,
      { headers: { "User-Agent": "GPS/1.0 (cactus_apps@proton.me)" } },
    );
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err: any) {
      Sentry.captureException(err);
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
        setRouteError(t("Route_not_found"));
        return;
      }
      setRouteInfo({
        distance: json.routes[0].distance,
        duration: json.routes[0].duration,
      });
      onRouteReady(json.routes, profile);
    } catch (err: any) {
      Sentry.captureException(err);
      setRouteError(t("Route_error_load"));
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

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0
      ? t("Route_duration_hours_mins", { h, m })
      : t("Route_duration_mins", { m });
  };
  const formatDistance = (m: number) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

  function onSheetClose() {
    onClose();
    setEndQuery("");
    setStartQuery("");
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["25%", "40%", "48%", "55%", "80%"]}
      onClose={onSheetClose}
      backgroundStyle={{
        borderTopLeftRadius: theme.isModern ? 32 : 24,
        borderTopRightRadius: theme.isModern ? 32 : 24,
        backgroundColor: theme.bg,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.subTextColor, width: 40 }}
      keyboardBehavior="extend"
    >
      <BottomSheetScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{t("Route_plan_title")}</Text>
          <TouchableOpacity onPress={onSheetClose} style={s.closeBtn}>
            <X size={20} color={theme.subTextColor} />
          </TouchableOpacity>
        </View>

        {/* Transport-Modi */}
        <View style={s.modeRow}>
          {profiles.map(({ key, label, Icon }) => (
            <TouchableOpacity
              key={key}
              style={[s.modeBtn, profile === key && s.modeBtnActive]}
              onPress={() => {
                (setProfile(key),
                  posthog.capture("route_profile_changed", { profile: key }));
              }}
            >
              <Icon
                size={20}
                color={profile === key ? theme.white : theme.subTextColor}
              />
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
            <View style={[s.dot, { backgroundColor: theme.success }]} />
            <BottomSheetTextInput
              style={s.fieldInput}
              placeholder={t("Route_placeholder_start")}
              placeholderTextColor={theme.subTextColor}
              value={startQuery}
              onChangeText={setStartQuery}
              onFocus={() => setFocusedField("start")}
            />
            {searchingStart ? (
              <ActivityIndicator size="small" color={theme.subTextColor} />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  sheetRef.current?.snapToIndex(0);
                  onPickStart();
                }}
              >
                <MapPin
                  size={16}
                  color={
                    pickMode === "start" ? theme.primary : theme.subTextColor
                  }
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Start suggestions */}
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
                    color={theme.subTextColor}
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
              <ArrowLeftRight size={16} color={theme.subTextColor} />
            </TouchableOpacity>
          </View>

          {/* End-Feld */}
          <View
            style={[
              s.fieldWrapper,
              focusedField === "end" && s.fieldWrapperActive,
            ]}
          >
            <View style={[s.dot, { backgroundColor: theme.danger }]} />
            <BottomSheetTextInput
              style={s.fieldInput}
              placeholder={t("Route_placeholder_end")}
              placeholderTextColor={theme.subTextColor}
              value={endQuery}
              onChangeText={setEndQuery}
              onFocus={() => setFocusedField("end")}
            />
            {searchingEnd ? (
              <ActivityIndicator size="small" color={theme.subTextColor} />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  sheetRef.current?.snapToIndex(0);
                  onPickEnd();
                }}
              >
                <MapPin
                  size={16}
                  color={
                    pickMode === "end" ? theme.primary : theme.subTextColor
                  }
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Destination suggestions */}
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
                    color={theme.subTextColor}
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
            <Navigation size={16} color={theme.primary} />
            <Text style={s.pickHintText}>
              {pickMode === "start"
                ? t("Route_pick_map_tap_hint_start")
                : t("Route_pick_map_tap_hint_end")}
            </Text>
          </View>
        )}

        {/* Route-Ergebnis */}
        {loading && (
          <View style={s.infoBox}>
            <ActivityIndicator color={theme.primary} />
            <Text style={s.infoText}>{t("Route_calculating")}</Text>
          </View>
        )}
        {!loading && routeInfo && (
          <View style={s.resultBox}>
            <View style={s.resultItem}>
              <Text style={s.resultValue}>
                {formatDuration(routeInfo.duration)}
              </Text>
              <Text style={s.resultLabel}>{t("Route_duration_label")}</Text>
            </View>
            <View style={s.resultDivider} />
            <View style={s.resultItem}>
              <Text style={s.resultValue}>
                {formatDistance(routeInfo.distance)}
              </Text>
              <Text style={s.resultLabel}>{t("Route_distance_label")}</Text>
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
              backgroundColor: theme.primary,
              borderRadius: 14,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {loading ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <>
                <Navigation size={20} color={theme.white} />
                <Text
                  style={{
                    color: theme.white,
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  {t("Route_calculate_button")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    cardBgSecondary,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    iconBg,
    primary,
    primaryLight,
    tabIndicator,
    white,
    danger,
    dangerLight,
  } = theme;

  return StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    title: { fontSize: 20, fontWeight: "700", color: textColor },
    closeBtn: { backgroundColor: iconBg, borderRadius: 20, padding: 6 },
    modeRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    modeBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: isModern ? 16 : 12,
      backgroundColor: cardBgSecondary,
    },
    modeBtnActive: { backgroundColor: tabIndicator },
    modeLabel: { fontSize: 13, fontWeight: "600", color: subTextColor },
    modeLabelActive: { color: white },
    fields: { marginBottom: 16 },
    fieldWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: cardBg,
      borderRadius: isModern ? 18 : 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1.5,
      borderColor: borderColor,
    },
    fieldWrapperActive: {
      borderColor: tabIndicator,
      backgroundColor: primaryLight,
    },
    dot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
    fieldInput: { flex: 1, fontSize: 15, color: textColor, paddingVertical: 2 },
    connectorRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 19,
      gap: 8,
      marginVertical: 4,
    },
    connectorLine: { width: 2, height: 20, backgroundColor: borderColor },
    swapBtn: {
      marginLeft: "auto",
      backgroundColor: iconBg,
      borderRadius: 20,
      padding: 6,
    },
    suggestBox: {
      backgroundColor: cardBg,
      borderRadius: isModern ? 18 : 12,
      marginTop: 4,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: borderColor,
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
      borderBottomColor: borderColor,
    },
    suggestMain: { fontSize: 14, fontWeight: "600", color: textColor },
    suggestSub: { fontSize: 12, color: subTextColor, marginTop: 1 },
    pickHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      backgroundColor: primaryLight,
      borderRadius: isModern ? 16 : 12,
      marginBottom: 12,
    },
    pickHintText: {
      color: tabIndicator,
      fontSize: 13,
      fontWeight: "500",
      flex: 1,
    },
    infoBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      backgroundColor: cardBg,
      borderRadius: isModern ? 16 : 12,
      borderColor: borderColor,
      borderWidth: 1,
    },
    infoText: { color: subTextColor, fontSize: 14 },
    resultBox: {
      flexDirection: "row",
      backgroundColor: primaryLight,
      borderRadius: isModern ? 24 : 16,
      padding: 20,
      alignItems: "center",
    },
    resultItem: { flex: 1, alignItems: "center" },
    resultValue: {
      fontSize: 22,
      fontWeight: "700",
      color: primary,
    },
    resultLabel: { fontSize: 12, color: subTextColor, marginTop: 2 },
    resultDivider: {
      width: 1,
      height: 40,
      backgroundColor: borderColor,
    },
    errorBox: {
      padding: 14,
      backgroundColor: dangerLight,
      borderRadius: isModern ? 16 : 12,
    },
    errorText: { color: danger, fontSize: 14 },
  });
};
