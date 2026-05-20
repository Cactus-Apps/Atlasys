import {
  MapProvider,
  Map,
  Marker,
  MapRef,
  MarkerRef,
  GeoJSONSource,
  VectorTileSource,
} from "react-native-maplibre-gl-js";
import { useLocalSearchParams } from "expo-router";
import * as Sentry from "@sentry/react-native";
import Svg, {
  Circle,
  Polygon,
  G,
  Line,
  Text as SvgText,
  Defs,
  RadialGradient,
  Stop,
} from "react-native-svg";
import * as Location from "expo-location";
import {
  Cloud,
  CloudRain,
  ImageIcon,
  Search,
  Sun,
  History,
  X,
  Heart,
  Share2,
  Route,
  AlertCircleIcon,
  AlertTriangle,
  CloudRainIcon,
  Snowflake,
  CloudLightningIcon,
  CloudSunIcon,
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
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { getOsmIdFromNominatim } from "@/lib/geocoding/overpass";
import { Avatar } from "@kolking/react-native-avatar";
import { supabase } from "@/lib/auth/supabase";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LoadingOverlay } from "@/components/overlays/LoadingOverlay";
import MapStyleSheet, {
  MapTheme,
} from "@/components/sheets_modal/MapStyleSheet";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FlatList as GHFlatList } from "react-native-gesture-handler";
import RouteSheet from "@/components/sheets_modal/RouteSheet";
import DownloadSheet from "@/components/sheets_modal/DownloadSheet";
import { useAuthStore } from "@/lib/storage/zustand";
import LottieView from "lottie-react-native";
import ErrorSheet from "@/components/sheets_modal/ErrorSheet";
import DrawBoundsOverlay from "@/components/overlays/DrawBoundsOverlay";
import NavigationSideBar from "@/components/overlays/NavigationSideBar";
import PoiSheet from "@/components/sheets_modal/PoiSheet";
import { posthog } from "@/lib/config/posthog";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

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

type WikiArticleImage = {
  /** Smaller preview URL for the horizontal gallery. */
  previewUrl: string;
  /** Larger thumbnail URL for full-screen view. */
  fullUrl: string;
};

interface ArticleData {
  title: string;
  thumbnail: string | null;
  extract: string;
  images: WikiArticleImage[];
}

type RoutePoint = {
  label: string;
  coordinate: [number, number];
};

const SNAP_POINTS = ["15%", "25%", "50%", "80%", "100%"];

const FILTER_DEFS = [
  { id: "restaurants", labelKey: "Restaurants", subclass: ["restaurant"] },
  { id: "cafes", labelKey: "Cafés", subclass: ["cafe"] },
  { id: "hotels", labelKey: "Hotels", subclass: ["hotel", "hostel"] },
  {
    id: "attractions",
    labelKey: "Attractions",
    subclass: ["attraction", "museum", "monument", "artwork"],
  },
  { id: "bars", labelKey: "Bars", subclass: ["bar", "pub"] },
  {
    id: "shopping",
    labelKey: "Shopping",
    subclass: ["mall", "supermarket", "shop"],
  },
] as const;

