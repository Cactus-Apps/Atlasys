import {
  MapProvider,
  Map,
  Marker,
  MapRef,
  MarkerRef,
  GeoJSONSource,
  VectorTileSource,
} from "react-native-maplibre-gl-js";
import Svg, {
  Circle,
  Polygon,
  G,
  Line,
  Text as SvgText,
} from "react-native-svg";
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
  Download,
  Navigation,
  MapIcon,
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
import RouteSheet from "@/components/RouteSheet";
import DownloadSheet from "@/components/DownloadSheet";
import DrawBoundsOverlay from "@/components/DrawBoundsOverlay";
import DraggableFAB from "@/components/DraggableFAB";

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

type RoutePoint = {
  label: string;
  coordinate: [number, number];
};

export default function MapScreen() {
  const markerRef = useRef<MarkerRef | null>(null);
  const markerRef2 = useRef<MarkerRef | null>(null);
  const mapCenterRef = useRef<[number, number] | null>(null);
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
  const [start, setStart] = useState<[number, number] | null>();
  const [end, setEnd] = useState<[number, number] | null>();
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
  const [BottomSheetIndex, setBottomSheetIndex] = useState<number>(2);
  const [BottomSheetIndex2, setBottomSheetIndex2] = useState<number>(2);
  const [results, setResults] = useState<CityResult[]>([]);
  const mapRef = useRef<MapRef | null>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [poiModalVisible, setPoiModalVisible] = useState(false);
  const snapPoints = useMemo(() => ["15%", "25%", "50%", "80%", "100%"], []);
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null,
  );
  const [openRoute, setOpenRoute] = useState(false);
  const sheetPoiRef = useRef<BottomSheet>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const activeFilterRef = useRef<string | null>(null);
  const routePickModeRef = useRef<"start" | "end" | null>(null);
  const setPickMode = (mode: "start" | "end" | null) => {
    routePickModeRef.current = mode;
    setRoutePickMode(mode);
  };
  const [locationReady, setLocationReady] = useState(false);
  const [routeSheetOpen, setRouteSheetOpen] = useState(false);
  const [routeStart, setRouteStart] = useState<RoutePoint | null>(null);
  const [routeEnd, setRouteEnd] = useState<RoutePoint | null>(null);
  const [routePickMode, setRoutePickMode] = useState<"start" | "end" | null>(
    null,
  );

  const [drawStart, setDrawStart] = useState<[number, number] | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const setDrawModeWrapped = (val: boolean) => {
    drawModeRef.current = val;
    setDrawMode(val);
  };
  const [drawBounds, setDrawBounds] = useState<{
    nw: [number, number];
    ne: [number, number];
    se: [number, number];
    sw: [number, number];
  } | null>(null);
  const [downloadSheetOpen, setDownloadSheetOpen] = useState(false);
  const drawModeRef = useRef(false);
  const [bearing, setBearing] = useState(0);

  const searchBarVisible =
    !drawMode &&
    !routePickMode &&
    BottomSheetIndex < 3 &&
    BottomSheetIndex2 < 3;

  const handleSetFilter = (label: string | null) => {
    activeFilterRef.current = label;
    setActiveFilter(label);
  };

  const filters = [
    { label: "Restaurants", subclass: ["restaurant"] },
    { label: "Cafés", subclass: ["cafe"] },
    { label: "Hotels", subclass: ["hotel", "hostel"] },
    {
      label: "Sehenswürdigkeiten",
      subclass: ["attraction", "museum", "monument", "artwork"],
    },
    { label: "Bars", subclass: ["bar", "pub"] },
    { label: "Shopping", subclass: ["mall", "supermarket", "shop"] },
  ];

  const { t } = useTranslation();

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
          if (!locationReady) setLocationReady(true);
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
  }, [start, end]);

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
    const { lng, lat } = event.lngLat;
    if (drawModeRef.current) return;
    if (!mapRef.current) return;
    if (routePickModeRef.current) return;

    const allFeatures = await mapRef.current.queryRenderedFeatures(undefined, {
      layers: ["poi_r1", "poi_transit"],
    });

    if (!allFeatures?.length) return;

    // Aktiven Filter anwenden
    const activeSubclasses = activeFilterRef.current
      ? (filters.find((f) => f.label === activeFilterRef.current)?.subclass ??
        [])
      : null;

    const filtered = activeSubclasses
      ? allFeatures.filter((f: any) =>
          activeSubclasses.includes(f.properties?.subclass ?? ""),
        )
      : allFeatures;

    if (!filtered.length) return;

    let closest = null;
    let minDist = Infinity;

    for (const f of filtered) {
      if (f.geometry.type !== "Point") continue;
      const [fLon, fLat] = f.geometry.coordinates;
      const dist = Math.hypot(fLon - lng, fLat - lat);
      if (dist < minDist) {
        minDist = dist;
        closest = f;
      }
    }

    if (!closest || minDist > 0.001) return;
    if (closest.geometry.type !== "Point") return;

    const [lon, lat2] = (closest.geometry as any).coordinates;
    const data = {
      name: closest.properties?.name ?? "Unbekannter POI",
      type: closest.properties?.class ?? "",
      subclass: closest.properties?.subclass ?? "",
      osm_id: closest.properties?.osm_id ?? 0,
      lat: lat2,
      lon,
    };

    setSelectedPoi(data);
    sheetPoiRef.current?.snapToIndex(0);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!locationReady && (
        <View
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 110 : 150,
            alignSelf: "center",
            backgroundColor: "#24262E",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            zIndex: 100,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500" }}>
            Standort wird ermittelt...
          </Text>
        </View>
      )}
      <MapProvider>
        {routePickMode && (
          <>
            {/* Dunkles Header-Banner wie Google Maps */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: "#1a1a2e",
                paddingTop: Platform.OS === "ios" ? 54 : 36,
                paddingBottom: 16,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                zIndex: 200,
                gap: 16,
              }}
            >
              <TouchableOpacity onPress={() => setPickMode(null)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  {routePickMode === "start"
                    ? "Start auswählen"
                    : "Ziel auswählen"}
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 13, marginTop: 2 }}>
                  Karte unter Markierung schwenken...
                </Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  // Aktuelle Kartenmitte holen
                  const center = await mapRef.current?.getCenter();
                  if (!center) return;
                  const [lng, lat] = [center.lng, center.lat];

                  // Reverse Geocode
                  let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                  try {
                    const res = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                      {
                        headers: {
                          "Accept-Language": "de",
                          "User-Agent": "GPS/1.0 (cactus_apps@proton.me)",
                        },
                      },
                    );
                    const text = await res.text();
                    const data = JSON.parse(text);
                    label =
                      data.display_name?.split(",").slice(0, 2).join(", ") ??
                      label;
                  } catch {}

                  const point: RoutePoint = { label, coordinate: [lng, lat] };
                  if (routePickMode === "start") setRouteStart(point);
                  else setRouteEnd(point);
                  setPickMode(null);
                }}
                style={{
                  backgroundColor: "#2563EB",
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                >
                  Ok
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fixer Marker in der Bildschirmmitte */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                marginLeft: -18,
                marginTop: -44, // Spitze des Markers zeigt auf Mittelpunkt
                zIndex: 199,
              }}
            >
              {/* Marker-Pin SVG-Style in HTML – aber hier als RN View: */}
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor:
                      routePickMode === "start" ? "#22C55E" : "#EF4444",
                    borderRadius: 18,
                    borderWidth: 3,
                    borderColor: "#fff",
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>
                    {routePickMode === "start" ? "🚀" : "🏁"}
                  </Text>
                </View>
                {/* Spitze des Pins */}
                <View
                  style={{
                    width: 3,
                    height: 12,
                    backgroundColor:
                      routePickMode === "start" ? "#22C55E" : "#EF4444",
                  }}
                />
                {/* Schatten-Punkt unter dem Pin */}
                <View
                  style={{
                    width: 8,
                    height: 4,
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          </>
        )}
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
              rnListener: () => {
                ensureGlobe();
                setTimeout(async () => {
                  const b = mapRef.current?.getBearing?.();
                  if (b != null) setBearing(await b);
                }, 500);
              },
            },
            rotate: {
              objectListener: (e: any) => {
                const b =
                  e?.target?.getBearing?.() ??
                  e?.target?.transform?.bearing ??
                  e?.bearing ??
                  null;
                if (b !== null) setBearing(b);
              },
            },
            move: {
              objectListener: (e: any) => {
                if (e?.target?.getCenter) {
                  const c = e.target.getCenter();
                  mapCenterRef.current = [c.lng, c.lat];
                }
                const b =
                  e?.target?.getBearing?.() ??
                  e?.target?.transform?.bearing ??
                  null;
                if (b !== null) setBearing(b);
              },
            },
          }}
        />
        {!routeSheetOpen && (
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
        )}
        {routeStart && (
          <Marker
            options={{
              coordinate: routeStart.coordinate,
              element: {
                innerHTML: `
          <div style="
            width:36px; height:36px;
            background:#22C55E;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            border:3px solid white;
          ">
            <div style="
              transform:rotate(45deg);
              width:100%; height:100%;
              display:flex; align-items:center; justify-content:center;
              font-size:16px;
            ">🚀</div>
          </div>
        `,
              },
            }}
          />
        )}

        {routeEnd && (
          <Marker
            options={{
              coordinate: routeEnd.coordinate,
              element: {
                innerHTML: `
          <div style="
            width:36px; height:36px;
            background:#EF4444;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            border:3px solid white;
          ">
            <div style="
              transform:rotate(45deg);
              width:100%; height:100%;
              display:flex; align-items:center; justify-content:center;
              font-size:16px;
            ">🏁</div>
          </div>
        `,
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
                  if (routePickModeRef.current) return;
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

        {searchBarVisible && (
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                <Search size={25} color="#667" />
                <TextInput
                  placeholder={t("Search")}
                  placeholderTextColor={
                    scheme === "dark" ? "#d8d8d8ff" : "#667"
                  }
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
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filters.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.filterChip,
                    activeFilter === item.label && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    handleSetFilter(
                      activeFilter === item.label ? null : item.label,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === item.label && styles.filterTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

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

            {results.length > 0 && query.length > 0 && (
              <View style={styles.suggestionBox}>
                <FlatList
                  data={results}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => {
                        setResults([]);
                        onSelectCity(item);
                      }}
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
        )}

        {drawMode && (
          <DrawBoundsOverlay
            mapRef={mapRef}
            onCancel={() => setDrawMode(false)}
            onConfirm={(bounds) => {
              setDrawBounds({
                nw: [bounds[0], bounds[3]],
                ne: [bounds[2], bounds[3]],
                se: [bounds[2], bounds[1]],
                sw: [bounds[0], bounds[1]],
              });
              setDrawMode(false);
              setDownloadSheetOpen(true);
            }}
          />
        )}

        <>
          {/* Kompass oben rechts – nur sichtbar wenn nicht nach Norden */}
          <TouchableOpacity
            onPress={resetToNorth}
            style={{
              position: "absolute",
              top: Platform.OS === "ios" ? 110 : 150,
              right: 16,
              width: 48,
              height: 48,
              zIndex: 100,
            }}
          >
            <Svg width={48} height={48} viewBox="0 0 48 48">
              <Circle cx="24" cy="24" r="23" fill="#1C1C1E" opacity="0.92" />

              <Circle
                cx="24"
                cy="24"
                r="23"
                fill="none"
                stroke="#3A3A3C"
                strokeWidth="1"
              />
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const isMajor = i % 3 === 0;
                const inner = isMajor ? 16 : 17.5;
                const outer = 21;
                const x1 = 24 + inner * Math.sin(angle);
                const y1 = 24 - inner * Math.cos(angle);
                const x2 = 24 + outer * Math.sin(angle);
                const y2 = 24 - outer * Math.cos(angle);
                return (
                  <Line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMajor ? "#FFFFFF" : "#555"}
                    strokeWidth={isMajor ? 1.5 : 1}
                    strokeLinecap="round"
                  />
                );
              })}

              <G rotation={-bearing} origin="24, 24">
                <Polygon points="24,8 26.5,22 24,20 21.5,22" fill="#EF4444" />
                <Polygon points="24,40 26.5,26 24,28 21.5,26" fill="#8E8E93" />

                <G rotation={bearing} origin="24, 24">
                  <SvgText
                    x="24"
                    y="29"
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="700"
                  >
                    N
                  </SvgText>
                </G>
              </G>
            </Svg>
          </TouchableOpacity>

          {/* Floating Action Bar unten rechts */}
          <View
            style={{
              position: "absolute",
              bottom: 110,
              right: 16,
              backgroundColor: "#fff",
              borderRadius: 16,
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 6,
              overflow: "hidden",
            }}
          >
            {[
              {
                icon: <Navigation color="#1E293B" size={22} />,
                onPress: () => {
                  setRouteStart(
                    markerPos
                      ? { label: "Mein Standort", coordinate: markerPos }
                      : null,
                  );
                  setRouteEnd(null);
                  setRouteSheetOpen(true);
                },
              },
              {
                icon: <MapIcon color="#1E293B" size={22} />,
                onPress: nextTheme,
                divider: true,
              },
              { icon: <Box color="#1E293B" size={22} />, onPress: resetPitch },
              {
                icon: <Download color="#1E293B" size={22} />,
                onPress: () => setDrawMode(true),
              },
            ].map((item, idx) => (
              <React.Fragment key={idx}>
                {item.divider && (
                  <View style={{ height: 1, backgroundColor: "#F1F5F9" }} />
                )}
                <TouchableOpacity
                  onPress={item.onPress}
                  style={{
                    width: 48,
                    height: 48,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {item.icon}
                </TouchableOpacity>
                {idx < 3 && !item.divider && (
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: "#F1F5F9",
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </>

        <BottomSheet
          ref={sheetPoiRef}
          index={BottomSheetIndex2}
          snapPoints={snapPoints}
          onChange={(i) => {
            setBottomSheetIndex2;
            setBottomSheetIndex2(i);
            if (i === -1) setSelectedPoi(null);
          }}
          backgroundStyle={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
        >
          {selectedPoi && (
            <BottomSheetScrollView>
              {/* Header – identisch zum City-Sheet */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.articleHeader}>
                    <Text
                      style={{
                        fontSize: 23,
                        fontWeight: "600",
                        marginLeft: 20,
                      }}
                    >
                      {selectedPoi.name}
                    </Text>
                    {/* Kategorie-Badge statt Wetter */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#EFF6FF",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        marginLeft: 30,
                        marginRight: 260,
                        marginVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#2563EB",
                          fontWeight: "600",
                          textTransform: "capitalize",
                        }}
                      >
                        {selectedPoi.subclass || selectedPoi.type}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => sheetPoiRef.current?.close()}
                      style={{
                        position: "absolute",
                        right: 10,
                        alignSelf: "flex-end",
                      }}
                    >
                      <X strokeWidth={3} />
                    </TouchableOpacity>
                  </View>

                  {/* Action-Buttons – gleiche Struktur wie City */}
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setRouteStart(
                          markerPos
                            ? { label: "Mein Standort", coordinate: markerPos }
                            : null,
                        );
                        setRouteEnd({
                          label: selectedPoi.name,
                          coordinate: [selectedPoi.lon, selectedPoi.lat],
                        });
                        setRouteSheetOpen(true);
                        sheetPoiRef.current?.close();
                      }}
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
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        await Share.share({
                          message: `📍 ${selectedPoi.name}\nhttps://www.openstreetmap.org/node/${selectedPoi.osm_id}`,
                        });
                      }}
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
              </View>

              {/* Info-Bereich */}
              <View
                style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}
              >
                <View style={{ height: 1, backgroundColor: "#F1F5F9" }} />
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                    paddingTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#94A3B8",
                      fontWeight: "500",
                    }}
                  >
                    TYP
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#1E293B",
                      fontWeight: "500",
                      textTransform: "capitalize",
                    }}
                  >
                    {selectedPoi.type}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#94A3B8",
                      fontWeight: "500",
                    }}
                  >
                    📍
                  </Text>
                  <Text style={{ fontSize: 14, color: "#64748B" }}>
                    {selectedPoi.lat.toFixed(5)}, {selectedPoi.lon.toFixed(5)}
                  </Text>
                </View>
              </View>
            </BottomSheetScrollView>
          )}
        </BottomSheet>

        {city && (
          <BottomSheet
            ref={sheetRef}
            index={BottomSheetIndex}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backgroundStyle={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
            onChange={(i) => {
              setBottomSheetIndex;
              setBottomSheetIndex(i);
              if (i === -1) setSelectedPoi(null);
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
                        onPress={() => {
                          setRouteStart(
                            markerPos
                              ? {
                                  label: "Mein Standort",
                                  coordinate: markerPos,
                                }
                              : null,
                          );
                          setRouteEnd({
                            label: city.name,
                            coordinate: [city.longitude, city.latitude],
                          });
                          setRouteSheetOpen(true);
                          sheetRef.current?.close();
                        }}
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
        <RouteSheet
          open={routeSheetOpen}
          start={routeStart}
          end={routeEnd}
          pickMode={routePickMode}
          onClose={() => {
            setRouteSheetOpen(false);
            setPickMode(null);
            setRouteStart(null);
            setRouteEnd(null);
            setRoute(null);
            setDistanceInfo(null);
          }}
          onPickStart={() => setPickMode("start")}
          onPickEnd={() => setPickMode("end")}
          onSwap={() => {
            const tmp = routeStart;
            setRouteStart(routeEnd);
            setRouteEnd(tmp);
          }}
          onSetStart={(point) => setRouteStart(point)}
          onSetEnd={(point) => setRouteEnd(point)}
          onRouteReady={(routes) => {
            setRoute(routes);
            setDistanceInfo({
              distance: routes[0].distance,
              duration: routes[0].duration,
            });

            // Karte auf Route zoomen
            if (!mapRef.current || !routes[0].geometry) return;
            const coords: [number, number][] = routes[0].geometry.coordinates;
            if (!coords.length) return;

            const lons = coords.map(([lon]) => lon);
            const lats = coords.map(([, lat]) => lat);
            const bounds: [number, number, number, number] = [
              Math.min(...lons),
              Math.min(...lats),
              Math.max(...lons),
              Math.max(...lats),
            ];
            mapRef.current.fitBounds(bounds, { padding: 80, duration: 800 });
          }}
        />
        <DownloadSheet
          open={downloadSheetOpen}
          bounds={
            drawBounds
              ? [
                  drawBounds.sw[0],
                  drawBounds.sw[1],
                  drawBounds.ne[0],
                  drawBounds.ne[1],
                ]
              : null
          }
          onClose={() => setDownloadSheetOpen(false)}
          onDownloadComplete={() => {
            setDownloadSheetOpen(false);
            // Optional: Toast anzeigen
          }}
        />
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
    searchContainer: {
      backgroundColor: scheme === "dark" ? "#24262E" : "#d8d8d8ff",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingBottom: 8,
      justifyContent: "center",
    },
    filterRow: {
      paddingTop: 8,
      paddingBottom: 4,
      gap: 8,
      flexDirection: "row",
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: "#EFEFEF",
      borderRadius: 20,
      borderColor: "#667",
      borderWidth: 2,
    },
    filterChipActive: {
      backgroundColor: "#007AFF",
    },
    filterText: {
      fontSize: 13,
      color: "#333",
    },
    filterTextActive: {
      color: "#fff",
      fontWeight: "600",
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
