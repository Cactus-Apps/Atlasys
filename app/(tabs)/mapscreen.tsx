import type { StyleSpecification } from "maplibre-gl";
import {
  MapProvider,
  Map,
  Marker,
  MapRef,
  MarkerRef,
  VectorTileSource,
  GeoJSONSource,
} from "react-native-maplibre-gl-js";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  SlidersHorizontal,
  Info,
  UtensilsCrossed,
  Coffee,
  BedDouble,
  Sparkles,
  Landmark,
  MapPin,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  AppState,
} from "react-native";
import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { Image as ExpoImage } from "expo-image";
import { getOsmIdFromNominatim } from "@/lib/geocoding/overpass";
import { reverseGeocodeAddress } from "@/lib/geocoding/geocoding";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  GestureHandlerRootView,
  FlatList as GHFlatList,
} from "react-native-gesture-handler";
import { LoadingOverlay } from "@/components/overlays/LoadingOverlay";
import MapStyleSheet, {
  buildSatelliteStyle,
  buildSatellite3DStyle,
  MapTheme,
} from "@/components/sheets_modal/MapStyleSheet";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import RouteSheet from "@/components/sheets_modal/RouteSheet";
import DownloadSheet from "@/components/sheets_modal/DownloadSheet";
import FilterModal from "@/components/sheets_modal/FilterModal";
import { useAuthStore } from "@/lib/storage/zustand";
import LottieView from "lottie-react-native";
import ErrorSheet from "@/components/sheets_modal/ErrorSheet";
import DrawBoundsOverlay from "@/components/overlays/DrawBoundsOverlay";
import NavigationSideBar from "@/components/overlays/NavigationSideBar";
import PoiSheet from "@/components/sheets_modal/PoiSheet";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "@/lib/fonts";
import { FILTER_CATEGORIES, FILTER_DEFS } from "@/lib/config/filters";
import CityMapsButton from "@/components/city/CityMapsIcon";
import { useWeatherForecast } from "@/lib/hooks/useWeatherForecast";
import WeeklyForecast from "@/components/overlays/WeeklyForecast";
import DropPinSheet, {
  placeCategoryColor,
  placeCategoryMeta,
} from "@/components/sheets_modal/DropPinSheet";
import type { CustomPlace } from "@/lib/storage/zustand";
import { CATEGORY_SVG_ICONS } from "@/lib/geocoding/places_categories";

const { width, height } = Dimensions.get("window");

export const darken = (hex: string, amount: number) => {
  const c = hex.replace("#", "");
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) * (1 - amount));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

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
  isHome?: boolean;
};

const SNAP_POINTS = ["15%", "25%", "50%", "80%", "100%"];

const CHIP_ICONS: Record<string, React.ComponentType<any>> = {
  restaurants: UtensilsCrossed,
  cafes: Coffee,
  hotels: BedDouble,
  attractions: Sparkles,
  museums: Landmark,
};

export interface FilterCategory {
  id: string;
  labelKey: string;
  icon: string;
  color: string;
}

export interface FilterItem {
  id: string;
  labelKey: string;
  subclass: string[];
  categoryId: string;
}