export default function MapScreen() {
  const markerRef = useRef<MarkerRef | null>(null);
  const mapCenterRef = useRef<[number, number] | null>(null);
  const [pitch, setPitch] = useState(false);
  const lastLocRef = useRef<Location.LocationObject | null>(null);
  const [zoom, setZoom] = useState(12);
  const [route, setRoute] = useState<any>(null);
  const hasCenteredOnce = useRef(false);
  const initialCenter = useMemo<[number, number]>(() => {
    const pos = useAuthStore.getState().mapPosition;
    return pos ? [pos.longitude, pos.latitude] : [0, 0];
  }, []);
  const [profile, setProfile] = useState<"driving" | "cycling" | "walking">(
    "driving",
  );
  const [images, setImages] = useState<string[]>([]);
  const [DistanceInfo, setDistanceInfo] = useState<{
    distance: number;
    duration: number;
  } | null>();
  const [CityInfo, setCityInfo] = useState("");
  const [MapStyle, setMapStyle] = useState(
    "https://tiles.openfreemap.org/styles/bright",
  );
  const [ready, setReady] = useState(true);
  const [sub, setSub] = useState<Location.LocationSubscription | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selected, setSelected] = useState<CityResult | null>(null);
  const [start, setStart] = useState<[number, number] | null>();
  const [end, setEnd] = useState<[number, number] | null>();
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [savedLocations, setSavedLocations] = useState<SelectedCity[]>([]);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState<string | null>();
  const isPlaceSaved = useAuthStore((s) => s.isPlaceSaved);
  const removePlace = useAuthStore((s) => s.removePlace);
  const addPlace = useAuthStore((s) => s.addPlace);
  const searchHistory = useAuthStore((s) => s.searchHistory);
  const addToSearchHistory = useAuthStore((s) => s.addToSearchHistory);
  const removeFromSearchHistory = useAuthStore(
    (s) => s.removeFromSearchHistory,
  );
  const clearSearchHistory = useAuthStore((s) => s.clearSearchHistory);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(false);
  const ref = useRef<LottieView>(null);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(
    null,
  );
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
  const [isSearching, setIsSearching] = useState(false);
  const theme = useAppTheme();
  const styles = useMemo(
    () => getStyles(theme),
    [theme.isDark, theme.isModern],
  );
  const { t, i18n } = useTranslation();
  const filters = useMemo(
    () =>
      FILTER_DEFS.map((f) => ({
        id: f.id,
        label: t(f.labelKey),
        subclass: [...f.subclass],
      })),
    [t],
  );
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
  const setMapPosition = useAuthStore((s) => s.setMapPosition);
  const initialZoom = useRef(5);
  const [mapStyleSheetOpen, setMapStyleSheetOpen] = useState(false);
  const [currentThemeKey, setCurrentThemeKey] = useState("bright");
  const [errorSheetOpen, setErrorSheetOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const lastBearingRef = useRef(0);
  const isSaved = useMemo(
    () => savedLocations.some((l) => l.name === city?.name),
    [savedLocations, city?.name],
  );
  const [localSaved, setLocalSaved] = useState(isSaved);
  const didHandleParams = useRef(false);

  const [drawBounds, setDrawBounds] = useState<{
    nw: [number, number];
    ne: [number, number];
    se: [number, number];
    sw: [number, number];
  } | null>(null);
  const [downloadSheetOpen, setDownloadSheetOpen] = useState(false);
  const drawModeRef = useRef(false);
  const [bearing, setBearing] = useState(0);

  const searchBarVisible = !drawMode && !routePickMode;

  const { destLat, destLon, destName } = useLocalSearchParams<{
    destLat: string;
    destLon: string;
    destName: string;
  }>();

  const handleSetFilter = (filterId: string | null) => {
    activeFilterRef.current = filterId;
    setActiveFilter(filterId);
  };

  const StatusBarStyle: "dark" | "light" =
    currentThemeKey === "dark" ? "light" : "dark";

  // Location/GPS Stuff
  // IP-based location as a fallback when GPS is not ready
  const getIPLocation = async (): Promise<[number, number] | null> => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return [data.longitude, data.latitude];
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    let liveSub: Location.LocationSubscription | null = null;

    (async () => {
      // Step 1: request GPS permission
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        if (!canAskAgain) {
          setError(t("Location_denied_permanent"));
        } else {
          setErrorSheetOpen(true);
          setError(t("Location_authorization_denied"));
        }
        setLocationReady(true);
        return;
      }

      // Step 2: one quick position fix
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && !cancelled && !hasCenteredOnce.current) {
          const { latitude, longitude } = lastKnown.coords;
          setMarkerPos([longitude, latitude]);
          setLocationReady(true);
          if (mapRef.current) {
            hasCenteredOnce.current = true;
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              speed: 0.8,
              duration: 600,
            });
            ensureGlobe();
          }
        }
      } catch {}

      // Step 3: live GPS watcher
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

      liveSub = s;
      if (!cancelled) setSub(s);
    })().catch((error: unknown) =>
      Sentry.captureException(
        error instanceof Error
          ? error
          : new Error("Failed to initialize location watcher"),
      ),
    );

    return () => {
      cancelled = true;
      liveSub?.remove();
      setSub(null);
    };
  }, []);

  // User Auth Stuff
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setEmail(user?.email);
    };
    fetchUserEmail();
  }, []);

  // Helper functions
  const clearInput = () => {
    setQuery("");
    setResults([]);
    sheetRef.current?.close();
  };

  const openURL = async () => {
    if (!city?.name) return;
    const title = city.name.replace(/ /g, "_");
    const wikiLang = (i18n.language || "en").split("-")[0];
    const url = `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(t("Wikipedia_could_not_open"));
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
    posthog.capture("compass_reset_to_north");
  };

  const resetPitch = () => {
    const nextPitch = !pitch;
    mapRef.current?.easeTo({ pitch: nextPitch ? 60 : 0, duration: 500 });
    setPitch(nextPitch);
    posthog.capture("pitch_reset");
  };

  const ensureGlobe = async () => {
    if (!mapRef.current) return;
    await mapRef.current.setProjection({ type: "globe" });
  };

  useEffect(() => {
    setLocalSaved(isPlaceSaved(city?.name ?? ""));
  }, [city?.name]);

  const toggleFavorite = () => {
    if (!city) return;
    const saved = localSaved;
    if (saved) setLocalSaved(true);

    if (!saved) {
      setLocalSaved(true);
      setIsPlayingAnimation(true);
      ref.current?.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addPlace({
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        region: city.region,
        country: city.country,
        thumbnail: article?.thumbnail,
      });
    } else {
      setLocalSaved(false);
      removePlace(city.name);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const shareCity = async () => {
    if (!city) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const url = `https://de.wikipedia.org/wiki/${encodeURIComponent(city.name.replace(/ /g, "_"))}`;
      await Share.share({
        message: `Loook at thaaat 🤩: ${city.name}\n${url}`,
        url: url,
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  useEffect(() => {
    if (!destLat || !destLon || !destName) return;
    if (didHandleParams.current) return;

    const lat = parseFloat(destLat);
    const lon = parseFloat(destLon);

    const tryNavigate = () => {
      if (!mapRef.current) {
        setTimeout(tryNavigate, 200);
        return;
      }

      didHandleParams.current = true;

      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 12,
        duration: 1500,
      });

      setTimeout(() => {
        selectCity({
          name: destName,
          latitude: lat,
          longitude: lon,
        });
      }, 1600);
    };

    setTimeout(tryNavigate, 500);
  }, [destLat, destLon, destName]);

  useEffect(() => {
    return () => {
      didHandleParams.current = false;
    };
  }, []);

  const headers = {
    "User-Agent": `Atlasys/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL!})`,
    Accept: "application/json",
  };

  // Wikipedia logic
  useEffect(() => {
    if (!city?.name) return;

    const controller = new AbortController();

    const fetchWikipediaData = async () => {
      setLoading(true);
      setError(null);
      setArticle(null);

      try {
        // 1. Search
        const wikiLang = (i18n.language || "en").split("-")[0];
        const searchRes = await fetch(
          `https://${wikiLang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(city.name)}&limit=1&format=json&origin=*`,
          { headers, signal: controller.signal },
        );
        const searchData = await searchRes.json();
        if (!searchData[1]?.length) {
          setError(t("Article_not_found"));
          setLoading(false);
          return;
        }
        const pageTitle = searchData[1][0];

        const win = Dimensions.get("window");
        const dpr = Math.min(PixelRatio.get(), 3);
        const galleryThumbPx = Math.min(
          840,
          Math.max(440, Math.ceil(win.width * 0.7 * dpr)),
        );
        const fullscreenThumbPx = Math.min(
          1680,
          Math.max(
            galleryThumbPx,
            Math.ceil(Math.max(win.width, win.height) * dpr),
          ),
        );
        const heroPageImagePx = Math.min(
          880,
          Math.max(520, Math.ceil(Math.max(win.width, 280) * dpr)),
        );

        // 2. Extract + Thumbnail
        const extractRes = await fetch(
          `https://${wikiLang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageprops&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`,
          { headers, signal: controller.signal },
        );

        const extractData = await extractRes.json();
        const pages = extractData.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId].extract;

        // 3. Images – try Commons category first
        let imageTitles: string[] = [];
        try {
          const qid = pages[pageId]?.pageprops?.wikibase_item;
          if (qid) {
            const wdRes = await fetch(
              `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
              { signal: controller.signal },
            );
            const wdData = await wdRes.json();
            const cat = wdData.entities?.[qid]?.sitelinks?.commonswiki?.title;
            if (cat) {
              const cmRes = await fetch(
                `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(cat)}&cmtype=file&cmlimit=50&format=json&origin=*`,
                { headers, signal: controller.signal },
              );
              const cmData = await cmRes.json();
              imageTitles =
                cmData.query?.categorymembers?.map((cm: any) => cm.title) || [];
            }
          }
        } catch {}

        if (!imageTitles.length) {
          const imagesPropRes = await fetch(
            `https://${wikiLang}.wikipedia.org/w/api.php?action=query&prop=images&titles=${encodeURIComponent(pageTitle)}&imlimit=50&format=json&origin=*`,
            { headers, signal: controller.signal },
          );
          const imagesPropData = await imagesPropRes.json();
          imageTitles =
            imagesPropData.query?.pages[pageId]?.images?.map(
              (img: any) => img.title,
            ) || [];
        }

        const isJunk = (url: string) => {
          const lower = url.toLowerCase();
          return [
            // only focused on german words
            //f eel free to expand this
            "locator_map",
            "location_map",
            "relief_map",
            "topographic_map",
            "orthophoto",
            "planisphere",
            "_map.",
            "karte.",
            "carte_",
            "kaart_",
            "карта",

            "flag_of",
            "flagge_",
            "drapeau_",
            "bandera_",
            "bandeira_",
            "ensign",
            "pennant",

            "coat_of_arms",
            "coats_of",
            "wappen_",
            "coa_",
            "heraldry",
            "blazon",
            "escudo_de",
            "armoiries_de",

            "klimadiagramm",
            "climograph",
            "climatograph",
            "koppen",
            "thornthwaite",
            "climate_chart",
            "climate_graph",

            "icon",
            "logo",
            "favicon",
            "commons-logo",
            "wikimedia_logo",
            "wikipedia_logo",

            ".svg",

            "buergermeister",
            "mayor_of",
            "portrait_of_the",
            "governor_of",
            "senator_of",

            "spd_logo",
            "cdu_logo",
            "csu_logo",
            "afd_logo",
            "partei_logo",

            "stadium_",
            "arena_",

            "kupferstich",
            "engraving_of",
            "lithograph_of",
            "woodcut_of",

            "blank_",
            "placeholder",
            "no_image",
            "noimage",
            "missing_image",
            "transparent",
          ].some((word) => lower.includes(word));
        };

        let imageUrls: WikiArticleImage[] = [];
        if (imageTitles.length > 0) {
          const titlesQuery = imageTitles
            .map((t: string) => encodeURIComponent(t))
            .join("|");
          const imageInfoUrl = (w: number) =>
            `https://${wikiLang}.wikipedia.org/w/api.php?action=query&titles=${titlesQuery}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=${w}&format=json&origin=*`;

          const [imagesInfoPreviewRes, imagesInfoFullRes] = await Promise.all([
            fetch(imageInfoUrl(galleryThumbPx), {
              headers,
              signal: controller.signal,
            }),
            fetch(imageInfoUrl(fullscreenThumbPx), {
              headers,
              signal: controller.signal,
            }),
          ]);
          const [imagesInfoPreviewData, imagesInfoFullData] = await Promise.all(
            [imagesInfoPreviewRes.json(), imagesInfoFullRes.json()],
          );

          const mapInfos = (data: any) => {
            const m: Record<string, { url?: string; thumburl?: string }> = {};
            if (!data.query?.pages) return m;
            Object.values(data.query.pages).forEach((p: any) => {
              const info = p.imageinfo?.[0];
              if (info?.url)
                m[p.title] = { url: info.url, thumburl: info.thumburl };
            });
            return m;
          };

          const previewMap = mapInfos(imagesInfoPreviewData);
          const fullMap = mapInfos(imagesInfoFullData);

          imageTitles.forEach((title: string) => {
            const p = previewMap[title];
            const f = fullMap[title];
            const canonicalUrl = f?.url ?? p?.url;
            if (
              !canonicalUrl ||
              isJunk(canonicalUrl) ||
              !(
                canonicalUrl.endsWith(".jpg") ||
                canonicalUrl.endsWith(".png") ||
                canonicalUrl.endsWith(".jpeg")
              )
            ) {
              return;
            }
            const previewUrl = p?.thumburl || p?.url;
            const fullUrl = f?.thumburl || f?.url || previewUrl;
            if (previewUrl && fullUrl) imageUrls.push({ previewUrl, fullUrl });
          });
        }

        const cityNameLower = pageTitle.toLowerCase().replace(/\s/g, "_");
        const preferredImage = imageUrls.find((img) =>
          img.previewUrl.toLowerCase().includes(cityNameLower),
        );
        const finalThumbnail =
          preferredImage?.previewUrl ?? imageUrls[0]?.previewUrl ?? null;

        if (controller.signal.aborted) return;

        setArticle({
          title: pageTitle,
          extract: extract || t("No_summary_available"),
          thumbnail: finalThumbnail,
          images: imageUrls,
        });
      } catch (error) {
        Sentry.captureException(error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const now = Date.now();
    if (now - lastFetchTime < 3000) return;
    setLastFetchTime(now);
    fetchWikipediaData();

    return () => controller.abort();
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
      } catch (error) {
        Sentry.captureException(error);
      }
    };

    fetchWeather();
  }, [city?.latitude, city?.longitude]);

  const getWeatherIcon = (code: number) => {
    if (code <= 2) return <Sun size={20} color="#FFD700" />;
    if (code <= 2) return <CloudSunIcon size={20} color="#948b59" />;
    if (code <= 63) return <CloudRainIcon size={20} color="#3B82F6" />;
    if (code <= 48) return <Cloud size={20} color="#94A3B8" />;
    if (code <= 77) return <Snowflake size={20} color="#3e6095" />;
    if (code <= 82) return <CloudRainIcon size={20} color="#3B82F6" />;
    if (code <= 99) return <CloudLightningIcon size={20} color="94A3B8" />;
    return <Cloud size={20} color="#94A3B8" />;
  };

  async function searchCities(q: string) {
    setLoadingSearch(true);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q,
      )}&count=8&language=${(i18n.language || "en").split("-")[0]}&format=json`;
      const resp = await fetch(url);
      if (!resp.ok) {
        setResults([]);
        setLoadingSearch(false);
        return;
      }
      const json = await resp.json();
      const arr = (json.results || []).map((it: any) => ({
        id: it.id ?? `${it.latitude}-${it.longitude}`,
        city: it.name,
        name: it.name,
        country: it.country,
        region: it.admin1,
        latitude: it.latitude,
        longitude: it.longitude,
        population: it.population,
      }));
      setResults(arr);
    } catch (error) {
      Sentry.captureException(error);
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

    addToSearchHistory(city.name ?? city.city);

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

  const handleSelectTheme = (theme: MapTheme) => {
    const pos = useAuthStore.getState().mapPosition;

    setCurrentThemeKey(theme.key);
    setMapStyle(theme.url);
    posthog.capture("map_style_changed", {
      style: currentThemeKey,
    });

    setMapStyleSheetOpen(false);

    setTimeout(() => {
      if (pos && mapRef.current) {
        mapRef.current.jumpTo({
          center: [pos.longitude, pos.latitude],
          zoom: pos.zoom,
        });
      }
    }, 800);
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
      posthog.capture("route_started", {
        profile: profile,
      });

      setDistanceInfo({
        distance: json.routes[0].distance,
        duration: json.routes[0].duration,
      });
      fitRouteBounds();
    };

    fetchRoute().catch((error: unknown) =>
      Sentry.captureException(
        error instanceof Error ? error : new Error("Failed to fetch route"),
      ),
    );
  }, [start, end]);

  const onMapClick = async (event: any) => {
    Keyboard.dismiss();
    const { lng, lat } = event.lngLat;
    if (drawModeRef.current) return;
    if (!mapRef.current) return;
    if (routePickModeRef.current) return;

    const allFeatures = await mapRef.current.queryRenderedFeatures(undefined);

    // ← NUR poi_ Features
    const poiFeatures = allFeatures.filter((f: any) =>
      f.layer?.id?.startsWith("poi_"),
    );
    if (!poiFeatures.length) return;

    // Apply filter to poiFeatures, not allFeatures
    const activeSubclasses = activeFilterRef.current
      ? (filters.find((f) => f.id === activeFilterRef.current)?.subclass ?? [])
      : null;

    const filtered = activeSubclasses
      ? poiFeatures.filter((f: any) =>
          activeSubclasses.includes(f.properties?.subclass ?? ""),
        )
      : poiFeatures;

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

    const [lon, lat2] = (closest.geometry as any).coordinates;
    let osm_id = Number(closest.properties?.osm_id) || 0;
    if (osm_id === 0) {
      const nominatimResult = await getOsmIdFromNominatim(
        closest.properties?.name ?? "",
        lat2,
        lon,
      );
      if (nominatimResult) osm_id = nominatimResult.osm_id;
    }

    const data = {
      name: closest.properties?.name ?? t("Unknown_poi"),
      type: closest.properties?.class ?? "",
      subclass: closest.properties?.subclass ?? "",
      osm_id,
      lat: lat2,
      lon,
    };

    posthog.capture("poi_tapped", {
      type: data.subclass || data.type,
    });

    setSelectedPoi(data);
    sheetPoiRef.current?.snapToIndex(0);
  };

  const updateBearing = async () => {
    try {
      const b = await mapRef.current?.getBearing?.();
      if (b == null || typeof b !== "number") return;
      if (Math.abs(b - lastBearingRef.current) < 0.5) return;
      lastBearingRef.current = b;
      setBearing(b);
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const onBlur = () => {
    Keyboard.dismiss();
    setIsSearching(false);
  };

  useEffect(() => {
    let timer: any;

    if (locationReady) {
      setShowError(false);
      timer = setTimeout(() => {
        setShowError(true);
      }, 5000);
    }

    return () => clearTimeout(timer);
  }, [locationReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {error && (
        <TouchableOpacity
          onPress={() => setErrorSheetOpen(true)}
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 110 : 150,
            alignSelf: "center",
            backgroundColor: theme.cardBg,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            zIndex: 100,
            shadowColor: theme.black,
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
          }}
          activeOpacity={0.8}
        >
          <AlertCircleIcon color={theme.danger} />
          <Text
            style={{ color: theme.textColor, fontSize: 13, fontWeight: "500" }}
          >
            {error}
          </Text>
        </TouchableOpacity>
      )}
      {!locationReady && (
        <TouchableOpacity
          onPress={() => setErrorSheetOpen(true)}
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 110 : 150,
            alignSelf: "center",
            backgroundColor: theme.cardBg,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            zIndex: 100,
            shadowColor: theme.black,
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
          }}
          activeOpacity={0.8}
        >
          {!showError && (
            <ActivityIndicator size="small" color={theme.tabIndicator} />
          )}
          {showError && <AlertTriangle color={theme.danger} />}
          <Text
            style={{ color: theme.textColor, fontSize: 13, fontWeight: "500" }}
          >
            {showError
              ? t("Location_could_not_resolve")
              : t("Location_resolving")}
          </Text>
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={
            theme.isDark
              ? ["#0b0b19", "#1a1a3e", "#0d1b4b"]
              : ["#87ceeb", "#b8d4f0", "#dceefa"]
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <MapProvider>
          {routePickMode && (
            <>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: theme.isDark ? "#1a1a2e" : "#1a1a2e",
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
                  <X size={24} color={theme.white} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.white,
                      fontSize: 18,
                      fontWeight: "700",
                    }}
                  >
                    {routePickMode === "start"
                      ? t("Route_pick_start_title")
                      : t("Route_pick_end_title")}
                  </Text>
                  <Text
                    style={{
                      color: theme.subTextColor,
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {t("Route_pick_map_hint")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    const center = await mapRef.current?.getCenter();
                    if (!center) return;
                    const [lng, lat] = [center.lng, center.lat];

                    let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    try {
                      const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                        {
                          headers: {
                            "Accept-Language": i18n.language || "en",
                            "User-Agent": `Atlasys/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL!})`,
                          },
                        },
                      );
                      const text = await res.text();
                      const data = JSON.parse(text);
                      label =
                        data.display_name?.split(",").slice(0, 2).join(", ") ??
                        label;
                    } catch (error) {
                      Sentry.captureException(error);
                    }

                    const point: RoutePoint = { label, coordinate: [lng, lat] };
                    if (routePickMode === "start") setRouteStart(point);
                    else setRouteEnd(point);
                    setPickMode(null);
                  }}
                  style={{
                    backgroundColor: theme.primary,
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: theme.white,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    Ok
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginLeft: -20,
                  marginTop: -56,
                  zIndex: 199,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    shadowColor: theme.black,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 10,
                  }}
                >
                  <Svg width={40} height={40} viewBox="0 0 40 40">
                    <Defs>
                      <RadialGradient
                        id={
                          routePickMode === "start"
                            ? "pickGradStart"
                            : "pickGradEnd"
                        }
                        cx="50%"
                        cy="35%"
                        r="60%"
                      >
                        <Stop
                          offset="0%"
                          stopColor={
                            routePickMode === "start"
                              ? theme.success
                              : theme.danger
                          }
                        />
                        <Stop
                          offset="100%"
                          stopColor={
                            routePickMode === "start"
                              ? theme.successDark
                              : theme.dangerDark
                          }
                        />
                      </RadialGradient>
                    </Defs>
                    <Circle
                      cx="20"
                      cy="20"
                      r="20"
                      fill={`url(#${routePickMode === "start" ? "pickGradStart" : "pickGradEnd"})`}
                    />
                    <Circle cx="20" cy="20" r="5" fill="white" opacity="0.9" />
                  </Svg>
                </View>
                <View
                  style={{
                    width: 3,
                    height: 14,
                    backgroundColor:
                      routePickMode === "start"
                        ? theme.successDark
                        : theme.dangerDark,
                    borderBottomLeftRadius: 2,
                    borderBottomRightRadius: 2,
                  }}
                />
                <View
                  style={{
                    width: 12,
                    height: 5,
                    backgroundColor: "rgba(0,0,0,0.25)",
                    borderRadius: 6,
                    marginTop: 1,
                  }}
                />
              </View>
            </>
          )}
          <Map
            ref={mapRef}
            options={{
              style: MapStyle,
              center: initialCenter,
              zoom: initialZoom.current,
            }}
            listeners={{
              click: {
                objectListener: onMapClick,
              },
              mount: {
                rnListener: () => {
                  ensureGlobe();
                },
              },
              rotate: { objectListener: updateBearing },
              rotateend: { objectListener: updateBearing },
              move: {
                objectListener: async (e: any) => {
                  if (e?.target?.getCenter) {
                    const c = await e.target.getCenter();
                    const z = await e.target.getZoom();
                    mapCenterRef.current = [c.lng, c.lat];
                    setMapPosition({
                      latitude: c.lat,
                      longitude: c.lng,
                      zoom: z,
                    });
                  }
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
              <div class="pin" title="Location">
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
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="
              width:40px; height:40px;
              border-radius:50%;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="startGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#4ADE80"/>
                    <stop offset="100%" stop-color="#16A34A"/>
                  </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="20" fill="url(#startGrad)"/>
              </svg>
            </div>
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
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="
              width:40px; height:40px;
              border-radius:50%;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="endGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#F87171"/>
                    <stop offset="100%" stop-color="#B91C1C"/>
                  </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="20" fill="url(#endGrad)"/>
              </svg>
            </div>
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
                        "line-color":
                          i === 0 ? theme.primaryDark : theme.subTextColor,
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
              tiles: [
                "https://tiles.openfreemap.org/planet/v3/{z}/{x}/{y}.pbf",
              ],
            }}
            layers={[
              {
                layer: {
                  id: "cities-layer",
                  type: "symbol",
                  "source-layer": "place",
                  minzoom: 5,
                  filter: [
                    "in",
                    ["get", "class"],
                    ["literal", ["city", "town"]],
                  ],
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
                      name: closest.properties?.name ?? t("Unknown_poi"),
                      latitude: lat,
                      longitude: lon,
                    });
                    posthog.capture("city_tapped");
                  },
                },
              },
            ]}
          />

          {searchBarVisible && (
            <View style={styles.searchWrapper}>
              <View style={styles.searchContainer}>
                <Search size={25} color={theme.subTextColor} />
                <TextInput
                  placeholder={t("Search")}
                  placeholderTextColor={theme.subTextColor}
                  style={styles.input}
                  value={query}
                  onChangeText={(value) => setQuery(value)}
                  onBlur={onBlur}
                  onFocus={() => setIsSearching(true)}
                />
                {!loadingSearch && query.length > 0 && (
                  <TouchableOpacity onPress={clearInput}>
                    <X size={18} color={theme.subTextColor} />
                  </TouchableOpacity>
                )}
                {loadingSearch && <ActivityIndicator size="small" />}

                <View style={styles.avatarView}>
                  <Avatar
                    size={34}
                    name={email ?? undefined}
                    email={email ?? undefined}
                    colorize={true}
                    radius={100}
                    badgeColor="#146275ff"
                    defaultSource={require("@/assets/images/icons/adaptive-icon.png")}
                  />
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {filters.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.filterChip,
                      activeFilter === item.id && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      handleSetFilter(activeFilter === item.id ? null : item.id)
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,
                        activeFilter === item.id && styles.filterTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {query.length === 0 &&
                searchHistory.length > 0 &&
                !city &&
                isSearching && (
                  <Animated.View
                    entering={FadeInDown}
                    style={styles.suggestionBox}
                  >
                    <View style={styles.historyHeader}>
                      <History size={16} color={theme.subTextColor} />
                      <Text style={styles.historyHeaderText}>
                        {t("Recently_searched")}
                      </Text>
                      <TouchableOpacity onPress={() => clearSearchHistory()}>
                        <X size={16} color={theme.subTextColor} />
                      </TouchableOpacity>
                    </View>
                    {searchHistory.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem2}
                        onPress={() => setQuery(item)}
                      >
                        <Text style={styles.suggTitle}>{item}</Text>
                        <TouchableOpacity
                          onPress={() => removeFromSearchHistory(item)}
                          style={{
                            marginLeft: "auto",
                            padding: 4,
                            borderRadius: 4,
                            backgroundColor: "rgba(0,0,0,0.1)",
                          }}
                        >
                          <X size={16} color={theme.subTextColor} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </Animated.View>
                )}

              {results.length > 0 && query.length > 0 && !city && (
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

          {!isSearching && (
            <>
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
                  <Circle
                    cx="24"
                    cy="24"
                    r="23"
                    fill="#1C1C1E"
                    opacity="0.92"
                  />

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
                    <Polygon
                      points="24,8 26.5,22 24,20 21.5,22"
                      fill="#EF4444"
                    />
                    <Polygon
                      points="24,40 26.5,26 24,28 21.5,26"
                      fill="#8E8E93"
                    />

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
            </>
          )}
          <NavigationSideBar
            markerPos={markerPos}
            resetPitch={resetPitch}
            setRoute={setRoute}
            setDistanceInfo={setDistanceInfo}
            setRouteEnd={setRouteEnd}
            setRouteStart={setRouteStart}
            setRouteSheetOpen={setRouteSheetOpen}
            setMapStyleSheetOpen={setMapStyleSheetOpen}
            setDrawMode={setDrawMode}
          />

          <PoiSheet
            sheetRef={sheetPoiRef}
            selectedPoi={selectedPoi}
            snapPoints={SNAP_POINTS}
            markerPos={markerPos}
            onClose={() => {
              setSelectedPoi(null);
              setBottomSheetIndex2(-1);
            }}
            onRouteStart={(start, end) => {
              setRoute(null);
              setDistanceInfo(null);
              setRouteStart(start);
              setRouteEnd(end);
              setRouteSheetOpen(true);
            }}
          />

          {city && (
            <BottomSheet
              ref={sheetRef}
              index={BottomSheetIndex}
              snapPoints={SNAP_POINTS}
              enablePanDownToClose={true}
              backgroundStyle={{
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                backgroundColor: theme.bg,
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
                            color: theme.textColor,
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
                          <X strokeWidth={3} color={theme.textColor} />
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
                                    label: t("Poi_my_location"),
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
                            backgroundColor: theme.primary,
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
                          <Route color={theme.white} size={24} />
                          <Text
                            style={{
                              fontWeight: "500",
                              fontSize: 18,
                              color: theme.white,
                              paddingHorizontal: 10,
                            }}
                          >
                            Route starten
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={toggleFavorite}
                          style={{
                            backgroundColor: theme.cardBgSecondary,
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            flexDirection: "row",
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            alignItems: "center",
                          }}
                        >
                          <LottieView
                            source={require("@/assets/animations/heart-animation.json")}
                            style={{
                              width: 50,
                              height: 50,
                              position: "absolute",
                              opacity: isPlayingAnimation ? 1 : 0,
                            }}
                            loop={false}
                            ref={ref}
                            autoPlay={false}
                            onAnimationFinish={() =>
                              setIsPlayingAnimation(false)
                            }
                          />
                          {!isPlayingAnimation && (
                            <Heart
                              color={
                                localSaved ? theme.danger : theme.subTextColor
                              }
                              fill={localSaved ? theme.danger : "transparent"}
                              size={24}
                            />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={shareCity}
                          style={{
                            backgroundColor: theme.cardBgSecondary,
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            padding: 10,
                            alignSelf: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Share2 color={theme.primary} size={24} />
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
                          <ImageIcon color={theme.primary} size={20} />
                          <Text style={styles.sectionTitle}>
                            Bilder ({article.images.length})
                          </Text>
                        </View>
                        <GHFlatList
                          horizontal
                          data={article.images}
                          showsHorizontalScrollIndicator={false}
                          nestedScrollEnabled
                          keyExtractor={(
                            item: WikiArticleImage,
                            index: number,
                          ) => `${item.previewUrl}-${index}`}
                          renderItem={({ item, index }: any) => (
                            <TouchableOpacity
                              style={styles.imageWrapper}
                              onPress={() => setSelectedImageIndex(index)}
                              activeOpacity={0.8}
                            >
                              <Image
                                source={{ uri: item.previewUrl }}
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
                      <Text style={styles.readMoreText}>Wikipedia</Text>
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
                  keyExtractor={(item: WikiArticleImage) =>
                    `full-${item.fullUrl}`
                  }
                  renderItem={({ item }) => (
                    <View style={styles.fullscreenImageWrapper}>
                      <Image
                        source={{ uri: item.fullUrl }}
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
                  <X color={theme.white} size={28} />
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
              posthog.capture("route_start_end_swapped");
            }}
            onSetStart={(point) => setRouteStart(point)}
            onSetEnd={(point) => setRouteEnd(point)}
            onRouteReady={(routes) => {
              setRoute(routes);
              setDistanceInfo({
                distance: routes[0].distance,
                duration: routes[0].duration,
              });

              // Fit map to route bounds
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
            }}
          />
          <ErrorSheet
            open={errorSheetOpen}
            onClose={() => setErrorSheetOpen(false)}
            errorTitle={error ? t("Error_generic") : t("Error_location")}
            error={error ?? t("Location_load_failed_message")}
            errorCode={error ? "MAPSCREEN_ERROR" : "LOCATION_NOT_READY"}
            stillAvailable={[
              t("Still_available_offline_maps"),
              t("Still_available_saved_places"),
              t("Still_available_routes"),
            ]}
            githubRepo="cactus-apps/atlasys"
          />
        </MapProvider>
      </View>
      <MapStyleSheet
        open={mapStyleSheetOpen}
        currentTheme={currentThemeKey}
        onSelect={handleSelectTheme}
        onClose={() => setMapStyleSheetOpen(false)}
      />
      <StatusBar style={StatusBarStyle} />
    </GestureHandlerRootView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    cardBg,
    cardBgSecondary,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    primary,
    inputBg,
    overlay,
    overlayDark,
    white,
    tabIndicator,
    black,
  } = theme;

  return StyleSheet.create({
    weatherBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: cardBgSecondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    weatherText: {
      fontSize: 14,
      fontWeight: "bold",
      color: subTextColor,
    },
    articleHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
      gap: 10,
      marginLeft: 10,
    },
    searchContainer: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingBottom: 8,
      justifyContent: "center",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: inputBg,
      elevation: 3,
      shadowColor: black,
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
      backgroundColor: cardBgSecondary,
      borderRadius: 20,
      borderColor: subTextColor,
      borderWidth: 2,
    },
    filterChipActive: {
      backgroundColor: tabIndicator,
    },
    filterText: {
      fontSize: 13,
      color: textColor,
    },
    filterTextActive: {
      color: white,
      fontWeight: "600",
    },
    readMoreButton: {
      marginTop: 20,
      padding: 15,
      backgroundColor: "transparent",
      borderRadius: 12,
      borderColor: primary,
      borderWidth: 2,
      alignItems: "center",
    },
    readMoreText: {
      color: primary,
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
      borderBottomColor: borderColor,
    },
    historyHeaderText: {
      fontSize: 12,
      fontWeight: "600",
      color: subTextColor,
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
      shadowColor: black,
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    extractText: {
      fontSize: 16,
      lineHeight: 24,
      color: textColor,
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
      color: textColor,
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
      backgroundColor: cardBgSecondary,
      shadowColor: black,
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
      backgroundColor: cardBg,
      borderRadius: isModern ? 16 : 8,
      zIndex: 50,
      elevation: 8,
      shadowColor: black,
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    suggestionItem2: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      alignItems: "center",
      flexDirection: "row",
    },
    input: {
      flex: 1,
      height: 44,
      paddingHorizontal: 12,
      marginRight: 13,
      marginHorizontal: 10,
      fontSize: 16,
      color: textColor,
    },
    suggTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: textColor,
    },
    suggSub: {
      fontSize: 12,
      color: subTextColor,
      marginTop: 2,
    },
    modalBackground: {
      flex: 1,
      backgroundColor: overlayDark,
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
      backgroundColor: overlay,
      padding: 10,
      borderRadius: 25,
    },
    heroImageContainer: {
      width: "100%",
      height: 250,
      backgroundColor: cardBgSecondary,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
  });
};
