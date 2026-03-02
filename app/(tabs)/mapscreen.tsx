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
import {
  Box,
  Cloud,
  CloudRain,
  Compass,
  ImageIcon,
  Search,
  Sun,
  History,
  X,
  Layers,
  Heart,
  Share2,
  Route,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";

import { Avatar } from "@kolking/react-native-avatar";
import { supabase } from "@/lib/auth/supabase";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import ProfileScreen from "./profilescreen";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FlatList as GHFlatList } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { MapMouseEvent } from "maplibre-gl";

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

type SelectedCity = {
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
};

interface ArticleData {
  title: string;
  thumbnail: string | null;
  extract: string;
  images: string[];
}

export default function MapScreen() {
  const markerRef = useRef<MarkerRef | null>(null);
  const markerRef2 = useRef<MarkerRef | null>(null);
  const [pitch, setPitch] = useState(false);
  const lastLocRef = useRef<Location.LocationObject | null>(null);
  const [zoom, setZoom] = useState(12);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [route, setRoute] = useState<any>(null);
  const hasCenteredOnce = useRef(false);
  const hasCenteredTwich = useRef(false);
  const [profile, setProfile] = useState<"driving" | "cycling" | "walking">(
    "driving",
  );
  const [images, setImages] = useState<string[]>([]);
  const [DistanceInfo, setDistanceInfo] = useState<{
    distance: number;
    duration: number;
  } | null>();
  const [CityInfo, setCityInfo] = useState("");
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [MapStyle, setMapStyle] = useState(
    "https://tiles.openfreemap.org/styles/bright",
  );
  const [avatarview, setavatarview] = useState(false);
  const [ready, setReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<Location.LocationSubscription | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selected, setSelected] = useState<CityResult | null>(null);
  const [start, setStart] = useState<[number, number] | null>([9, 53]);
  const [end, setEnd] = useState<[number, number] | null>([10, 50]);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [savedLocations, setSavedLocations] = useState<SelectedCity[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState<string | null>();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [mapThemeIndex, setMapThemeIndex] = useState(0);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(
    null,
  );
  const [liked, setLiked] = useState(false);
  const [markerPos, setMarkerPos] = useState<[number, number]>();
  const [selectedPoi, setSelectedPoi] = useState<{
    name: string;
    type: string;
    subclass: string;
    osm_id: number;
    lat: number;
    lon: number;
  } | null>(null);
  const [city, setCity] = useState<SelectedCity | null>(null);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [BottomSheetIndex, setBottomSheetIndex] = useState<number>(-1);
  const [BottomSheetIndex2, setBottomSheetIndex2] = useState<number>(1);
  const [results, setResults] = useState<CityResult[]>([]);
  const mapRef = useRef<MapRef | null>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [poiModalVisible, setPoiModalVisible] = useState(false);
  const snapPoints = useMemo(() => ["15%", "25%", "50%", "80%"], []);
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null,
  );
  const [openRoute, setOpenRoute] = useState(false);
  const sheetPoiRef = useRef<BottomSheet>(null);

  const { t } = useTranslation();

  const filters = [
    "Restaurants",
    "Cafés",
    "Hotels",
    "Sehenswürdigkeiten",
    "Bars",
    "Shopping",
  ];

  const mapThemes = [
    "https://tiles.openfreemap.org/styles/bright",
    "https://tiles.openfreemap.org/styles/dark",
    "https://tiles.openfreemap.org/styles/liberty",
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

  // User Auth Stuff
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setEmail(user?.email);
    };
    fetchUserEmail();
  }, []);

  // Idk
  const clearInput = () => {
    setQuery("");
    setResults([]);
    sheetRef.current?.close();
  };

  const openURL = async () => {
    if (!city?.name) return;
    const title = city.name.replace(/ /g, "_");
    const url = `https://de.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Kann Wikipedia nicht öffnen");
    }
  };

  const closeModal = () => {
    setCity(null);
    setQuery("");
    setResults([]);
    setArticle(null);
    sheetRef.current?.close();
    setBottomSheetIndex(-1);
  };

  // Map Stuff
  const resetToNorth = () => {
    mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 });
    setPitch(false);
  };

  const resetPitch = () => {
    const nextPitch = !pitch;
    mapRef.current?.easeTo({ pitch: nextPitch ? 60 : 0, duration: 500 });
    setPitch(nextPitch);
  };

  const openProfileScreen = () => {
    setavatarview((prev) => !prev);
  };

  const ensureGlobe = () => {
    mapRef.current?.setProjection({ type: "globe" });
  };

  const toggleFavorite = () => {
    if (!city) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const exists = savedLocations.find((l) => l.name === city.name);
    if (exists) {
      setSavedLocations((prev) => prev.filter((l) => l.name !== city.name));
    } else {
      setSavedLocations((prev) => [...prev, city]);
    }
  };

  const shareCity = async () => {
    if (!city) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const url = `https://de.wikipedia.org/wiki/${encodeURIComponent(city.name.replace(/ /g, "_"))}`;
      await Share.share({
        message: `Schau dir diesen Ort an: ${city.name}\n${url}`,
        url: url,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const nextTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = (mapThemeIndex + 1) % mapThemes.length;
    setMapThemeIndex(next);
    setMapStyle(mapThemes[next]);
  };

  const headers = {
    "User-Agent": "GPS/1.0 (cactus_apps@proton.me)",
    Accept: "application/json",
  };

  // Wikipedia logic
  useEffect(() => {
    if (!city?.name) return;

    const fetchWikipediaData = async () => {
      setLoading(true);
      setError(null);
      setArticle(null);

      try {
        const searchRes = await fetch(
          `https://de.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
            city?.name,
          )}&limit=1&format=json&origin=*`,
          { headers },
        );
        const searchData = await searchRes.json();

        if (!searchData[1] || searchData[1].length === 0) {
          setError("Kein Artikel gefunden.");
          setLoading(false);
          return;
        }

        const pageTitle = searchData[1][0];

        // 2. Fetch extract
        const extractRes = await fetch(
          `https://de.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&piprop=thumbnail&pithumbsize=1000&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`,
          { headers },
        );
        const extractData = await extractRes.json();
        const pages = extractData.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId].extract;
        const thumbnail = pages[pageId].thumbnail?.source || null;

        // 3. Fetch images with deduplication
        const imagesPropRes = await fetch(
          `https://de.wikipedia.org/w/api.php?action=query&prop=images&titles=${encodeURIComponent(pageTitle)}&imlimit=50&format=json&origin=*`,
          { headers },
        );
        const imagesPropData = await imagesPropRes.json();
        const imageTitles =
          imagesPropData.query?.pages[pageId]?.images?.map(
            (img: any) => img.title,
          ) || [];

        let imageUrls: string[] = [];
        const isJunk = (url: string) => {
          const lower = url.toLowerCase();
          return (
            lower.includes("flag") ||
            lower.includes("wappen") ||
            lower.includes("kupferstich") ||
            lower.includes("buergermeister") ||
            lower.includes("arena") ||
            lower.includes("kulturzentrum") ||
            lower.includes("coats") ||
            lower.includes("spd") ||
            lower.includes("stadium") ||
            lower.includes("coat_of_arms") ||
            lower.includes("climate") ||
            lower.includes("klimadiagramm") ||
            lower.includes("temperature") ||
            lower.includes("map") ||
            lower.includes("karte") ||
            lower.includes("icon") ||
            lower.includes("logo") ||
            lower.includes(".svg")
          );
        };
        if (imageTitles.length > 0) {
          // Fetch URLs for the ordered titles (up to 50)
          const titlesQuery = imageTitles
            .map((t: string) => encodeURIComponent(t))
            .join("|");
          const imagesInfoRes = await fetch(
            `https://de.wikipedia.org/w/api.php?action=query&titles=${titlesQuery}&prop=imageinfo&iiprop=url&format=json&origin=*`,
            { headers },
          );
          const imagesInfoData = await imagesInfoRes.json();

          if (imagesInfoData.query?.pages) {
            const urlMap: Record<string, string> = {};
            Object.values(imagesInfoData.query.pages).forEach((p: any) => {
              if (p.imageinfo?.[0]?.url) {
                urlMap[p.title] = p.imageinfo[0].url;
              }
            });

            // Filter und maintain order
            const filteredUrls: string[] = [];
            imageTitles.forEach((title: string) => {
              const url = urlMap[title];
              if (
                url &&
                !isJunk(url) &&
                (url.endsWith(".jpg") ||
                  url.endsWith(".png") ||
                  url.endsWith(".jpeg"))
              ) {
                filteredUrls.push(url);
              }
            });
            imageUrls = filteredUrls;
          }
        }
        let finalThumbnail = thumbnail;
        if (finalThumbnail && isJunk(finalThumbnail)) {
          finalThumbnail = imageUrls[0] || null;
        } else if (!finalThumbnail && imageUrls.length > 0) {
          finalThumbnail = imageUrls[0];
        }

        setArticle({
          title: pageTitle,
          extract: extract || "Keine Zusammenfassung verfügbar.",
          thumbnail: finalThumbnail,
          images: imageUrls,
        });
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Wikipedia-Daten");
      } finally {
        setLoading(false);
      }
    };

    const now = Date.now();
    if (now - lastFetchTime < 3000) return;
    setLastFetchTime(now);
    fetchWikipediaData();
  }, [city?.name, city?.latitude, city?.longitude]);

  // Weather logic
  useEffect(() => {
    if (!city?.latitude || !city?.longitude) return;

    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true`,
        );
        const data = await res.json();
        if (data.current_weather) {
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            code: data.current_weather.weathercode,
          });
        }
      } catch (err) {
        console.error("Weather error:", err);
      }
    };

    fetchWeather();
  }, [city?.latitude, city?.longitude]);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun size={20} color="#FFD700" />;
    if (code <= 48) return <Cloud size={20} color="#94A3B8" />;
    if (code <= 99) return <CloudRain size={20} color="#3B82F6" />;
    return <Cloud size={20} color="#94A3B8" />;
  };

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
    sheetRef.current?.snapToIndex(2);
    setSelected(city);
    Keyboard.dismiss();
    setZoom(9);

    setSearchHistory((prev) => {
      const filtered = prev.filter((q) => q !== (city.name ?? city.city));
      return [city.name ?? city.city, ...filtered].slice(0, 5);
    });

    selectCity({
      name: city.name ?? city.city,
      latitude: city.latitude,
      longitude: city.longitude,
      region: city.region,
      country: city.country,
    });

    setResults([]);
    setQuery(city.name ?? city.city);
    setQuery("");

    mapRef.current?.flyTo({
      center: [city.longitude, city.latitude],
      zoom: 9,
      speed: 0.2,
      curve: 1,
      duration: 5000,
      pitch: 0,
    });
  }

  function selectCity(city: SelectedCity) {
    setCity(city);
    setImages([]);
    setResults([]);
    setQuery(city.name);
    mapRef.current?.flyTo({
      center: [city.longitude, city.latitude],
      zoom: 9,
      duration: 1200,
    });

    sheetRef.current?.snapToIndex(2);
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

  const buildRouteToPoi = async (poi: any) => {
    if (!markerPos) return;

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${markerPos[0]},${markerPos[1]};${poi.lon},${poi.lat}` +
      `?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const json = await res.json();

    if (!json.routes?.length) return;

    setRoute(json.routes);
  };

  const onMapClick = async (event: any) => {
    if (!mapRef.current) return;

    const features = await mapRef.current.queryRenderedFeatures(event.point, {
      layers: ["poi-layer"],
    });

    if (!features?.length) return;

    const clickLng = event.lngLat.lng;
    const clickLat = event.lngLat.lat;

    // nächstgelegenen POI zum Klick finden
    let closest = null;
    let minDistance = Infinity;

    for (const f of features) {
      if (f.geometry.type !== "Point") continue;

      const [lon, lat] = f.geometry.coordinates;

      const d = Math.abs(lon - clickLng) + Math.abs(lat - clickLat);

      if (d < minDistance) {
        minDistance = d;
        closest = f;
      }
    }

    if (!closest) return;

    if (closest.geometry.type !== "Point") return;

    const data = {
      name: closest.properties.name ?? "Unbekannter POI",
      type: closest.properties.class,
      subclass: closest.properties.subclass,
      osm_id: closest.properties.osm_id,
      lat: closest.geometry.coordinates[1],
      lon: closest.geometry.coordinates[0],
    };

    setSelectedPoi(data);
    setPoiModalVisible(true);

    buildRouteToPoi(data);
    console.warn("Clicked POI:", data);
  };

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
            click: {
              objectListener: onMapClick,
            },
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
                    {
                      layers: ["cities-layer"],
                    },
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

                  setBottomSheetIndex(2);
                  sheetRef.current?.snapToIndex(2);
                  selectCity({
                    name: closest.properties?.name ?? "Unbekannter Ort",
                    latitude: lat,
                    longitude: lon,
                  });
                },
              },
            },
          ]}
        />

        <VectorTileSource
          id="vector-source"
          source={{
            type: "vector",
            tiles: ["https://tiles.openfreemap.org/planet/v3/{z}/{x}/{y}.pbf"],
          }}
          layers={[
            {
              layer: {
                id: "poi-layer",
                type: "symbol",
                "source-layer": "poi",
                minzoom: 14,
                maxzoom: 24,

                layout: {
                  "icon-image": ["get", "subclass"], // 👈 wichtig
                  "icon-size": 1,
                  "text-field": ["get", "name"],
                  "text-size": 12,
                  "text-offset": [0, 1.2],
                  "text-anchor": "top",
                },

                paint: {
                  "text-color": "#222",
                  "text-halo-color": "#fff",
                  "text-halo-width": 1,
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

              <TouchableOpacity onPress={openProfileScreen}>
                <View style={styles.avatarView}>
                  <Avatar
                    size={34}
                    name={email ?? undefined}
                    email={email ?? undefined}
                    colorize={true}
                    radius={100}
                    badgeColor="#146275ff"
                    defaultSource={require("@/assets/images/icon.png")}
                  />
                </View>
              </TouchableOpacity>
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

          {query.length === 0 && searchHistory.length > 0 && (
            <Animated.View entering={FadeInDown} style={styles.suggestionBox}>
              <View style={styles.historyHeader}>
                <History size={16} color="#888" />
                <Text style={styles.historyHeaderText}>Zuletzt gesucht</Text>
                <TouchableOpacity onPress={() => setSearchHistory([])}>
                  <X size={16} color="#888" />
                </TouchableOpacity>
              </View>
              {searchHistory.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionItem}
                  onPress={() => setQuery(item)}
                >
                  <Text style={styles.suggTitle}>{item}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {results.length > 0 &&
            BottomSheetIndex === -1 &&
            query.length > 0 && (
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

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={nextTheme}>
            <Layers color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={resetPitch}>
            <Box color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={resetToNorth}>
            <Compass color="#fff" size={24} />
          </TouchableOpacity>
        </View>

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

        <Modal visible={poiModalVisible} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 20,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                minHeight: 200,
              }}
            >
              {selectedPoi ? (
                <>
                  <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                    {selectedPoi.name}
                  </Text>

                  <Text>Typ: {selectedPoi.type}</Text>
                  <Text>Untertyp: {selectedPoi.subclass}</Text>
                  <Text>OSM ID: {selectedPoi.osm_id}</Text>

                  <TouchableOpacity
                    onPress={() => setPoiModalVisible(false)}
                    style={{
                      marginTop: 20,
                      backgroundColor: "#007AFF",
                      padding: 12,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      Schließen
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text>Kein POI ausgewählt</Text>
              )}
            </View>
          </View>
        </Modal>

        {city && (
          <BottomSheet
            ref={sheetRef}
            index={BottomSheetIndex}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            onChange={setBottomSheetIndex}
            backgroundStyle={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            {loading && <LoadingOverlay />}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View>
                {!city ? (
                  <Text>Loading</Text>
                ) : (
                  <View style={{ flex: 1 }}>
                    <View style={styles.articleHeader}>
                      <Text
                        style={{
                          fontSize: 23,
                          fontWeight: "600",
                          marginLeft: 20,
                        }}
                      >
                        {city.name}
                      </Text>
                      <TouchableOpacity
                        onPress={closeModal}
                        style={{
                          position: "absolute",
                          right: 10,
                          alignSelf: "flex-end",
                        }}
                      >
                        <X strokeWidth={3} />
                      </TouchableOpacity>
                      {weather && (
                        <View style={styles.weatherBadge}>
                          {getWeatherIcon(weather.code)}
                          <Text style={styles.weatherText}>
                            {weather.temp}°C
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.headerActions}>
                      <TouchableOpacity
                        onPress={() => setOpenRoute(true)}
                        style={{
                          backgroundColor: "#2563EB",
                          width: 220,
                          height: 50,
                          borderRadius: 12,
                          flexDirection: "row",
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 20,
                        }}
                      >
                        <Route color="#fff" size={24} />
                        <Text
                          style={{
                            fontWeight: "500",
                            fontSize: 18,
                            color: "#fff",
                            paddingHorizontal: 10,
                          }}
                        >
                          Route starten
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={toggleFavorite}
                        style={{
                          backgroundColor: "#F3F4F6",
                          width: 50,
                          height: 50,
                          borderRadius: 12,
                          flexDirection: "row",
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          alignItems: "center",
                        }}
                      >
                        <Heart
                          color={
                            savedLocations.find((l) => l.name === city.name)
                              ? "#FF3B30"
                              : "#666"
                          }
                          fill={
                            savedLocations.find((l) => l.name === city.name)
                              ? "#FF3B30"
                              : "transparent"
                          }
                          size={24}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={shareCity}
                        style={{
                          backgroundColor: "#F3F4F6",
                          width: 50,
                          height: 50,
                          borderRadius: 12,
                          padding: 10,
                          alignSelf: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Share2 color="#007AFF" size={24} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {!loading && article && (
              <BottomSheetScrollView contentContainerStyle={{ padding: 0 }}>
                {article?.thumbnail && (
                  <View style={styles.heroImageContainer}>
                    <Image
                      source={{ uri: article.thumbnail }}
                      style={styles.heroImage}
                      contentFit="cover"
                      transition={500}
                    />
                  </View>
                )}

                <View style={{ padding: 20 }}>
                  {article.images.length > 0 && (
                    <View style={styles.imageSection}>
                      <View style={styles.sectionHeader}>
                        <ImageIcon color="#007AFF" size={20} />
                        <Text style={styles.sectionTitle}>
                          Bilder ({article.images.length})
                        </Text>
                      </View>
                      <GHFlatList
                        horizontal
                        data={article.images}
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled
                        keyExtractor={(item: string) => item}
                        renderItem={({ item, index }: any) => (
                          <TouchableOpacity
                            style={styles.imageWrapper}
                            onPress={() => setSelectedImageIndex(index)}
                            activeOpacity={0.8}
                          >
                            <Image
                              source={{ uri: item }}
                              style={styles.image}
                              contentFit="cover"
                              transition={300}
                            />
                          </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.imageList}
                      />
                    </View>
                  )}
                  {city && <View style={{ paddingBottom: 16 }}></View>}
                  <Text style={styles.extractText}>
                    {article?.extract}
                    {CityInfo}
                  </Text>
                  <TouchableOpacity
                    onPress={openURL}
                    style={styles.readMoreButton}
                  >
                    <Text style={styles.readMoreText}>
                      Auf Wikipedia weiterlesen
                    </Text>
                  </TouchableOpacity>
                </View>
              </BottomSheetScrollView>
            )}
          </BottomSheet>
        )}
        <Modal
          visible={selectedImageIndex !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImageIndex(null)}
        >
          <View style={styles.modalBackground}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setSelectedImageIndex(null)}
            />
            <View style={styles.modalContent}>
              <FlatList
                horizontal
                pagingEnabled
                data={article?.images || []}
                initialScrollIndex={selectedImageIndex || 0}
                getItemLayout={(_, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => `full-${item}`}
                renderItem={({ item }) => (
                  <View style={styles.fullscreenImageWrapper}>
                    <Image
                      source={{ uri: item }}
                      style={styles.fullscreenImage}
                      contentFit="contain"
                      transition={300}
                    />
                  </View>
                )}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedImageIndex(null)}
              >
                <X color="#fff" size={28} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={openRoute} style={{ backgroundColor: "#fff" }}>
          <Text>Hallo Route erstellen</Text>
        </Modal>
      </MapProvider>
    </GestureHandlerRootView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    weatherBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#F1F5F9",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    weatherText: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#475569",
    },
    articleHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
      gap: 10,
      marginLeft: 10,
    },
    readMoreButton: {
      marginTop: 20,
      padding: 15,
      backgroundColor: "#f0f7ff",
      borderRadius: 12,
      alignItems: "center",
    },
    readMoreText: {
      color: "#007AFF",
      fontWeight: "600",
      fontSize: 16,
    },
    fullscreenImageWrapper: {
      width: width,
      height: height,
      justifyContent: "center",
      alignItems: "center",
    },
    controlsContainer: {
      position: "absolute",
      bottom: 100,
      right: 16,
      gap: 12,
    },
    actionIconButton: {
      padding: 5,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
    },
    closeIconBtn: {
      marginLeft: 5,
      padding: 5,
    },
    historyHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#eee",
    },
    historyHeaderText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#888",
      textTransform: "uppercase",
      paddingRight: 170,
    },
    controlButton: {
      backgroundColor: "#24262E",
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    extractText: {
      fontSize: 16,
      lineHeight: 24,
      color: "#444",
      textAlign: "justify",
    },
    imageSection: {
      marginTop: 30,
      marginBottom: 50,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#1a1a1a",
    },
    imageList: {
      paddingRight: 20,
    },
    imageWrapper: {
      width: width * 0.7,
      height: 200,
      marginRight: 15,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#eee",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    image: {
      width: "100%",
      height: "100%",
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
    modalBackground: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenImage: {
      width: width,
      height: width * 1.5,
    },
    closeButton: {
      position: "absolute",
      top: 50,
      right: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: 10,
      borderRadius: 25,
    },
    heroImageContainer: {
      width: "100%",
      height: 250,
      backgroundColor: "#f0f0f0",
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
  });
