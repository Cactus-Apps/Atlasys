import {
  MapProvider,
  Map,
  Marker,
  MapRef,
  MarkerRef,
} from "react-native-maplibre-gl-js";
import * as Location from "expo-location";
import { Box, Compass, MapIcon, Search, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Button } from "react-native-paper";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST;
const API_KEY = process.env.EXPO_PUBLIC_MAP_TILER_API_KEY || "";

type CityResult = {
  id: number | string;
  city: string;
  name?: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
  population?: number;
};

export default function MapScreen() {
  const [query, setQuery] = useState("");
  const mapRef = useRef<MapRef | null>(null);
  const markerRef = useRef<MarkerRef | null>(null);
  const [pitch, setPitch] = useState(false);
  const lastLocRef = useRef<Location.LocationObject | null>(null);
  const [zoom, setZoom] = useState(12);
  const hasCenteredOnce = useRef(false);
  const hasCenteredTwich = useRef(false);
  const [markerPos, setMarkerPos] = useState<[number, number]>();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [MapStyle, setMapStyle] = useState(
    "https://tiles.openfreemap.org/styles/bright"
  );
  const [ready, setReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<Location.LocationSubscription | null>(null);
  const scheme = useColorScheme();
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState<CityResult[]>([]);
  const [selected, setSelected] = useState<CityResult | null>(null);
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const startWatching = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (loc) => {
          setLocation(loc);
        }
      );

      setSubscription(sub);
    } catch (err: any) {}
  };

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => searchCities(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  async function searchCities(q: string) {
    setLoadingSearch(true);
    try {
      const url = `https://${RAPIDAPI_HOST}/v1/geo/cities?namePrefix=${encodeURIComponent(
        q
      )}&limit=8&sort=-population`;
      const resp = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY ?? "",
          "X-RapidAPI-Host": RAPIDAPI_HOST ?? "",
        },
      });
      if (!resp.ok) {
        console.log(t("GeoDB_error"), `${resp.status}`);
        setResults([]);
        setLoadingSearch(false);
        return;
      }
      const json = await resp.json();
      const arr = (json.data || []).map((it: any) => ({
        id: it.id ?? `${it.latitude}-${it.longitude}`,
        city: it.city || it.name || `${it.city}, ${it.country}`,
        name: it.name ?? it.city,
        country: it.country,
        region: it.region,
        latitude: it.latitude,
        longitude: it.longitude,
        population: it.population,
      }));
      setResults(arr);
    } catch (err) {
      Alert.alert(t("Search_error"), `${err}`);
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }

  function onSelectCity(city: CityResult) {
    setSelected(city);
    setModalVisible(true);
    Keyboard.dismiss();
    setZoom(9);

    mapRef.current?.flyTo({
      center: [city.longitude, city.latitude],
      zoom: 9,
      speed: 0.2,
      curve: 1,
      duration: 5000,
      pitch: 0,
    });

    setResults([]);
    setQuery(city.name ?? city.city);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location authorization denied");
        return;
      }

      const s = await Location.watchPositionAsync(
        {
          accuracy:
            Platform.OS === "android"
              ? Location.Accuracy.Balanced
              : Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (loc) => {
          if (cancelled) return;
          lastLocRef.current = loc;
          const { latitude, longitude } = loc.coords;
          setMarkerPos([longitude, latitude]);
          if (!hasCenteredOnce.current && mapRef.current) {
            hasCenteredOnce.current = true;

            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              speed: 0.3,
              curve: 1,
              duration: 100,
              pitch: 0,
            });
            ensureGlobe();
          }
        }
      );

      if (!cancelled) setSub(s);
    })().catch((e: any) => setError(e?.message ?? "Unknown error"));

    return () => {
      cancelled = true;
      sub?.remove();
      setSub(null);
    };
  }, [ready]);

  const getPos = () => {
    let cancelled = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location authorization denied");
        return;
      }

      const s = await Location.watchPositionAsync(
        {
          accuracy:
            Platform.OS === "android"
              ? Location.Accuracy.Balanced
              : Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (loc) => {
          if (cancelled) return;
          lastLocRef.current = loc;
          const { latitude, longitude } = loc.coords;
          setMarkerPos([longitude, latitude]);
          if (!hasCenteredTwich.current && mapRef.current) {
            hasCenteredTwich.current = true;

            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              speed: 0.3,
              curve: 1,
              duration: 100,
              pitch: 0,
            });
            ensureGlobe();
          }
        }
      );

      if (!cancelled) setSub(s);
    })().catch((e: any) => setError(e?.message ?? "Unknown error"));

    return () => {
      cancelled = true;
      sub?.remove();
      setSub(null);
    };
  };

  const clearInput = () => {
    setQuery("");
    setModalVisible(false);
  };

  const resetToNorth = () => {
    if (!mapRef.current) return;

    mapRef.current.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 500,
    });
  };

  const resetPitch = () => {
    if (!mapRef.current) return;

    if (pitch) {
      mapRef.current.easeTo({
        pitch: 0,
        duration: 500,
      });
    } else {
      mapRef.current.easeTo({
        pitch: 60,
        duration: 500,
      });
    }

    setPitch(!pitch);
  };

  const ensureGlobe = () => {
    mapRef.current?.setProjection({ type: "globe" });
  };

  const setMapStyleButton = () => {
    setMapStyle("https://tiles.openfreemap.org/styles/liberty");
    //    setMapStyle("https://tiles.openfreemap.org/styles/positron");
    //    setMapStyle("https://tiles.openfreemap.org/styles/bright");
    //    setMapStyle("");
    hasCenteredTwich.current = false;
    () => getPos();
  };

  return (
    <MapProvider>
      <Map
        ref={mapRef}
        options={{
          style: MapStyle,
          center: [
            location?.coords.longitude ?? 0,
            location?.coords.latitude ?? 0,
          ],
          zoom: 12,
        }}
        listeners={{
          mount: {
            rnListener: ensureGlobe,
          },
        }}
      />
      <Marker
        ref={markerRef}
        options={{
          coordinate: markerPos,
          draggable: false,
          element: {
            innerHTML: `
              <style>
                .pin {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 40px;
                  height: 40px;
                  background: radial-gradient(circle at 50% 50%, #007AFF, #004A99);
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
              <div class="pin" title="Standort">
              </div>
            `,
          },
        }}
        listeners={{
          click: {
            elementListener: async (_: MouseEvent) => {
              mapRef.current?.flyTo({
                center: markerPos,
                zoom: 14,
                speed: 0.3,
                curve: 1,
                duration: 1000,
                pitch: 0,
              });
            },
          },
        }}
      />
      <View style={styles.searchContainer}>
        <Search
          size={25}
          strokeWidth={3}
          color={scheme === "dark" ? "#d8d8d8ff" : "#666"}
          style={styles.icon}
        />
        <TextInput
          placeholder={t("Search")}
          placeholderTextColor={scheme === "dark" ? "#d8d8d8ff" : "#667"}
          style={styles.input}
          value={query}
          onChangeText={(value) => setQuery(value)}
        />
        {loadingSearch && query.length > 0 ? (
          <></>
        ) : (
          <Button onPress={clearInput}>
            <X
              size={25}
              strokeWidth={3}
              color={scheme === "dark" ? "#d8d8d8ff" : "#666"}
              style={styles.loader}
            />
          </Button>
        )}
        {loadingSearch && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={setMapStyleButton}
        style={{
          position: "absolute",
          top: 40,
          right: 12,
          backgroundColor: "#24262E",
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
          zIndex: 20,
        }}
      >
        <MapIcon color={"#fff"} size={30} />
      </TouchableOpacity>

      {results.length > 0 && !modalVisible && (
        <View style={styles.suggestionBox}>
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => onSelectCity(item)}
              >
                <Text style={styles.suggTitle}>{item.name ?? item.city}</Text>
                <Text style={styles.suggSub}>
                  {item.region ? item.region + ", " : ""}
                  {item.country}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 105,
          right: 8,
          backgroundColor: "#24262E",
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
        }}
        onPress={resetPitch}
      >
        <Box color={"#fff"} size={30} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 45,
          right: 8,
          backgroundColor: "#24262E",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 10,
        }}
        onPress={resetToNorth}
      >
        <Compass color={"#fff"} size={30} />
      </TouchableOpacity>

      {modalVisible && (
        <View style={styles.customModal}>
          {selected ? (
            <>
              <View style={styles.modalContent}>
                <View style={styles.close}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <X strokeWidth={3} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cityTitle}>
                  {selected.name ?? selected.city}
                </Text>
                <Text style={styles.citySub}>
                  {selected.region ? selected.region + ", " : ""}
                  {selected.country}
                </Text>
                <Text style={styles.cityCoords}>
                  {selected.latitude.toFixed(5)},{" "}
                  {selected.longitude.toFixed(5)}
                </Text>
              </View>
            </>
          ) : (
            <Text>{t("No_location_selected")}</Text>
          )}
        </View>
      )}
    </MapProvider>
  );
}
const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      padding: 20,
      alignItems: "center",
    },
    icon: {
      marginLeft: 13,
    },
    searchContainer: {
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 40,
      left: 12,
      right: 12,
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      backgroundColor: scheme === "dark" ? "#24262E" : "#d8d8d8ff",
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      maxWidth: 300,
      flex: 1,
    },
    input: {
      flex: 1,
      height: 44,
      paddingHorizontal: 12,
      color: scheme === "dark" ? "#fff" : "#000",
    },
    loader: {
      position: "absolute",
      right: 18,
    },
    suggestionBox: {
      position: "absolute",
      top: Platform.OS === "ios" ? 100 : 75,
      left: 12,
      right: 72,
      maxHeight: 220,
      backgroundColor: scheme === "dark" ? "#24262E" : "#d8d8d8ff",
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      zIndex: 25,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },
    suggTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: scheme === "dark" ? "#ffffffff" : "#4d4b4bff",
    },
    suggSub: {
      fontSize: 12,
      color: scheme === "dark" ? "#d8d8d8ff" : "#666",
      marginTop: 2,
    },
    webview: {
      flex: 1,
      marginTop: 0,
      width,
      height,
    },
    modalContent: {
      padding: 20,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      alignItems: "center",
      minHeight: 200,
    },
    customModal: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    cityTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
    citySub: { fontSize: 14, color: "#555" },
    cityCoords: { marginTop: 8, color: "#667" },
    closeButton: {
      padding: 7,
      width: 25,
      height: 25,
      borderRadius: 35,
      backgroundColor: "rgba(91, 92, 92, 0.4)",
      justifyContent: "center",
      alignItems: "center",
    },
    close: {
      alignSelf: "flex-end",
    },
  });