export default function MapScreen() {
  const markerRef = useRef<MarkerRef | null>(null);
  const mapCenterRef = useRef<[number, number] | null>(null);
  const [pitch, setPitch] = useState(false);
  const lastLocRef = useRef<Location.LocationObject | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const hasCenteredOnce = useRef(false);
  const initialCenter = useMemo<[number, number]>(() => {
    const pos = useAuthStore.getState().mapPosition;
    return pos ? [pos.longitude, pos.latitude] : [0, 0];
  }, []);
  const [profile, setProfile] = useState<"driving" | "cycling" | "walking">(
    "driving",
  );
  const distanceInfoRef = useRef<{
    distance: number;
    duration: number;
  } | null>(null);
  const setDistanceInfo = (
    info: { distance: number; duration: number } | null,
  ) => {
    distanceInfoRef.current = info;
  };
  const [MapStyle, setMapStyle] = useState<string | StyleSpecification>(
    "https://tiles.openfreemap.org/styles/bright",
  );
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const selectedRef = useRef<CityResult | null>(null);
  const setSelected = (s: CityResult | null) => {
    selectedRef.current = s;
  };
  const [loadingSearch, setLoadingSearch] = useState(false);
  const lastFetchTimeRef = useRef(0);
  const lastFetchCityKeyRef = useRef("");
  const [query, setQuery] = useState("");
  const isPlaceSaved = useAuthStore((s) => s.isPlaceSaved);
  const removePlace = useAuthStore((s) => s.removePlace);
  const addPlace = useAuthStore((s) => s.addPlace);
  const customPlaces = useAuthStore((s) => s.customPlaces);
  const addCustomPlace = useAuthStore((s) => s.addCustomPlace);
  const updateCustomPlace = useAuthStore((s) => s.updateCustomPlace);
  const removeCustomPlace = useAuthStore((s) => s.removeCustomPlace);
  const searchHistory = useAuthStore((s) => s.searchHistory);
  const addToSearchHistory = useAuthStore((s) => s.addToSearchHistory);
  const removeFromSearchHistory = useAuthStore(
    (s) => s.removeFromSearchHistory,
  );
  const [city, setCity] = useState<SelectedCity | null>(null);
  const weather = useWeatherForecast(city);
  const clearSearchHistory = useAuthStore((s) => s.clearSearchHistory);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(false);
  const ref = useRef<LottieView>(null);
  const [markerPos, setMarkerPos] = useState<[number, number]>();
  const [selectedPoi, setSelectedPoi] = useState<{
    name: string;
    type: string;
    subclass: string;
    osm_id: number;
    osm_type: string;
    lat: number;
    lon: number;
  } | null>(null);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [articleExpanded, setArticleExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [BottomSheetIndex, setBottomSheetIndex] = useState<number>(2);
  const [, setBottomSheetIndex2] = useState<number>(2);
  const [results, setResults] = useState<CityResult[]>([]);
  const mapRef = useRef<MapRef | null>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const pinSheetRef = useRef<BottomSheet>(null);
  const [viewPlace, setViewPlace] = useState<CustomPlace | null>(null);
  const [pinMode, setPinMode] = useState<"create" | "view">("create");
  const longPressRef = useRef<{
    time: number;
    x: number;
    y: number;
    lat: number;
    lon: number;
  } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedPinIdRef = useRef<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [, setTileDataUri] = useState<string | null>(null);
  const [, setTileLoading] = useState(true);
  const [, setTileError] = useState(false);
  const theme = useAppTheme();
  const router = useRouter();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { t, i18n } = useTranslation();
  const filters = useMemo(
    () =>
      FILTER_DEFS.map((f) => {
        const cat = FILTER_CATEGORIES.find((c) => c.id === f.categoryId);
        return {
          id: f.id,
          label: t(f.labelKey),
          subclass: [...f.subclass],
          color: cat?.color ?? "#888",
          categoryId: f.categoryId,
          icon: CHIP_ICONS[f.id] ?? null,
        };
      }),
    [t],
  );

  const chipFilters = useMemo(
    () =>
      filters.filter((f) =>
        ["restaurants", "cafes", "hotels", "attractions", "museums"].includes(
          f.id,
        ),
      ),
    [filters],
  );
  const sheetPoiRef = useRef<BottomSheet>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const activeFilterRef = useRef<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const routePickModeRef = useRef<"start" | "end" | null>(null);
  const setPickMode = (mode: "start" | "end" | null) => {
    routePickModeRef.current = mode;
    setRoutePickMode(mode);
  };
  const [locationReady, setLocationReady] = useState(false);
  const [routeSheetOpen, setRouteSheetOpen] = useState(false);
  const [navDisclaimerOpen, setNavDisclaimerOpen] = useState(false);
  const [routeStart, setRouteStart] = useState<RoutePoint | null>(null);
  const [routeEnd, setRouteEnd] = useState<RoutePoint | null>(null);
  const [routePickMode, setRoutePickMode] = useState<"start" | "end" | null>(
    null,
  );
  const setMapPosition = useAuthStore((s) => s.setMapPosition);
  const initialZoom = useRef(5);
  const [mapStyleSheetOpen, setMapStyleSheetOpen] = useState(false);
  const [currentThemeKey, setCurrentThemeKey] = useState("bright");
  const currentThemeKeyRef = useRef(currentThemeKey);
  const [errorSheetOpen, setErrorSheetOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const lastBearingRef = useRef(0);
  const localSaved = isPlaceSaved(city?.name ?? "");
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

  const navDisclaimerAccepted = useAuthStore((s) => s.navDisclaimerAccepted);
  const setNavDisclaimerAccepted = useAuthStore(
    (s) => s.setNavDisclaimerAccepted,
  );

  const startNavigation = useCallback(() => {
    if (!route?.[0] || !routeStart || !routeEnd) return;
    const r = route[0];
    const [dLon, dLat] = routeEnd.coordinate;
    const homePlace = customPlaces.find((p) => p.category === "home");
    const isHomeDestination =
      !!homePlace &&
      Math.abs(homePlace.longitude - dLon) < 0.0005 &&
      Math.abs(homePlace.latitude - dLat) < 0.0005;
    useAuthStore.getState().setNavRoute({
      id: `nav-${Date.now()}`,
      startName: routeStart.label,
      startCoords: routeStart.coordinate,
      destinationName: routeEnd.label,
      destinationCoords: routeEnd.coordinate,
      geometry: r.geometry,
      steps: r.legs?.[0]?.steps || [],
      distance: r.distance,
      duration: r.duration,
      profile: profile,
      isHome: !!routeEnd.isHome || isHomeDestination,
    });
    router.push("/navigation");
  }, [route, routeStart, routeEnd, profile, router, customPlaces]);

  const handleStartNavigation = useCallback(() => {
    if (!route?.[0] || !routeStart || !routeEnd) return;
    if (navDisclaimerAccepted) {
      startNavigation();
    } else {
      setNavDisclaimerOpen(true);
    }
  }, [route, routeStart, routeEnd, navDisclaimerAccepted, startNavigation]);

  const acceptNavDisclaimer = useCallback(() => {
    setNavDisclaimerAccepted(true);
    setNavDisclaimerOpen(false);
    startNavigation();
  }, [setNavDisclaimerAccepted, startNavigation]);

  const originalPoiFiltersRef = useRef<Record<string, unknown>>({});
  const originalMinzoomRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const apply = async () => {
      if (!mapRef.current) return;
      try {
        const style = await mapRef.current.getStyle();
        if (cancelled) return;
        const poiLayers = (style as any).layers?.filter(
          (l: any) => l["source-layer"] === "poi",
        );
        if (!poiLayers?.length) return;

        for (const layer of poiLayers) {
          if (cancelled) return;
          if (!(layer.id in originalPoiFiltersRef.current)) {
            originalPoiFiltersRef.current[layer.id] = layer.filter ?? null;
          }
          if (!(layer.id in originalMinzoomRef.current)) {
            originalMinzoomRef.current[layer.id] = layer.minzoom ?? 0;
          }

          if (activeFilter) {
            const def = FILTER_DEFS.find((f) => f.id === activeFilter);
            if (!def) continue;
            const orig = originalPoiFiltersRef.current[layer.id];
            const cls = ["in", ["get", "class"], ["literal", def.subclass]];
            const next = orig ? ["all", orig, cls] : cls;
            await mapRef.current.setFilter(layer.id, next as any);
            await mapRef.current.setLayerZoomRange(layer.id, 10, 24);
          } else {
            const orig = originalPoiFiltersRef.current[layer.id];
            await mapRef.current.setFilter(layer.id, (orig ?? null) as any);
            const origMinzoom = originalMinzoomRef.current[layer.id] ?? 0;
            await mapRef.current.setLayerZoomRange(layer.id, origMinzoom, 24);
          }
        }

        if (cancelled) return;
        if (activeFilter) {
          const zoom = await mapRef.current.getZoom();
          if (zoom > 13) {
            await mapRef.current.flyTo({ zoom: 13, duration: 500 });
          }
        } else {
          const zoom = await mapRef.current.getZoom();
          if (zoom < 15) {
            await mapRef.current.flyTo({ zoom: 15, duration: 500 });
          }
        }
      } catch {}
    };
    apply();
    return () => {
      cancelled = true;
    };
  }, [activeFilter]);

  const StatusBarStyle: "dark" | "light" =
    currentThemeKey === "dark" ? "light" : "dark";

  // Location/GPS Stuff

  const startLocationWatcher = useCallback(async () => {
    if (subRef.current) return;
    let cancelled = false;

    try {
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
      } catch (e) {
        Sentry.captureException(e);
      }

      const s = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
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

      if (!cancelled) {
        subRef.current = s;
      }
    } catch (e) {
      Sentry.captureException(e);
      setLocationReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startLocationWatcher();

    return () => {
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [startLocationWatcher]);

  // Restart GPS watcher when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        startLocationWatcher();
      }
    });
    return () => sub.remove();
  }, [startLocationWatcher]);

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
    setArticleExpanded(false);
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

  const ensureGlobe = async () => {
    if (!mapRef.current) return;
    await mapRef.current.setProjection({ type: "globe" });
  };

  const toggleFavorite = () => {
    if (!city) return;

    if (!localSaved) {
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

  const openCityMap = () => {
    if (!city) return;
    const cityId = city.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const q =
      `name=${encodeURIComponent(city.name)}&latitude=${city.latitude}&longitude=${city.longitude}` +
      (city.region ? `&region=${encodeURIComponent(city.region)}` : "") +
      (city.country ? `&country=${encodeURIComponent(city.country)}` : "") +
      (article?.thumbnail
        ? `&thumbnail=${encodeURIComponent(article.thumbnail)}`
        : "");
    router.push(`/city/${cityId}?${q}` as any);
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

  // Wikipedia logic
  useEffect(() => {
    if (!city?.name) return;

    const headers = {
      "User-Agent": `Atlasys/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL!})`,
      Accept: "application/json",
    };

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
        } catch (error) {
          Sentry.captureException(error);
        }

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
    const cityKey = `${city?.name}|${city?.latitude}|${city?.longitude}`;
    if (
      cityKey === lastFetchCityKeyRef.current &&
      now - lastFetchTimeRef.current < 3000
    )
      return;
    lastFetchTimeRef.current = now;
    lastFetchCityKeyRef.current = cityKey;
    const wikiTimer = setTimeout(() => fetchWikipediaData());
    return () => {
      controller.abort();
      clearTimeout(wikiTimer);
    };
  }, [city?.name, city?.latitude, city?.longitude, i18n.language, t]);

  useEffect(() => {
    if (!city?.latitude || !city?.longitude) {
      const tileClearTimer = setTimeout(() => setTileDataUri(null));
      return () => clearTimeout(tileClearTimer);
    }
    const zoom = 13;
    const n = Math.pow(2, zoom);
    const x = Math.floor(n * ((city.longitude + 180) / 360));
    const latRad = (city.latitude * Math.PI) / 180;
    const y = Math.floor(
      (n * (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) /
        2,
    );
    const url = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`;
    const cancel = { current: false };

    setTimeout(() => {
      if (cancel.current) return;
      setTileLoading(true);
      setTileError(false);
    });

    fetch(url, {
      headers: {
        "User-Agent": `Atlasys/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL!})`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Tile fetch failed");
        return res.arrayBuffer();
      })
      .then((buf) => {
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        setTileDataUri(`data:image/png;base64,${base64}`);
        setTileLoading(false);
      })
      .catch(() => {
        setTileError(true);
        setTileLoading(false);
      });

    return () => {
      cancel.current = true;
    };
  }, [city?.latitude, city?.longitude]);

  const getWeatherIcon = useCallback((code: number) => {
    if (code <= 2) return <Sun size={20} color="#FFD700" />;
    if (code <= 2) return <CloudSunIcon size={20} color="#948b59" />;
    if (code <= 63) return <CloudRainIcon size={20} color="#3B82F6" />;
    if (code <= 48) return <Cloud size={20} color="#94A3B8" />;
    if (code <= 77) return <Snowflake size={20} color="#3e6095" />;
    if (code <= 82) return <CloudRainIcon size={20} color="#3B82F6" />;
    if (code <= 99) return <CloudLightningIcon size={20} color="94A3B8" />;
    return <Cloud size={20} color="#94A3B8" />;
  }, []);

  const searchCities = useCallback(
    async (q: string) => {
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
    },
    [i18n.language],
  );

  useEffect(() => {
    if (!query || query.length < 2) {
      const clearResultsTimer = setTimeout(() => setResults([]));
      return () => clearTimeout(clearResultsTimer);
    }
    const searchTimer = setTimeout(() => searchCities(query), 350);
    return () => clearTimeout(searchTimer);
  }, [query, searchCities]);

  const markerKey = (m: CustomPlace) =>
    m.category === "custom" ? m.categoryIcon : m.category;

  const filteredMarkers = useMemo(() => {
    if (!query || query.length < 2) return [];
    const needle = query.toLowerCase();
    return customPlaces.filter((m) => {
      const cat = markerKey(m) ?? "";
      return [m.name, m.customCategory, m.address, cat]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle));
    });
  }, [query, customPlaces]);

  const handleSelectMarkerSearch = (place: CustomPlace) => {
    setResults([]);
    setQuery("");
    setCity(null);
    Keyboard.dismiss();
    mapRef.current?.flyTo({
      center: [place.longitude, place.latitude],
      zoom: 14,
      duration: 800,
    });
    requestAnimationFrame(() => {
      handleOpenCustomPlace(place);
    });
  };

  function onSelectCity(city: CityResult) {
    sheetRef.current?.snapToIndex(2);
    setSelected(city);
    Keyboard.dismiss();

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

  const handleSelectTheme = async (theme: MapTheme) => {
    const pos = useAuthStore.getState().mapPosition;
    setCurrentThemeKey(theme.key);
    currentThemeKeyRef.current = theme.key;

    if (theme.key === "Satelite") {
      const style = await buildSatelliteStyle();
      setMapStyle(style);
    } else if (theme.key === "Satelite3D") {
      const style = await buildSatellite3DStyle();
      setMapStyle(style);
    } else {
      setMapStyle(theme.url);
    }

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

  const onMapClick = async (event: any) => {
    Keyboard.dismiss();
    const { lng, lat } = event.lngLat;
    if (drawModeRef.current) return;
    if (!mapRef.current) return;
    if (routePickModeRef.current) return;

    try {
      const allFeatures = await mapRef.current.queryRenderedFeatures(
        event.point,
      );

      const poiFeatures = allFeatures.filter((f: any) =>
        f.layer?.id?.startsWith("poi_"),
      );
      if (!poiFeatures.length) return;

      const activeSubclasses = activeFilterRef.current
        ? (filters.find((f) => f.id === activeFilterRef.current)?.subclass ??
          [])
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
      const osm_id = Number(closest.properties?.osm_id) || 0;

      const data = {
        name: closest.properties?.name ?? t("Unknown_poi"),
        type: closest.properties?.class ?? "",
        subclass: closest.properties?.subclass ?? "",
        osm_id,
        osm_type: closest.properties?.osm_type || undefined,
        lat: lat2,
        lon,
      };

      setSelectedPoi(data);

      if (osm_id === 0) {
        getOsmIdFromNominatim(closest.properties?.name ?? "", lat2, lon).then(
          (result) => {
            if (result) {
              setSelectedPoi((prev) =>
                prev && prev.lat === lat2 && prev.lon === lon
                  ? {
                      ...prev,
                      osm_id: result.osm_id,
                      osm_type: result.osm_type,
                    }
                  : prev,
              );
            } else {
              setSelectedPoi((prev) =>
                prev && prev.lat === lat2 && prev.lon === lon
                  ? { ...prev, osm_id: -1 }
                  : prev,
              );
            }
          },
        );
      }
    } catch (e) {
      Sentry.captureException(e);
    }
  };

  // Open PoiSheet after render when a POI is selected
  useEffect(() => {
    if (selectedPoi) {
      requestAnimationFrame(() => {
        sheetPoiRef.current?.snapToIndex(0);
      });
    }
  }, [selectedPoi]);

  // Long-press to drop a pin (custom places)
  const handleMapTouchStart = (e: any) => {
    if (e?.points?.length > 1) {
      longPressRef.current = null;
      return;
    }
    if (!e?.lngLat) return;
    longPressRef.current = {
      time: Date.now(),
      x: e.point?.x,
      y: e.point?.y,
      lat: e.lngLat.lat,
      lon: e.lngLat.lng,
    };
    longPressTimerRef.current = setTimeout(() => {
      const start = longPressRef.current;
      longPressRef.current = null;
      longPressTimerRef.current = null;
      if (!start) return;
      if (routePickModeRef.current) return;
      if (drawModeRef.current) return;
      openPinCreateSheet(start.lat, start.lon);
    }, 250);
  };

  const handleMapTouchMove = (e: any) => {
    const start = longPressRef.current;
    if (!start) return;
    if (e?.points?.length > 1) {
      longPressRef.current = null;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return;
    }
    const x = e.point?.x;
    const y = e.point?.y;
    if (x == null || y == null) return;
    if (Math.hypot(x - start.x, y - start.y) > 18) {
      longPressRef.current = null;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const removeSavedMarkers = () => {
    useAuthStore
      .getState()
      .customPlaces.filter((p) => !p.category)
      .forEach((p) => removeCustomPlace(p.id));
  };

  const openPinCreateSheet = (lat: number, lon: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinMode("create");
    setViewPlace(null);
    sheetRef.current?.close();

    removeSavedMarkers();

    addCustomPlace({
      name: "",
      category: "",
      latitude: lat,
      longitude: lon,
    });

    const newPlace = useAuthStore.getState().customPlaces[0];
    if (newPlace) {
      savedPinIdRef.current = newPlace.id;
      setViewPlace(newPlace);
    }

    requestAnimationFrame(() => {
      pinSheetRef.current?.snapToIndex(1);
    });
  };

  const handleMapTouchEnd = (_e: any) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressRef.current = null;
  };

  const handleOpenCustomPlace = (place: CustomPlace) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinMode("view");
    setViewPlace(place);
    mapRef.current?.flyTo({
      center: [place.longitude, place.latitude],
      zoom: 14,
      duration: 800,
    });
    requestAnimationFrame(() => {
      pinSheetRef.current?.snapToIndex(0);
    });
  };

  const handleSaveCustomPlace = ({
    name,
    category,
    customCategory,
    categoryIcon,
    address,
  }: {
    name: string;
    category: string;
    customCategory?: string;
    categoryIcon?: string;
    address?: string;
  }) => {
    if (!savedPinIdRef.current) return;
    updateCustomPlace(savedPinIdRef.current, {
      name,
      category,
      customCategory,
      categoryIcon,
      address,
    });
    savedPinIdRef.current = null;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setViewPlace(null);
    pinSheetRef.current?.close();
  };

  const handleDeleteCustomPlace = (id: string) => {
    if (savedPinIdRef.current === id) savedPinIdRef.current = null;
    removeCustomPlace(id);
    setViewPlace(null);
    pinSheetRef.current?.close();
  };

  const handleRouteToCustomPlace = (lat: number, lon: number, name: string) => {
    setRoute(null);
    setDistanceInfo(null);
    setRouteStart(
      markerPos ? { label: t("Poi_my_location"), coordinate: markerPos } : null,
    );
    setRouteEnd({ label: name, coordinate: [lon, lat] });
    setRouteSheetOpen(true);
    setViewPlace(null);
    pinSheetRef.current?.close();
  };

  const handleMarkerTapForRoute = (place: CustomPlace) => {
    setRouteEnd({
      label: place.name || place.address || "Marker",
      coordinate: [place.longitude, place.latitude],
      isHome: place.category === "home",
    });
    setViewPlace(null);
    pinSheetRef.current?.close();
  };

  const pinHtml = (color: string, iconSvg?: string) => `
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                background: radial-gradient(circle at 50% 50%, ${color}, ${darken(color, 0.4)});
                border-radius: 50%;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.6);
                position: relative;
                cursor: pointer;
              " title="Location">
                ${iconSvg ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>` : ""}
              </div>
            `;

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
      timer = setTimeout(() => setShowError(false));
      const delayed = setTimeout(() => {
        setShowError(true);
      }, 5000);
      const clear = () => {
        clearTimeout(timer);
        clearTimeout(delayed);
      };
      return clear;
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
            style={{
              color: theme.textColor,
              fontSize: 13,
              fontFamily: fonts.medium,
            }}
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
            style={{
              color: theme.textColor,
              fontSize: 13,
              fontFamily: fonts.medium,
            }}
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
          style={StyleSheet.absoluteFill}
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
                      fontFamily: fonts.bold,
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
                      fontFamily: fonts.bold,
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
              touchstart: {
                objectListener: handleMapTouchStart,
              },
              touchmove: {
                objectListener: handleMapTouchMove,
              },
              touchend: {
                objectListener: handleMapTouchEnd,
              },
              touchcancel: {
                objectListener: () => {
                  longPressRef.current = null;
                },
              },
              mount: {
                rnListener: () => {
                  ensureGlobe();
                },
              },
              rotate: {
                objectListener: updateBearing,
              },
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
              load: {
                objectListener: () => setMapReady(true),
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
          {!drawMode &&
            customPlaces.map((place) => (
              <Marker
                key={place.id}
                options={{
                  coordinate: [place.longitude, place.latitude],
                  element: {
                    innerHTML: pinHtml(
                      place.category === "custom"
                        ? placeCategoryColor(place.categoryIcon)
                        : place.category
                          ? placeCategoryColor(place.category)
                          : theme.danger,
                      place.category === "custom"
                        ? place.categoryIcon
                          ? CATEGORY_SVG_ICONS[place.categoryIcon]
                          : CATEGORY_SVG_ICONS["bookmark"]
                        : place.category
                          ? CATEGORY_SVG_ICONS[place.category]
                          : CATEGORY_SVG_ICONS["bookmark"],
                    ),
                  },
                }}
                listeners={{
                  click: {
                    elementListener: () => {
                      if (routeSheetOpen) {
                        handleMarkerTapForRoute(place);
                      } else {
                        handleOpenCustomPlace(place);
                      }
                    },
                  },
                }}
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
                    const address = await reverseGeocodeAddress(
                      lat,
                      lon,
                      i18n.language,
                    );

                    setBottomSheetIndex(2);
                    sheetRef.current?.snapToIndex(2);
                    selectCity({
                      name: closest.properties?.name ?? t("Unknown_poi"),
                      latitude: lat,
                      longitude: lon,
                      country: address.country,
                      region: address.region,
                    });
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
                  cursorColor={theme.accentColor}
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
                {loadingSearch && (
                  <ActivityIndicator size="small" color={theme.primary} />
                )}
                <View style={styles.avatarView}>
                  <ExpoImage
                    source={require("@/assets/images/icons/Vector-light.png")}
                    style={{ height: 20, width: 20, alignSelf: "flex-start" }}
                    contentFit="scale-down"
                    transition={20}
                  />
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {chipFilters.map((item) => {
                  const isActive = activeFilter === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.filterChip,
                        isActive && {
                          backgroundColor: item.color,
                          borderColor: item.color,
                        },
                      ]}
                      onPress={() => handleSetFilter(isActive ? null : item.id)}
                    >
                      {item.icon ? (
                        <item.icon
                          size={16}
                          color={isActive ? "#fff" : item.color}
                          strokeWidth={2}
                        />
                      ) : (
                        <View
                          style={[
                            styles.filterDot,
                            {
                              backgroundColor: isActive ? "#fff" : item.color,
                            },
                          ]}
                        />
                      )}
                      <Text
                        style={[
                          styles.filterText,
                          isActive && styles.filterTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={() => setFilterModalOpen(true)}
                >
                  <SlidersHorizontal size={14} color={theme.textColor} />
                  <Text style={styles.filterText}>{t("Filter_more")}</Text>
                </TouchableOpacity>
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

              {(results.length > 0 || filteredMarkers.length > 0) &&
                query.length > 0 &&
                !city && (
                  <View style={styles.suggestionBox}>
                    <FlatList
                      data={[
                        ...filteredMarkers.map((m) => ({
                          type: "marker" as const,
                          m,
                        })),
                        ...results.map((r) => ({ type: "city" as const, r })),
                      ]}
                      keyExtractor={(item) =>
                        item.type === "marker"
                          ? `m-${item.m.id}`
                          : `c-${String(item.r.id)}`
                      }
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) =>
                        item.type === "marker" ? (
                          <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => handleSelectMarkerSearch(item.m)}
                          >
                            <View
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 15,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor:
                                  placeCategoryColor(markerKey(item.m)) + "22",
                              }}
                            >
                              <MapPin
                                size={16}
                                color={placeCategoryColor(markerKey(item.m))}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.suggTitle} numberOfLines={1}>
                                {item.m.name || item.m.address}
                              </Text>
                              <Text style={styles.suggSub} numberOfLines={1}>
                                {item.m.address ||
                                  item.m.customCategory ||
                                  t(
                                    placeCategoryMeta(markerKey(item.m))
                                      ?.labelKey ?? "Place_cat_other",
                                  )}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => {
                              setResults([]);
                              onSelectCity(item.r);
                            }}
                          >
                            <Text style={styles.suggTitle}>
                              {item.r.name ?? item.r.city}
                            </Text>
                            <Text style={styles.suggSub}>
                              {item.r.region ? item.r.region + ", " : ""}
                              {item.r.country}
                            </Text>
                          </TouchableOpacity>
                        )
                      }
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
                        fontFamily={fonts.bold}
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

          <DropPinSheet
            sheetRef={pinSheetRef}
            mode={pinMode}
            pin={
              viewPlace
                ? {
                    id: viewPlace.id,
                    name: viewPlace.name,
                    category: viewPlace.category,
                    customCategory: viewPlace.customCategory,
                    categoryIcon: viewPlace.categoryIcon,
                    latitude: viewPlace.latitude,
                    longitude: viewPlace.longitude,
                  }
                : null
            }
            snapPoints={["30%", "55%", "85%"]}
            onSave={handleSaveCustomPlace}
            onDelete={handleDeleteCustomPlace}
            onRoute={handleRouteToCustomPlace}
            onClose={() => {
              savedPinIdRef.current = null;
              setViewPlace(null);
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
                setBottomSheetIndex(i);
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
                            fontFamily: fonts.semibold,
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
                              fontFamily: fonts.medium,
                              fontSize: 18,
                              color: theme.white,
                              paddingHorizontal: 10,
                            }}
                          >
                            {t("Poi_start_route")}
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
                      <ExpoImage
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
                              <ExpoImage
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
                    <CityMapsButton onPress={openCityMap} />
                    {city && <View style={{ paddingBottom: 16 }}></View>}
                    <Text style={styles.wikiSectionHeading}>
                      {article.title}
                    </Text>
                    <Text
                      style={styles.extractText}
                      numberOfLines={articleExpanded ? undefined : 4}
                      ellipsizeMode="tail"
                    >
                      {article?.extract}
                    </Text>
                    {!articleExpanded ? (
                      <TouchableOpacity
                        onPress={() => setArticleExpanded(true)}
                        style={{ marginTop: 8 }}
                      >
                        <Text style={styles.readMoreLink}>
                          {t("Read_more")}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={openURL}
                        style={{ marginTop: 8 }}
                      >
                        <Text style={styles.readMoreLink}>
                          {t("Read_on_wikipedia")}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <WeeklyForecast weather={weather} />
                    <View style={styles.wikiFooter}>
                      <View style={styles.wikiFooterRow}>
                        <Info size={14} color={theme.subTextColor} />
                        <Text style={styles.wikiFooterLabel}>
                          {t("Data_provided_by")}
                        </Text>
                      </View>
                      <View style={styles.wikiFooterLinks}>
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL("https://www.openstreetmap.org/")
                          }
                          style={styles.wikiFooterLink}
                        >
                          <Text style={styles.wikiFooterLinkText}>
                            OpenStreetMap
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.wikiFooterDot}>·</Text>
                        <TouchableOpacity
                          onPress={() => {
                            const wikiLang = (i18n.language || "en").split(
                              "-",
                            )[0];
                            Linking.openURL(
                              `https://${wikiLang}.wikipedia.org/`,
                            );
                          }}
                          style={styles.wikiFooterLink}
                        >
                          <Text style={styles.wikiFooterLinkText}>
                            Wikipedia
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.wikiFooterDot}>·</Text>
                        <TouchableOpacity
                          onPress={() => {
                            Linking.openURL(`https://open-meteo.com/`);
                          }}
                          style={styles.wikiFooterLink}
                        >
                          <Text style={styles.wikiFooterLinkText}>
                            Open-Meteo
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
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
                      <ExpoImage
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
            }}
            onSetStart={(point) => setRouteStart(point)}
            onSetEnd={(point) => setRouteEnd(point)}
            customPlaces={customPlaces}
            onRouteReady={async (routes, p) => {
              setRoute(routes);
              setProfile(p);
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
            onStartNavigation={handleStartNavigation}
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
          <Modal
            visible={navDisclaimerOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setNavDisclaimerOpen(false)}
          >
            <View style={styles.disclaimerOverlay}>
              <View
                style={[
                  styles.disclaimerCard,
                  { backgroundColor: theme.cardBg },
                ]}
              >
                <View style={styles.disclaimerHeader}>
                  <AlertTriangle size={22} color={theme.danger || "#EF4444"} />
                  <Text
                    style={[styles.disclaimerTitle, { color: theme.textColor }]}
                  >
                    {t("Nav_disclaimer_title")}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.disclaimerBody,
                    { color: theme.subTextColor || "#666" },
                  ]}
                >
                  {t("Nav_disclaimer_body")}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.disclaimerAccept,
                    { backgroundColor: theme.primary || "#2563EB" },
                  ]}
                  onPress={acceptNavDisclaimer}
                  activeOpacity={0.8}
                >
                  <Text style={styles.disclaimerAcceptText}>
                    {t("Nav_disclaimer_accept")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNavDisclaimerOpen(false)}
                  style={styles.disclaimerDecline}
                >
                  <Text
                    style={[
                      styles.disclaimerDeclineText,
                      { color: theme.textColor },
                    ]}
                  >
                    {t("Nav_disclaimer_decline")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {mapReady &&
            route?.map((r: any, i: number) =>
              r.geometry ? (
                <GeoJSONSource
                  key={`route-${i}-${r.geometry.coordinates?.length ?? 0}`}
                  id={`route-${i}`}
                  source={{
                    type: "geojson",
                    data: {
                      type: "Feature",
                      properties: {},
                      geometry: r.geometry,
                    },
                  }}
                  layers={[
                    {
                      layer: {
                        id: `route-line-${i}`,
                        type: "line",
                        layout: {
                          "line-join": "round",
                          "line-cap": "round",
                        },
                        paint: {
                          "line-width": i === 0 ? 6 : 3,
                          "line-color":
                            i === 0 ? theme.primaryDark : theme.subTextColor,
                        },
                      },
                    },
                  ]}
                />
              ) : null,
            )}
        </MapProvider>
      </View>
      <MapStyleSheet
        open={mapStyleSheetOpen}
        currentTheme={currentThemeKey}
        onSelect={handleSelectTheme}
        onClose={() => setMapStyleSheetOpen(false)}
      />
      <FilterModal
        open={filterModalOpen}
        categories={FILTER_CATEGORIES}
        filters={FILTER_DEFS}
        activeFilter={activeFilter}
        onSelect={handleSetFilter}
        onClose={() => setFilterModalOpen(false)}
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
      fontFamily: fonts.bold,
      color: subTextColor,
    },
    articleHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
      gap: 10,
      marginLeft: 10,
    },
    searchWrapper: {
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 45,
      left: 12,
      right: 12,
      zIndex: 50,
    },
    input: {
      flex: 1,
      height: 44,
      marginHorizontal: 10,
      fontSize: 16,
      color: textColor,
      alignSelf: "center",
    },
    searchContainer: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
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
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: inputBg,
      borderRadius: 20,
      borderColor: inputBg,
      borderWidth: 2,
    },
    filterChipActive: {
      backgroundColor: tabIndicator,
    },
    filterDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    filterText: {
      fontSize: 13,
      color: textColor,
    },
    filterTextActive: {
      color: white,
      fontFamily: fonts.semibold,
    },
    disclaimerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    disclaimerCard: {
      width: "100%",
      maxWidth: 420,
      borderRadius: 20,
      padding: 24,
      gap: 16,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 10,
    },
    disclaimerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    disclaimerTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      flex: 1,
    },
    disclaimerBody: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: fonts.regular,
    },
    disclaimerAccept: {
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 14,
    },
    disclaimerAcceptText: {
      color: white,
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
    disclaimerDecline: {
      alignItems: "center",
      paddingVertical: 10,
    },
    disclaimerDeclineText: {
      fontFamily: fonts.medium,
      fontSize: 14,
    },
    readMoreLink: {
      color: primary,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    wikiSectionHeading: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: textColor,
      marginBottom: 10,
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
      fontFamily: fonts.semibold,
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
      fontFamily: fonts.bold,
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
    suggTitle: {
      fontSize: 16,
      fontFamily: fonts.semibold,
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
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
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
    cityMapCard: {
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 12,
      marginBottom: 20,
      backgroundColor: cardBgSecondary,
      borderWidth: 1,
      borderColor: borderColor,
    },
    cityMapCardPreview: {
      height: 120,
      overflow: "hidden",
      position: "relative",
    },
    cmRoad: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 3,
      opacity: 0.8,
    },
    cmRoadV: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 2,
      opacity: 0.7,
    },
    cmPark: {
      position: "absolute",
      top: "10%",
      left: "10%",
      width: "20%",
      height: "30%",
      backgroundColor: "#66bb6a",
      opacity: 0.5,
      borderRadius: 4,
    },
    cmWater: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: "50%",
      height: "20%",
      backgroundColor: "#90caf9",
      opacity: 0.6,
      borderTopRightRadius: 12,
    },
    cmBuilding: {
      position: "absolute",
      top: "15%",
      left: "40%",
      width: 12,
      height: 12,
      backgroundColor: "#81c784",
      opacity: 0.5,
      borderRadius: 2,
    },
    cityMapCardOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.25)",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },
    cityMapCardTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: "#fff",
    },
    cityMapCardLoading: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    cityMapCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    cityMapCardSub: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: textColor,
    },
    wikiFooter: {
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: borderColor,
      alignItems: "center",
      gap: 8,
    },
    wikiFooterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    wikiFooterLabel: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: subTextColor,
    },
    wikiFooterLinks: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    wikiFooterLink: {
      paddingVertical: 2,
    },
    wikiFooterLinkText: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: primary,
    },
    wikiFooterDot: {
      fontSize: 13,
      color: subTextColor,
    },
  });
};
