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
  BookOpen,
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
  LocateFixed,
  Shuffle,
  Heart,
  Share2,
  Navigation,
  MapPin,
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
import { BlurView } from "expo-blur";

import { Avatar } from "@kolking/react-native-avatar";
import { supabase } from "@/lib/auth/supabase";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/lib/storage/zustand";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
} from "react-native-reanimated";
import { FlatList as GHFlatList } from "react-native-gesture-handler";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { runOnJS } from "react-native-reanimated";
import { TouchableWithoutFeedback } from "react-native";

const { width, height } = Dimensions.get("window");

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST;
const accentColor = "#2563EB";

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

import { useRouter, useLocalSearchParams } from "expo-router";
import { LoadingOverlay } from "@/components/overlays/LoadingOverlay";
import ProfileScreen from "./(tabs)/profilescreen";

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const markerRef = useRef<MarkerRef | null>(null);
  const markerRef2 = useRef<MarkerRef | null>(null);
  const lastParamsRef = useRef<string>("");
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
  const currentRoute = useAuthStore((s) => s.currentRoute);
  const setCurrentRoute = useAuthStore((s) => s.setCurrentRoute);
  const addRouteToHistory = useAuthStore((s) => s.addRouteToHistory);
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
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const heartRotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: heartScale.value * 2 },
      { rotate: `${heartRotate.value}deg` },
    ],
    opacity: heartOpacity.value,
  }));
  const [markerPos, setMarkerPos] = useState<[number, number]>();
  const [city, setCity] = useState<SelectedCity | null>(null);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [BottomSheetIndex, setBottomSheetIndex] = useState<number>(-1);
  const [results, setResults] = useState<CityResult[]>([]);
  const mapRef = useRef<MapRef | null>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const addPlace = useAuthStore((s) => s.addPlace);
  const removePlace = useAuthStore((s) => s.removePlace);
  const isPlaceSaved = useAuthStore((s) => s.isPlaceSaved);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const snapPoints = useMemo(() => ["15%", "25%", "50%", "80%", "100%"], []);

  // Load persistent route on mount
  useEffect(() => {
    if (currentRoute) {
      setRoute([currentRoute]); // Wrap in array as expected by map.map
      setDistanceInfo({
        distance: currentRoute.distance,
        duration: currentRoute.duration,
      });
      setEnd(currentRoute.destinationCoords);
    }
  }, []);
  const scheme = useColorScheme();
  const isSubscribed = useAuthStore((s) => s.isSubscribed);
  const searchCount = useAuthStore((s) => s.searchCount);
  const incrementSearchCount = useAuthStore((s) => s.incrementSearchCount);
  const isDark = scheme === "dark";
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null,
  );

  const { t } = useTranslation();

  const filters = [
    t("Restaurants"),
    t("Cafés"),
    t("Hotels"),
    t("Attractions"),
    t("Bars"),
    t("Shopping"),
  ];

  const mapThemes = [
    "https://tiles.openfreemap.org/styles/bright",
    "https://tiles.openfreemap.org/styles/dark",
    "https://tiles.openfreemap.org/styles/liberty",
  ];
  // Handle incoming params for routing or navigation
  useEffect(() => {
    const { destLat, destLon, destName, autoRoute } = params;
    const paramHash = `${destLat}-${destLon}-${destName}-${autoRoute}`;

    if (
      destLat &&
      destLon &&
      mapRef.current &&
      paramHash !== lastParamsRef.current
    ) {
      lastParamsRef.current = paramHash;
      const dLat = parseFloat(destLat as string);
      const dLon = parseFloat(destLon as string);

      // Update state if different
      setEnd([dLon, dLat]);

      if (destName) {
        setCity({
          name: destName as string,
          latitude: dLat,
          longitude: dLon,
        });
      }

      if (autoRoute === "true") {
        // Wait for location with retry logic
        const tryFetchRoute = (attempts = 0) => {
          if (lastLocRef.current) {
            setStart([
              lastLocRef.current.coords.longitude,
              lastLocRef.current.coords.latitude,
            ]);
            setTimeout(() => {
              fetchRoute();
              setBottomSheetIndex(2);
              sheetRef.current?.snapToIndex(2);
            }, 500);
          } else if (attempts < 5) {
            // Retry up to 5 times with exponential backoff
            setTimeout(
              () => tryFetchRoute(attempts + 1),
              300 * Math.pow(2, attempts),
            );
          } else {
            console.warn("Location not available for routing");
            // Still show the destination
            mapRef.current?.flyTo({
              center: [dLon, dLat],
              zoom: 15,
              duration: 1500,
            });
            setBottomSheetIndex(2);
            sheetRef.current?.snapToIndex(2);
          }
        };
        tryFetchRoute();
      } else {
        if (lastLocRef.current) {
          setStart([
            lastLocRef.current.coords.longitude,
            lastLocRef.current.coords.latitude,
          ]);
        }
        mapRef.current.flyTo({
          center: [dLon, dLat],
          zoom: 15,
          duration: 1500,
        });
        setBottomSheetIndex(2);
        sheetRef.current?.snapToIndex(2);
      }
    }
  }, [params, mapRef.current]);

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

  const setMapStyleButton = () => {
    setMapStyle("https://tiles.openfreemap.org/styles/liberty");
    //    setMapStyle("https://tiles.openfreemap.org/styles/positron");
    //    setMapStyle("https://tiles.openfreemap.org/styles/bright");
    //    setMapStyle("");
    hasCenteredTwich.current = false;
    () => getPos();
  };

  const triggerHeartAnimation = () => {
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 10, stiffness: 100 }),
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 600 }),
    );
    heartRotate.value = withTiming(Math.random() * 40 - 20, { duration: 300 });
  };

  const toggleFavorite = () => {
    if (!city) return;

    if (!isSubscribed) {
      router.push("/paywall");
      return;
    }

    const saved = isPlaceSaved(city.name);

    if (!saved) {
      triggerHeartAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (saved) {
      removePlace(city.name);
    } else {
      addPlace({
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        region: city.region,
        country: city.country,
        thumbnail: article?.thumbnail,
      });
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

  const openDirections = () => {
    if (!city || !start || !end) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchRoute();
  };

  const nextTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = (mapThemeIndex + 1) % mapThemes.length;
    setMapThemeIndex(next);
    setMapStyle(mapThemes[next]);
  };

  const headers = {
    "User-Agent": "GPS/1.0 (test@proton.me)",
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
          `https://de.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&piprop=thumbnail&pithumbsize=400&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`,
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

    if (!isSubscribed) {
      console.log("Weather restricted for non-pro users");
      return;
    }
    fetchWeather();
  }, [city?.latitude, city?.longitude, isSubscribed]);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun size={20} color="#FFD700" />;
    if (code <= 48) return <Cloud size={20} color="#94A3B8" />;
    if (code <= 99) return <CloudRain size={20} color="#3B82F6" />;
    return <Cloud size={20} color="#94A3B8" />;
  };

  async function searchCities(q: string) {
    if (!isSubscribed && searchCount >= 5) {
      console.warn("Search limit reached for free users.");
      setError("Search limit reached. Upgrade to Pro for unlimited searches.");
      setResults([]);
      setLoadingSearch(false);
      router.push("/paywall");
      return;
    }

    if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
      console.warn(
        "RapidAPI credentials are missing. City search will not work.",
      );
      setError("Suche ist derzeit nicht verfügbar (API-Konfiguration fehlt).");
      setResults([]);
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    try {
      const url = `https://${RAPIDAPI_HOST}/v1/geo/cities?namePrefix=${encodeURIComponent(
        q,
      )}&limit=8&sort=-population`;
      const resp = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
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
      incrementSearchCount();
    } catch (err) {
      console.error(t("Search_error"), err);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(city);
    Keyboard.dismiss();
    setZoom(9);

    // Add to history
    setSearchHistory((prev) => {
      const cityName = city.name ?? city.city;
      const filtered = prev.filter((q) => q !== cityName);
      return [cityName, ...filtered].slice(0, 5);
    });

    selectCity({
      name: city.name ?? city.city,
      latitude: city.latitude,
      longitude: city.longitude,
      region: city.region,
      country: city.country,
    });

    setResults([]);
    // Do not clear query immediately as it looks better if it stays for a moment
    // or until the modal is opened.

    setTimeout(() => {
      setBottomSheetIndex(2);
      sheetRef.current?.snapToIndex(2);
    }, 100);

    mapRef.current?.flyTo({
      center: [city.longitude, city.latitude],
      zoom: 9,
      speed: 0.2,
      curve: 1,
      duration: 3000,
      pitch: 0,
    });
  }

  function selectCity(city: SelectedCity) {
    if (!isSubscribed) {
      router.push("/paywall");
      return;
    }
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

  const fetchRoute = async () => {
    if (!start || !end) return;
    const url =
      `https://router.project-osrm.org/route/v1/${profile}/` +
      `${start[0]},${start[1]};${end[0]},${end[1]}` +
      `?overview=full&alternatives=true&geometries=geojson`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!json.routes?.length) return;

      const mainRoute = json.routes[0];
      setRoute(json.routes);
      setDistanceInfo({
        distance: mainRoute.distance,
        duration: mainRoute.duration,
      });

      // Persist current route
      setCurrentRoute({
        id: Math.random().toString(36).substr(2, 9),
        destinationName: city?.name || "Destination",
        destinationCoords: end as [number, number],
        geometry: mainRoute.geometry,
        distance: mainRoute.distance,
        duration: mainRoute.duration,
        timestamp: new Date().toISOString(),
      });

      fitRouteBounds();
    } catch (err) {
      console.error("Routing error:", err);
    }
  };

  useEffect(() => {
    if (start && end) {
      fetchRoute().catch(console.error);
    }
  }, [profile]);

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
                  width: 44px;
                  height: 44px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: white;
                  border-radius: 22px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  border: 3px solid #007AFF;
                }
                .pin-dot {
                  width: 12px;
                  height: 12px;
                  background: #007AFF;
                  border-radius: 6px;
                }
              </style>
              <div class="pin">
                <div class="pin-dot"></div>
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

        <View style={styles.searchWrapper}>
          <BlurView
            intensity={isDark ? 40 : 90}
            tint={isDark ? "dark" : "light"}
            style={styles.searchBlur}
          >
            <View style={styles.searchRow}>
              <View style={styles.searchIconContainer}>
                <Search
                  size={20}
                  color={isDark ? "#94a3b8" : "#475569"}
                  strokeWidth={2.5}
                />
              </View>
              <TextInput
                placeholder={t("Search")}
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                style={styles.input}
                value={query}
                onChangeText={(value) => setQuery(value)}
              />
              {!loadingSearch && query.length > 0 && (
                <TouchableOpacity
                  onPress={clearInput}
                  style={styles.clearButton}
                  activeOpacity={0.7}
                >
                  <X
                    size={16}
                    color={isDark ? "#fff" : "#1e293b"}
                    strokeWidth={3}
                  />
                </TouchableOpacity>
              )}
              {loadingSearch && (
                <ActivityIndicator
                  size="small"
                  color={accentColor}
                  style={{ marginRight: 10 }}
                />
              )}

              <TouchableOpacity onPress={openProfileScreen} activeOpacity={0.8}>
                <View style={styles.avatarWrapper}>
                  <Avatar
                    size={34}
                    name={email ?? "U"}
                    email={email ?? undefined}
                    colorize={true}
                    radius={17}
                    badgeColor={accentColor}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </BlurView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={{ overflow: "visible" }}
          >
            {filters.map((item, index) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterChip,
                  index === 0 && styles.activeFilterChip, // Just for demonstration
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    index === 0 && styles.activeFilterText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {query.length === 0 && searchHistory.length > 0 && (
          <Animated.View entering={FadeInDown} style={styles.suggestionBox}>
            <View style={styles.historyHeader}>
              <History size={16} color="#888" />
              <Text style={styles.historyHeaderText}>
                {t("Recently_searched")}
              </Text>
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

        {results.length > 0 && BottomSheetIndex === -1 && query.length > 0 && (
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

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={nextTheme}
            activeOpacity={0.8}
          >
            <Layers color={isDark ? "#fff" : "#1a1a1a"} size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={resetPitch}
            activeOpacity={0.8}
          >
            <Box color={isDark ? "#fff" : "#1a1a1a"} size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={resetToNorth}
            activeOpacity={0.8}
          >
            <Compass color={isDark ? "#fff" : "#1a1a1a"} size={22} />
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
              backgroundColor: scheme === "dark" ? "#24262eff" : "#ffffffb3",
            }}
          >
            {loading && <LoadingOverlay />}
            <View style={styles.sheetHeader}>
              {!city ? (
                <Text>Loading</Text>
              ) : (
                <View style={{ flex: 1 }}>
                  <View style={styles.articleHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.articleTitle}>{city.name}</Text>
                      <Text style={styles.articleSubtitle}>
                        {city.region ? `${city.region}, ` : ""}
                        {city.country}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      {weather && (
                        <View style={styles.weatherBadge}>
                          {getWeatherIcon(weather.code)}
                          <Text style={styles.weatherText}>
                            {weather.temp}°C
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={closeModal}
                        style={styles.actionIconButton}
                      >
                        <X
                          strokeWidth={2.5}
                          size={24}
                          color={isDark ? "#fff" : "#1a1a1a"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      onPress={openDirections}
                      style={styles.routeButton}
                      activeOpacity={0.8}
                    >
                      <Navigation color="#fff" size={20} strokeWidth={2.5} />
                      <Text style={styles.routeButtonText}>Route</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={toggleFavorite}
                      style={styles.iconButton}
                      activeOpacity={0.7}
                    >
                      <Animated.View
                        style={[{ position: "absolute" }, animatedHeartStyle]}
                      >
                        <Heart color="#FF3B30" fill="#FF3B30" size={32} />
                      </Animated.View>
                      <Heart
                        color={
                          isPlaceSaved(city.name)
                            ? "#FF3B30"
                            : isDark
                              ? "#9CA3AF"
                              : "#6B7280"
                        }
                        fill={
                          isPlaceSaved(city.name) ? "#FF3B30" : "transparent"
                        }
                        size={24}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={shareCity}
                      style={styles.iconButton}
                      activeOpacity={0.7}
                    >
                      <Share2
                        color={isDark ? "#60A5FA" : "#2563EB"}
                        size={24}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
        {avatarview && (
          <View
            style={{
              width: "100%",
              height: "100%",
              paddingHorizontal: 30,
              marginTop: 100,
              paddingBottom: 90,
              borderRadius: 8,
            }}
          >
            <ProfileScreen />
          </View>
        )}
      </MapProvider>
    </GestureHandlerRootView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) => {
  const isDark = scheme === "dark";
  const glassBackground = isDark
    ? "rgba(36, 38, 46, 0.7)"
    : "rgba(255, 255, 255, 0.7)";
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const subTextColor = isDark ? "#d8d8d8" : "#666666";
  const accentColor = "#2563EB";

  return StyleSheet.create({
    // DESIGN SYSTEM TOKENS
    glass: {
      backgroundColor: glassBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      overflow: "hidden",
    },

    weatherBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#F1F5F9",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    weatherText: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#fff" : "#475569",
    },
    articleHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 10,
      marginBottom: 20,
    },
    sheetHeader: {
      paddingBottom: 4,
    },
    articleTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: textColor,
    },
    articleSubtitle: {
      fontSize: 14,
      color: subTextColor,
      fontWeight: "600",
      marginTop: 2,
    },
    readMoreButton: {
      marginTop: 20,
      padding: 16,
      backgroundColor: isDark ? "rgba(37, 99, 235, 0.2)" : "#f0f7ff",
      borderRadius: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(37, 99, 235, 0.3)" : "rgba(37, 99, 235, 0.1)",
    },
    readMoreText: {
      color: accentColor,
      fontWeight: "700",
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
      bottom: 40,
      right: 16,
      gap: 12,
    },
    actionIconButton: {
      padding: 8,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 20,
    },
    routeButton: {
      backgroundColor: accentColor,
      flex: 1,
      height: 52,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    routeButtonText: {
      fontWeight: "700",
      fontSize: 16,
      color: "#fff",
    },
    iconButton: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#F3F4FB",
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    historyHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#eee",
    },
    historyHeaderText: {
      fontSize: 12,
      fontWeight: "700",
      color: subTextColor,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    controlButton: {
      backgroundColor: isDark
        ? "rgba(36, 38, 46, 0.9)"
        : "rgba(255, 255, 255, 0.9)",
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    },
    controlIcon: {
      color: isDark ? "#fff" : "#1a1a1a",
    },
    extractText: {
      fontSize: 16,
      lineHeight: 25,
      color: isDark ? "#e5e7eb" : "#374151",
      textAlign: "left",
    },
    imageSection: {
      marginTop: 20,
      marginBottom: 30,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: textColor,
    },
    imageList: {
      paddingRight: 20,
    },
    imageWrapper: {
      width: width * 0.75,
      height: 220,
      marginRight: 16,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: isDark ? "#1f2937" : "#eee",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    avatarView: {
      marginLeft: 8,
    },
    searchWrapper: {
      position: "absolute",
      top: Platform.OS === "ios" ? 60 : 50,
      left: 16,
      right: 16,
      zIndex: 100,
      borderRadius: 22,
    },
    searchContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "transparent",
      borderRadius: 22,
    },
    searchBlur: {
      borderRadius: 22,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(255, 255, 255, 0.8)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },
    searchIconContainer: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    clearButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.05)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    avatarWrapper: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4,
    },
    searchRow: {
      borderRadius: 22,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      height: 52,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: textColor,
      marginLeft: 10,
      fontWeight: "500",
    },
    suggestionBox: {
      position: "absolute",
      top: 120,
      left: 16,
      right: 16,
      maxHeight: 400,
      backgroundColor: isDark
        ? "rgba(15, 23, 42, 0.95)"
        : "rgba(255, 255, 255, 0.98)",
      borderRadius: 22,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 15,
      zIndex: 1000,
    },
    suggestionItem: {
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#eee",
    },
    filterRow: {
      marginTop: 12,
      paddingBottom: 4,
    },
    filterChip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      backgroundColor: isDark
        ? "rgba(15, 23, 42, 0.6)"
        : "rgba(255, 255, 255, 0.9)",
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    activeFilterChip: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
    filterText: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#94a3b8" : "#64748b",
    },
    activeFilterText: {
      color: "#fff",
    },
    suggTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
    },
    suggSub: {
      fontSize: 13,
      color: subTextColor,
      marginTop: 2,
    },
    modalBackground: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: "center",
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
      width: "100%",
      height: height,
    },
    fullscreenImage: {
      width: width,
      height: height,
    },
    closeButton: {
      position: "absolute",
      top: 60,
      right: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    heroImageContainer: {
      width: "100%",
      height: 280,
      backgroundColor: isDark ? "#111827" : "#f3f4f6",
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
  });
};
