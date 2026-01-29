import {
  MapProvider,
  Map,
  Marker,
  MapRef,
  MarkerRef,
  GeoJSONSource,
  VectorTileSource,
} from "react-native-maplibre-gl-js";
import * as Location from "expo-location";
import { Box, Compass, Search, X } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Avatar } from "@kolking/react-native-avatar";
import { supabase } from "@/lib/auth/supabase";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST;

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
  const [email, setEmail] = useState<string | undefined>("");
  const mapRef = useRef<MapRef | null>(null);
  const markerRef = useRef<MarkerRef | null>(null);
  const markerRef2 = useRef<MarkerRef | null>(null);
  const [pitch, setPitch] = useState(false);
  const lastLocRef = useRef<Location.LocationObject | null>(null);
  const [zoom, setZoom] = useState(12);
  const [route, setRoute] = useState<any>(null);
  const hasCenteredOnce = useRef(false);
  const hasCenteredTwich = useRef(false);
  const [markerPos, setMarkerPos] = useState<[number, number]>();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [profile, setProfile] = useState<"driving" | "cycling" | "walking">(
    "driving",
  );
  const [city, setCity] = useState<any | null>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const [images, setImages] = useState<string[]>([]);
  const [DistanceInfo, setDistanceInfo] = useState<{
    distance: number;
    duration: number;
  } | null>();
  const [BottomSheetIndex, setBottomSheetIndex] = useState<number>(-1);
  const snapPoints = useMemo(() => ["15%", "25%", "50%", "80%"], []);
  const [CityInfo, setCityInfo] = useState("");
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [MapStyle, setMapStyle] = useState(
    "https://tiles.openfreemap.org/styles/bright",
  );
  const [ready, setReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<Location.LocationSubscription | null>(null);
  const scheme = useColorScheme();
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState<CityResult[]>([]);
  const [selected, setSelected] = useState<CityResult | null>(null);
  const { t } = useTranslation();
  const [start, setStart] = useState<[number, number] | null>([9, 53]);
  const [end, setEnd] = useState<[number, number] | null>([10, 50]);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null,
  );

  const filters = [
    "Restaurants",
    "Cafés",
    "Hotels",
    "Sehenswürdigkeiten",
    "Bars",
    "Shopping",
  ];

  // Location/GPS Stuff
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
        },
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
        },
      );

      if (!cancelled) setSub(s);
    })().catch((e: any) => setError(e?.message ?? "Unknown error"));

    return () => {
      cancelled = true;
      sub?.remove();
      setSub(null);
    };
  };

  // User Auth Stuff
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setEmail(user?.email);
    };
    fetchUserEmail();
  }, []);

  let username = email!.split("@")[0];

  let name = username
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Idk
  const clearInput = () => {
    setQuery("");
    sheetRef.current?.close();
  };

  const openURL = async () => {
    const supported = await Linking.canOpenURL(res);

    if (supported) {
      await Linking.openURL(res);
    } else {
      Alert.alert(`Die URL kann nicht geöffnet werden: ${res}`);
    }
  };

  // Map Stuff
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

  // Wikipedia fetch
  const res = `https://wikipedia.org/wiki/${encodeURIComponent(city?.name)}`;
  useEffect(() => {
    if (!city?.name) return;

    const now = Date.now();
    if (now - lastFetchTime < 3000) return;
    setLastFetchTime(now);

    const tryTitle = async () => {
      const res = await fetch(
        `https://de.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
          city.name,
        )}&prop=extracts&exintro&explaintext&format=json&origin=*`,
        {
          headers: {
            "User-Agent": "GPS/1.0 (cactus_apps@proton.me)",
            Accept: "application/json",
          },
        },
      );

      const data = await res.json();
      const page = Object.values(data.query.pages)[0] as any;

      // Wikipedia nutzt -1 für "nicht gefunden"
      if (page?.pageid && page.pageid !== -1 && page.extract) {
        return page.extract;
      }

      return null;
    };

    const geoFallback = async () => {
      const res = await fetch(
        `https://de.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${city.latitude}|${city.longitude}&gsradius=30000&gslimit=20&format=json&origin=*`,
        {
          headers: {
            "User-Agent": "GPS/1.0 (cactus_apps@proton.me)",
            Accept: "application/json",
          },
        },
      );

      const data = await res.json();

      // 🔑 HIER IST DER TRICK:
      const cityPage = data.query.geosearch.find(
        (p: any) =>
          p.title === city.name ||
          p.title.includes("City") ||
          p.title.includes("(Stadt)") ||
          p.title.includes("(Bundesstaat)") ||
          p.title.includes("(Gemeinde)"),
      );

      const pageId = cityPage?.pageid;
      if (!pageId) return null;

      const textRes = await fetch(
        `https://de.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts&exintro&explaintext&format=json&origin=*`,
        {
          headers: {
            "User-Agent": "GPS/1.0 (cactus_apps@proton.me)",
            Accept: "application/json",
          },
        },
      );

      const textData = await textRes.json();
      return textData.query.pages[pageId]?.extract ?? null;
    };

    const fetchText = async () => {
      try {
        const direct = await tryTitle();
        if (direct) {
          setCityInfo(direct);
          return;
        }

        const fallback = await geoFallback();
        if (fallback) {
          setCityInfo(fallback);
          return;
        }

        setCityInfo("Keine passende Wikipedia-Seite gefunden.");
      } catch (e) {
        console.log("WIKI ERROR", e);
        setCityInfo("Fehler beim Laden der Wikipedia-Daten");
      }
    };

    const fetchImages = async () => {
      try {
        const headers = {
          "User-Agent": "GPS/1.0 (cactus_apps@proton.me)",
          Accept: "application/json",
        };

        // 1. Bilder-Titel vom Artikel holen
        const res = await fetch(
          `https://de.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
            city.name,
          )}&prop=images&format=json&origin=*`,
          { headers },
        );

        const data = await res.json();
        const pageId = Object.keys(data.query.pages)[0];

        const fileTitles = (data.query.pages[pageId]?.images || [])
          .map((img: any) => img.title)
          .filter((t: string) => /\.(jpg|jpeg|png)$/i.test(t))
          .slice(0, 10);

        if (fileTitles.length === 0) {
          setImages([]);
          return;
        }

        // 2. Echte Bild-URLs holen
        const res2 = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&titles=${fileTitles
            .map(encodeURIComponent)
            .join("|")}&prop=imageinfo&iiprop=url&format=json&origin=*`,
          { headers },
        );

        const data2 = await res2.json();

        const urls = Object.values(data2.query.pages)
          .map((p: any) => p.imageinfo?.[0]?.url)
          .filter(Boolean);

        setImages(urls);
      } catch (e) {
        console.log("Image fetch failed", e);
        setImages([]);
      }
    };

    fetchText();
    fetchImages();
  }, [city?.name]);

  // More fetching
  async function fetchCityByCoords(lat: number, lon: number) {
    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse` +
        `?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "CactusApps/1.0 (cactus_apps@proton.me)",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        console.log("Nominatim HTTP error", res.status);
        return;
      }

      const data = await res.json();

      if (!data?.address) {
        console.log("Nominatim empty address");
        return;
      }

      const address = data.address;

      const city =
        address.city ??
        address.town ??
        address.village ??
        address.hamlet ??
        address.municipality ??
        address.county ??
        "Unbekannter Ort";

      const result: CityResult = {
        id: data.place_id,
        city,
        name: data.name ?? city,
        country: address.country ?? "",
        region: address.state ?? address.region,
        latitude: lat,
        longitude: lon,
        population: undefined,
      };

      setResults([result]);
      setCity(result);
    } catch (err) {
      console.log("Nominatim_reverse_error", err);
    }
  }

  async function searchCities(q: string) {
    setLoadingSearch(true);
    try {
      const url = `https://${RAPIDAPI_HOST}/v1/geo/cities?namePrefix=${encodeURIComponent(
        q,
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

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => searchCities(query), 350);
    return () => clearTimeout(t);
  }, [query]);

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
    sheetRef.current?.snapToIndex(1);
  }

  // Routing
  const fitRouteBounds = () => {
    if (!mapRef.current || !start || !end) return;
    const bounds: [number, number, number, number] = [
      Math.min(start[0], end[0]),
      Math.min(start[1], end[1]),
      Math.max(start[0], end[0]),
      Math.max(start[1], end[1]),
    ];
    mapRef.current.fitBounds(bounds, {
      padding: 60,
      duration: 800,
    });
  };

  useEffect(() => {
    if (!start || !end) return;

    const fetchRoute = async () => {
      const url =
        `https://router.project-osrm.org/route/v1/${profile}/` +
        `${start[0]},${start[1]};${end[0]},${end[1]}` +
        `?overview=full&alternatives=true&geometries=geojson`;

      const res = await fetch(url);
      const json = await res.json();

      const geometry = json.routes?.[0]?.geometry;
      if (!json.routes?.length) return;

      setRoute(json.routes);
      setDistanceInfo({
        distance: json.routes[0].distance,
        duration: json.routes[0].duration,
      });
      fitRouteBounds();
    };

    fetchRoute().catch(console.error);
  }, [start, end, profile]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        {start && (
          <Marker
            ref={markerRef}
            options={{
              coordinate: start,
              element: {
                innerHTML: `<h1>Start</h1>`,
              },
            }}
          />
        )}
        {end && (
          <Marker
            ref={markerRef2}
            options={{
              coordinate: end,
              element: {
                innerHTML: `<h1>End</h1>`,
              },
            }}
          />
        )}
        {route &&
          route.map((r: any, i: number) => (
            <GeoJSONSource
              key={`r${i}`}
              id={`route-${i}`}
              source={{ type: "geojson", data: r.geometry }}
              layers={[
                {
                  layer: {
                    id: `route-line-${i}`,
                    type: "line",
                    paint: {
                      "line-width": i === 0 ? 6 : 3,
                      "line-color": i === 0 ? "#1d4ed8" : "#94a3b8",
                    },
                  },
                },
              ]}
            />
          ))}
        <VectorTileSource
          id="cities-source"
          source={{
            type: "vector",
            tiles: ["https://tiles.openfreemap.org/planet/v3/{z}/{x}/{y}.pbf"],
          }}
          layers={[
            {
              layer: {
                id: "cities-layer",
                type: "symbol",
                "source-layer": "place",
                minzoom: 5,
                filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
                layout: {
                  "text-field": ["get", "name"],
                  "text-size": 12,
                },
              },
              listeners: {
                click: async (e: any) => {
                  if (!mapRef.current) return;

                  const features = await mapRef.current.queryRenderedFeatures(
                    e.point,
                    { layers: ["cities-layer"] },
                  );

                  if (!features.length) return;

                  const closest = features.reduce((best: any, curr: any) => {
                    const [lon, lat] = curr.geometry.coordinates;
                    const d =
                      Math.abs(lon - e.lngLat.lng) +
                      Math.abs(lat - e.lngLat.lat);

                    if (!best) return { f: curr, d };
                    return d < best.d ? { f: curr, d } : best;
                  }, null).f;

                  const [lon, lat] = closest.geometry.coordinates;

                  setCity({
                    name: closest.properties?.name,
                    latitude: lat,
                    longitude: lon,
                  });
                  setCityInfo("");
                  setImages([]);

                  mapRef.current.flyTo({
                    center: [lon, lat],
                    zoom: 9,
                    duration: 800,
                  });

                  sheetRef.current?.snapToIndex(1);
                  fetchCityByCoords(lat, lon);
                },
              },
            },
          ]}
        />

        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <View style={styles.searchRow}>
              <Search size={25} color="#667" />
              <TextInput
                placeholder={t("Search")}
                placeholderTextColor={scheme === "dark" ? "#d8d8d8ff" : "#667"}
                style={styles.input}
                value={query}
                onChangeText={(value) => setQuery(value)}
              />
              {!loadingSearch && query.length > 0 && (
                <TouchableOpacity onPress={clearInput}>
                  <X size={18} color="#667" />
                </TouchableOpacity>
              )}
              {loadingSearch && <ActivityIndicator size="small" />}

              <View style={styles.avatarView}>
                <Avatar
                  size={39}
                  name={email ?? undefined}
                  email={email ?? undefined}
                  colorize={true}
                  radius={100}
                  badgeColor="#146275ff"
                  defaultSource={require("@/assets/images/icon.png")}
                />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filters.map((item) => (
                <TouchableOpacity key={item} style={styles.filterChip}>
                  <Text style={styles.filterText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {results.length > 0 && BottomSheetIndex === -1 && (
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
                    <Text style={styles.suggTitle}>
                      {item.name ?? item.city}
                    </Text>
                    <Text style={styles.suggSub}>
                      {item.region ? item.region + ", " : ""}
                      {item.country}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

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

        {DistanceInfo && (
          <View
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text>{(DistanceInfo.distance / 1000).toFixed(1)} km</Text>
            <Text>{(DistanceInfo.duration / 60).toFixed(0)} min</Text>
          </View>
        )}

        <BottomSheet
          ref={sheetRef}
          index={BottomSheetIndex}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          onChange={setBottomSheetIndex}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View>
              {!city ? (
                <Text>Loading</Text>
              ) : (
                <View>
                  <Text
                    style={{ fontSize: 20, fontWeight: "600", marginLeft: 20 }}
                  >
                    {city.name}
                  </Text>
                  <Text style={{ color: "#667", marginLeft: 20 }}>
                    {city.region}, {city.country}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => sheetRef.current?.close()}
              style={{ position: "absolute", right: 20 }}
            >
              <X strokeWidth={3} />
            </TouchableOpacity>
          </View>
          <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
            {images.length > 0 && (
              <View
                style={{
                  height: 220,
                  marginBottom: 16,
                  borderRadius: 14,
                  overflow: "hidden",
                  backgroundColor: "#eee",
                }}
              ></View>
            )}
            {city && <View style={{ paddingBottom: 16 }}></View>}
            <Text>{CityInfo}</Text>
            <TouchableOpacity onPress={openURL}>
              <Text style={{ color: "blue" }}> Mehr Lesen</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        </BottomSheet>
      </MapProvider>
    </GestureHandlerRootView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      padding: 20,
      alignItems: "center",
    },
    avatarView: {
      alignSelf: "center",
      marginLeft: 10,
    },
    searchWrapper: {
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 45,
      left: 12,
      right: 12,
      zIndex: 50,
    },
    searchContainer: {
      height: 46,
      backgroundColor: scheme === "dark" ? "#24262E" : "#d8d8d8ff",
      borderRadius: 12,
      paddingHorizontal: 12,
      justifyContent: "center",
    },
    suggestionBox: {
      marginTop: 0,
      maxHeight: 220,
      backgroundColor: scheme === "dark" ? "#24262E" : "#d8d8d8ff",
      borderRadius: 8,
      zIndex: 50,
      elevation: 8,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },
    searchRow: {
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      backgroundColor: "#24252a",
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    input: {
      flex: 1,
      height: 44,
      paddingHorizontal: 12,
      marginRight: 13,
      marginHorizontal: 10,
      fontSize: 16,
      color: "#d8d8d8ff",
    },
    filterRow: {
      paddingVertical: 12,
      top: 70,
      height: 20,
      width: 40,
      position: "absolute",
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: "#EFEFEF",
      borderRadius: 20,
      marginRight: 8,
    },
    filterText: {
      fontSize: 14,
      color: "#333",
    },
    loader: {
      position: "absolute",
      backgroundColor: "blue",
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
