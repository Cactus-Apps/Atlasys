import type { StyleSpecification } from "maplibre-gl";
import {
  MapProvider,
  Map,
  Marker,
  MapRef,
  GeoJSONSource,
} from "react-native-maplibre-gl-js";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sentry from "@sentry/react-native";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Bus,
  Info,
  Star,
  Landmark,
  Church,
  Compass,
  Navigation,
  UtensilsCrossed,
  Clock,
  Phone,
  Globe,
  ChevronDown,
  ChevronLeft,
  X,
  Route,
  Share2,
  Accessibility,
  ChefHat,
  Mail,
  RailSymbol,
  TramFront,
  TrainFront,
  Ship,
  ArrowRight,
} from "lucide-react-native";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { Image as ExpoImage } from "expo-image";
import cityStyle from "@/assets/map/city-style.json";
import { useAuthStore } from "@/lib/storage/zustand";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  fetchCityPOIs,
  fetchTransitRoutes,
  fetchTransitRouteDetails,
  enrichPOIsWithImages,
  fetchLocalizedName,
  type CityPOI,
  type CityTransitStop,
  type TransitRoute,
} from "@/lib/geocoding/cityoverpass";
import {
  fetchPOIDetails,
  parseOpeningHours,
  parseOpeningHoursTable,
  type OverpassPOIDetails,
  type OpenStatus,
} from "@/lib/geocoding/overpass";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomPanel, {
  SCREEN_HEIGHT,
} from "@/components/sheets_modal/BottomPanel";
import { StopToast } from "@/components/overlays/StopToast";
import { fonts } from "@/lib/fonts";
import CityLoadingSkeleton from "@/components/city/CityLoadingSkeleton";

type TabName = "discover" | "transit" | "info";

const POI_COLORS: Record<string, string> = {
  museum: "#8B4513",
  monument: "#DAA520",
  artwork: "#8B5CF6",
  attraction: "#E8751A",
  historic: "#B91C1C",
  viewpoint: "#059669",
  worship: "#C94B32",
  food: "#E8751A",
  nightlife: "#7C3AED",
};

const POI_BG_COLORS: Record<string, string> = {
  museum: "#F5E6D3",
  monument: "#FFF8E1",
  artwork: "#F3E8FF",
  attraction: "#FFF3E0",
  historic: "#FFEBEE",
  viewpoint: "#ECFDF5",
  worship: "#FFF0EB",
  food: "#FFF3E0",
  nightlife: "#F3E8FF",
};

type ArticleData = {
  title: string;
  thumbnail: string | null;
  extract: string;
  images: { previewUrl: string; fullUrl: string }[];
};

export default function CityScreen() {
  const params = useLocalSearchParams<{
    cityId: string;
    name: string;
    latitude: string;
    longitude: string;
    region?: string;
    country?: string;
    thumbnail?: string;
  }>();

  const router = useRouter();
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();
  const mapRef = useRef<MapRef | null>(null);
  const styles = useMemo(() => getStyles(theme), [theme]);

  const cityName = params.name || params.cityId || "Unknown";
  const lat = params.latitude ? parseFloat(params.latitude) : NaN;
  const lon = params.longitude ? parseFloat(params.longitude) : NaN;
  const country = params.country || "";
  const region = params.region || "";

  const [activeTab, setActiveTab] = useState<TabName>("discover");
  const [activeTransitType, setActiveTransitType] = useState<string>("all");
  const [pois, setPois] = useState<CityPOI[]>([]);
  const [visiblePoiCount, setVisiblePoiCount] = useState(15);
  const [transitRoutes, setTransitRoutes] = useState<TransitRoute[]>([]);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loadingPOI, setLoadingPOI] = useState(true);
  const [loadingTransit, setLoadingTransit] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [errorPOI, setErrorPOI] = useState<string | null>(null);
  const [errorTransit, setErrorTransit] = useState<string | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<CityPOI | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null);
  const [toastStop, setToastStop] = useState<CityTransitStop | null>(null);
  const [loadingRouteDetails, setLoadingRouteDetails] = useState(false);
  const isPlaceSaved = useAuthStore((s) => s.isPlaceSaved);
  const [localSaved, setLocalSaved] = useState(() => isPlaceSaved(cityName));
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  // POI detail state
  const [poiDetails, setPoiDetails] = useState<OverpassPOIDetails | null>(null);
  const [loadingPoiDetails, setLoadingPoiDetails] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const addPlace = useAuthStore((s) => s.addPlace);
  const removePlace = useAuthStore((s) => s.removePlace);

  const poiDetailsCache = useRef<Record<number, OverpassPOIDetails>>({});
  const splitPosition = useSharedValue(0.5);
  const mapStyle = useAnimatedStyle(() => ({
    bottom: (1 - splitPosition.value) * SCREEN_HEIGHT,
  }));

  const rankPOIs = (pois: CityPOI[]): CityPOI[] => {
    return pois
      .map((poi) => {
        let score = 0;
        if (poi.image) score += 100000;
        if (poi.stars === 5) score += 80000;
        if (poi.stars && poi.stars >= 4) score += 70000;
        const cat = (poi.category || "").toLowerCase();
        const sub = (poi.subtype || "").toLowerCase();
        if (cat === "museum" || sub === "museum") score += 60000;
        if (cat === "attraction" || sub === "attraction") score += 60000;
        if (poi.cuisine || cat === "food" || sub === "restaurant")
          score += 40000;
        if (cat === "monument" || sub === "monument") score += 20000;
        if (cat === "artwork" || sub === "artwork") score += 10000;
        if (poi.description) score += 2000;
        if (poi.website) score += 1500;
        if (poi.wikidata || poi.wikipedia) score += 1500;
        if (poi.phone) score += 1000;
        if (poi.openingHours) score += 1000;
        return { poi, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ poi }) => poi);
  };

  const ROUTE_TYPE_ORDER: Record<string, number> = {
    subway: 0,
    light_rail: 0,
    tram: 1,
    train: 2,
    bus: 3,
    ferry: 4,
  };

  const sortTransitRoutes = (routes: TransitRoute[]): TransitRoute[] => {
    return [...routes].sort((a, b) => {
      const pa = ROUTE_TYPE_ORDER[a.routeType] ?? 99;
      const pb = ROUTE_TYPE_ORDER[b.routeType] ?? 99;
      if (pa !== pb) return pa - pb;
      return (a.ref || a.name).localeCompare(b.ref || b.name);
    });
  };

  useEffect(() => {
    if (!lat || !lon) return;
    let cancelled = false;
    fetchCityPOIs(lat, lon)
      .then(async (data: CityPOI[]) => {
        if (cancelled) return;
        setErrorPOI(null);
        const enriched = await enrichPOIsWithImages(data);
        const ranked = rankPOIs(enriched);
        if (!cancelled) {
          setPois(ranked);
          setVisiblePoiCount(15);
          setLoadingPOI(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          const msg = err?.message || String(err);
          Sentry.captureException(err);
          setErrorPOI(msg.substring(0, 120));
          setLoadingPOI(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  useEffect(() => {
    if (!lat || !lon) return;
    let cancelled = false;
    fetchTransitRoutes(lat, lon)
      .then((routes: TransitRoute[]) => {
        if (!cancelled) {
          setLoadingTransit(true);
          setErrorTransit(null);
          const sorted = sortTransitRoutes(routes);
          setTransitRoutes(sorted);
          setLoadingTransit(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          const msg = err?.message || String(err);
          Sentry.captureException(err);
          setErrorTransit(msg.substring(0, 120));
          setLoadingTransit(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  useEffect(() => {
    if (!cityName) return;
    const controller = new AbortController();
    const headers = {
      "User-Agent": `Atlasys/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL!})`,
    };

    const fetchArticle = async () => {
      setLoadingArticle(true);
      try {
        const wikiLang = (i18n.language || "en").split("-")[0];
        const searchRes = await fetch(
          `https://${wikiLang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cityName)}&limit=1&format=json&origin=*`,
          { headers, signal: controller.signal },
        );
        const searchData = await searchRes.json();
        if (!searchData[1]?.length) {
          setLoadingArticle(false);
          return;
        }
        const pageTitle = searchData[1][0];

        const extractRes = await fetch(
          `https://${wikiLang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageprops&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`,
          { headers, signal: controller.signal },
        );
        const extractData = await extractRes.json();
        const pages = extractData.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId].extract || t("No_summary_available");

        let imageUrls: { previewUrl: string; fullUrl: string }[] = [];
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
                `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(cat)}&cmtype=file&cmlimit=20&format=json&origin=*`,
                { headers, signal: controller.signal },
              );
              const cmData = await cmRes.json();
              const imageTitles =
                cmData.query?.categorymembers?.map((cm: any) => cm.title) || [];

              if (imageTitles.length > 0) {
                const titlesQuery = imageTitles
                  .map((t: string) => encodeURIComponent(t))
                  .join("|");
                const iiRes = await fetch(
                  `https://${wikiLang}.wikipedia.org/w/api.php?action=query&titles=${titlesQuery}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=320&format=json&origin=*`,
                  { headers, signal: controller.signal },
                );
                const iiData = await iiRes.json();
                if (iiData.query?.pages) {
                  const isJunk = (url: string) => {
                    const lower = url.toLowerCase();
                    return [
                      "locator_map", "location_map", "relief_map",
                      "topographic", "orthophoto", "_map.", "karte.",
                      "flag_of", "flagge_", "coat_of_arms", "wappen_",
                      "klimadiagramm", "climograph", "icon", "logo",
                      ".svg", "blank_", "placeholder", "no_image",
                      "transparent",
                    ].some((w) => lower.includes(w));
                  };
                  Object.values(iiData.query.pages).forEach((p: any) => {
                    const info = p.imageinfo?.[0];
                    const canonical = info?.thumburl || info?.url;
                    if (
                      canonical &&
                      !isJunk(canonical) &&
                      (canonical.endsWith(".jpg") ||
                        canonical.endsWith(".png") ||
                        canonical.endsWith(".jpeg"))
                    ) {
                      imageUrls.push({
                        previewUrl: info.thumburl || info.url,
                        fullUrl: info.thumburl || info.url,
                      });
                    }
                  });
                }
              }
            }
          }
        } catch (e) {
          Sentry.captureException(e);
        }

        const thumbnail = imageUrls[0]?.previewUrl || null;
        setArticle({
          title: pageTitle,
          extract,
          thumbnail,
          images: imageUrls,
        });
      } catch (e) {
        Sentry.captureException(e);
      } finally {
        if (!controller.signal.aborted) setLoadingArticle(false);
      }
    };

    fetchArticle();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityName]);

  const handleBack = () => {
    if (selectedPOI) {
      setSelectedPOI(null);
      return;
    }
    router.navigate("/(tabs)/saved");
  };

  const toggleFavorite = () => {
    const saved = localSaved;
    if (!saved) {
      setLocalSaved(true);
      addPlace({
        name: cityName,
        latitude: lat,
        longitude: lon,
        region,
        country,
        thumbnail: article?.thumbnail || params.thumbnail,
      });
    } else {
      setLocalSaved(false);
      removePlace(cityName);
    }
  };

  const retryPOI = useCallback(() => {
    if (!lat || !lon) return;
    setLoadingPOI(true);
    setErrorPOI(null);
    fetchCityPOIs(lat, lon)
      .then(async (data: CityPOI[]) => {
        const enriched = await enrichPOIsWithImages(data);
        const ranked = rankPOIs(enriched);
        setPois(ranked);
        setVisiblePoiCount(15);
        setLoadingPOI(false);
      })
      .catch((err: any) => {
        setErrorPOI((err?.message || String(err)).substring(0, 120));
        setLoadingPOI(false);
      });
  }, [lat, lon]);

  const retryTransit = useCallback(() => {
    if (!lat || !lon) return;
    setLoadingTransit(true);
    setErrorTransit(null);
    fetchTransitRoutes(lat, lon)
      .then((routes: TransitRoute[]) => {
        setTransitRoutes(sortTransitRoutes(routes));
        setLoadingTransit(false);
      })
      .catch((err: any) => {
        setErrorTransit((err?.message || String(err)).substring(0, 120));
        setLoadingTransit(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  const handleShowOnMap = useCallback(() => {
    if (mapRef.current && selectedPOI) {
      mapRef.current.flyTo({
        center: [selectedPOI.lon, selectedPOI.lat],
        zoom: 17,
        duration: 600,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPOI?.lon, selectedPOI?.lat]);

  const handleRouteItemPress = (route: TransitRoute) => () => {
    handleRouteTap(route);
  };

  const handlePOITap = useCallback((poi: CityPOI) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPOI(poi);

    const cached = poiDetailsCache.current[poi.osmId];
    if (cached) {
      setPoiDetails(cached);
      setLoadingPoiDetails(false);
    } else {
      setPoiDetails(null);
      setLoadingPoiDetails(true);
    }

    fetchPOIDetails(poi.osmId, poi.osmType)
      .then((data) => {
        if (data) {
          poiDetailsCache.current[poi.osmId] = data;
        }
        setPoiDetails(data);
        setLoadingPoiDetails(false);
      })
      .catch(() => {
        setLoadingPoiDetails(false);
      });

    fetchLocalizedName(poi.wikipedia).then((localName) => {
      if (localName) {
        setSelectedPOI((prev) => (prev ? { ...prev, name: localName } : prev));
      }
    });

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [poi.lon, poi.lat],
        zoom: 16,
        duration: 600,
      });
    }
  }, []);

  const handleRouteTap = async (route: TransitRoute) => {
    if (selectedRoute?.id === route.id) {
      setSelectedRoute(null);
      setToastStop(null);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRoute(route);
    setSelectedPOI(null);
    setToastStop(null);

    const osmId = parseInt(route.id.replace("r-", ""), 10);
    if (!isNaN(osmId)) {
      setLoadingRouteDetails(true);
      console.warn(`[handleRouteTap] fetching details for osmId=${osmId}`);
      const details = await fetchTransitRouteDetails(osmId);

      if (!details) {
        console.warn(`[handleRouteTap] details is null for osmId=${osmId}`);
        setLoadingRouteDetails(false);
        return;
      }

      console.warn(
        `[handleRouteTap] details: geometry=${details.geometry?.type}, coords=${(details.geometry?.coordinates as any)?.length}, stops=${details.stops?.length}`,
      );

      setSelectedRoute((prev) =>
        prev?.id === route.id
          ? { ...prev, geometry: details.geometry, stops: details.stops }
          : prev,
      );
      setLoadingRouteDetails(false);

      // Fit map to route bounds
      const coords = details.geometry?.coordinates;
      if (mapRef.current && coords && (coords as number[][]).length > 0) {
        const allCoords = coords as number[][];
        const lons = allCoords.map((c) => c[0]);
        const lats = allCoords.map((c) => c[1]);
        mapRef.current.fitBounds(
          [
            Math.min(...lons),
            Math.min(...lats),
            Math.max(...lons),
            Math.max(...lats),
          ],
          { padding: 60, duration: 600 },
        );
      }
    }
  };

  function parseRouteStations(
    name: string,
  ): { from: string; to: string } | null {
    const withoutPrefix = name.replace(/^[^:]+:\s*/, "");
    const parts = withoutPrefix.split(/\s*(?:=>|→|➔|->)\s*/);
    if (parts.length >= 2) {
      return { from: parts[0].trim(), to: parts[parts.length - 1].trim() };
    }
    return null;
  }

  const TRANSIT_TABS: {
    key: string;
    label: string;
    icon: any;
    color: string;
  }[] = [
    { key: "all", label: t("All"), icon: Route, color: theme.primary },
    {
      key: "subway",
      label: t("route_type_subway"),
      icon: RailSymbol,
      color: "#3B82F6",
    },
    {
      key: "tram",
      label: t("route_type_tram"),
      icon: TramFront,
      color: "#10B981",
    },
    {
      key: "train",
      label: t("route_type_train"),
      icon: TrainFront,
      color: "#F59E0B",
    },
    { key: "bus", label: t("route_type_bus"), icon: Bus, color: "#EF4444" },
    {
      key: "ferry",
      label: t("route_type_ferry"),
      icon: Ship,
      color: "#06B6D4",
    },
  ];

  const getPOIIcon = (type: string) => {
    switch (type) {
      case "museum":
        return <Landmark size={18} color={theme.white} />;
      case "monument":
        return <Star size={18} color={theme.white} />;
      case "artwork":
        return <Compass size={18} color={theme.white} />;
      case "attraction":
        return <Star size={18} color={theme.white} />;
      case "historic":
        return <Landmark size={18} color={theme.white} />;
      case "viewpoint":
        return <Compass size={18} color={theme.white} />;
      case "worship":
        return <Church size={18} color={theme.white} />;
      case "food":
        return <UtensilsCrossed size={18} color={theme.white} />;
      case "nightlife":
        return <Star size={18} color={theme.white} />;
      default:
        return <MapPin size={18} color={theme.white} />;
    }
  };

  const DAYS_ABBR = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const TODAY_ABBR =
    DAYS_ABBR[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const openStatus: OpenStatus | null =
    poiDetails?.openingHours || selectedPOI?.openingHours
      ? parseOpeningHours(
          poiDetails?.openingHours || selectedPOI?.openingHours || "",
        )
      : null;

  const address = [
    poiDetails?.street && poiDetails?.housenumber
      ? `${poiDetails.street} ${poiDetails.housenumber}`
      : poiDetails?.street,
    poiDetails?.postcode && poiDetails?.city
      ? `${poiDetails.postcode} ${poiDetails.city}`
      : poiDetails?.city,
  ]
    .filter(Boolean)
    .join(", ");

  const renderPOIDetail = () => {
    if (!selectedPOI) return null;

    return (
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        {selectedPOI.image && (
          <ExpoImage
            source={{ uri: selectedPOI.image }}
            style={styles.poiHero}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        )}

        {/* Header */}
        <View style={styles.poiDetailHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.poiDetailBadgeRow}>
              <View
                style={[
                  styles.poiDetailBadge,
                  { backgroundColor: theme.primaryLight },
                ]}
              >
                <Text
                  style={[styles.poiDetailBadgeText, { color: theme.primary }]}
                >
                  {selectedPOI.subtype || selectedPOI.category}
                </Text>
              </View>
              {openStatus && (
                <View
                  style={[
                    styles.poiDetailBadge,
                    { backgroundColor: openStatus.color + "20" },
                  ]}
                >
                  <View
                    style={[
                      styles.poiDetailDot,
                      { backgroundColor: openStatus.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.poiDetailBadgeText,
                      { color: openStatus.color },
                    ]}
                  >
                    {openStatus.label}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.poiDetailName}>{selectedPOI.name}</Text>
            {(selectedPOI.description || poiDetails?.description) && (
              <Text style={styles.poiDetailDesc}>
                {poiDetails?.description || selectedPOI.description}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedPOI(null);
              setPoiDetails(null);
            }}
            style={[
              styles.poiDetailClose,
              { backgroundColor: theme.cardBgSecondary },
            ]}
          >
            <X size={18} color={theme.subTextColor} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.poiActions}>
          <TouchableOpacity
            onPress={handleShowOnMap}
            style={[styles.poiPrimaryBtn, { backgroundColor: theme.primary }]}
          >
            <Navigation color="#fff" size={18} />
            <Text style={styles.poiPrimaryBtnText}>{t("Show_on_map")}</Text>
          </TouchableOpacity>
          {(selectedPOI.phone || poiDetails?.phone) && (
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(`tel:${poiDetails?.phone || selectedPOI.phone}`)
              }
              style={[
                styles.poiIconBtn,
                { backgroundColor: theme.successLight },
              ]}
            >
              <Phone color={theme.success} size={20} />
            </TouchableOpacity>
          )}
          {(selectedPOI.website || poiDetails?.website) && (
            <TouchableOpacity
              onPress={() => {
                const url = poiDetails?.website || selectedPOI.website || "";
                Linking.openURL(
                  url.startsWith("http") ? url : `https://${url}`,
                );
              }}
              style={[styles.poiIconBtn, { backgroundColor: theme.infoLight }]}
            >
              <Globe color={theme.info} size={20} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={async () => {
              await Share.share({
                message: `${selectedPOI.name}\nhttps://www.openstreetmap.org/${selectedPOI.osmType}/${selectedPOI.osmId}`,
              });
            }}
            style={[
              styles.poiIconBtn,
              { backgroundColor: theme.cardBgSecondary },
            ]}
          >
            <Share2 color={theme.primary} size={20} />
          </TouchableOpacity>
        </View>

        <View
          style={[styles.poiDivider, { backgroundColor: theme.borderColor }]}
        />

        {/* Opening Hours — collapsible table/grid */}
        {(poiDetails?.openingHours || selectedPOI?.openingHours) && (
          <View style={styles.poiSection}>
            <TouchableOpacity
              style={styles.poiSectionTitle}
              onPress={() => setHoursExpanded((v) => !v)}
              activeOpacity={0.6}
            >
              <Clock size={16} color={theme.primary} />
              <Text
                style={[
                  styles.poiSectionTitleText,
                  { color: theme.textColor, flex: 1 },
                ]}
              >
                {t("Poi_label_opening_hours")}
              </Text>
              <ChevronDown
                size={18}
                color={theme.subTextColor}
                style={{
                  transform: [{ rotate: hoursExpanded ? "180deg" : "0deg" }],
                }}
              />
            </TouchableOpacity>

            {parseOpeningHoursTable(
              poiDetails?.openingHours || selectedPOI?.openingHours || "",
            )
              .filter((row) => hoursExpanded || row.day === TODAY_ABBR)
              .map((row) => (
                <View
                  key={row.day}
                  style={[
                    styles.poiDayRow,
                    { backgroundColor: theme.cardBgSecondary },
                  ]}
                >
                  <Text style={[styles.poiDayName, { color: theme.textColor }]}>
                    {row.day}
                  </Text>
                  <View style={styles.poiDayHours}>
                    <Text
                      style={[
                        row.hours === "Closed"
                          ? styles.poiDayClosed
                          : styles.poiDayHoursText,
                        {
                          color:
                            row.hours === "Closed"
                              ? theme.subTextColor
                              : theme.textColor,
                        },
                      ]}
                    >
                      {row.hours}
                    </Text>
                  </View>
                </View>
              ))}
            {openStatus && (
              <View style={[styles.poiDayStatus, { marginTop: 8 }]}>
                <Text
                  style={[styles.poiDayStatusText, { color: openStatus.color }]}
                >
                  {openStatus.label}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Info Section — merge poiDetails on top of selectedPOI data */}
        <View style={styles.poiInfoGrid}>
          {address ? (
            <PoiInfoRow
              icon={<MapPin size={16} color={theme.primary} />}
              label={t("Poi_label_address")}
              value={address}
              onPress={() =>
                Linking.openURL(
                  `https://www.openstreetmap.org/?mlat=${selectedPOI.lat}&mlon=${selectedPOI.lon}`,
                )
              }
            />
          ) : null}
          {poiDetails?.cuisine || selectedPOI.cuisine ? (
            <PoiInfoRow
              icon={<ChefHat size={16} color={theme.warning} />}
              label={t("Poi_label_cuisine")}
              value={poiDetails?.cuisine || selectedPOI.cuisine || ""}
            />
          ) : null}
          {poiDetails?.stars || selectedPOI.stars ? (
            <PoiInfoRow
              icon={<Star size={16} color={theme.warning} />}
              label={t("Poi_label_category")}
              value={
                "★".repeat(
                  parseInt(poiDetails?.stars || String(selectedPOI.stars)),
                ) + ` (${poiDetails?.stars || selectedPOI.stars})`
              }
            />
          ) : null}
          {poiDetails?.wheelchair && (
            <PoiInfoRow
              icon={<Accessibility size={16} color={theme.info} />}
              label={t("Poi_label_accessibility")}
              value={
                poiDetails.wheelchair === "yes"
                  ? t("Poi_wheelchair_yes")
                  : poiDetails.wheelchair === "limited"
                    ? t("Poi_wheelchair_limited")
                    : t("Poi_wheelchair_no")
              }
              valueColor={
                poiDetails.wheelchair === "yes"
                  ? theme.success
                  : poiDetails.wheelchair === "limited"
                    ? theme.warning
                    : theme.danger
              }
            />
          )}
          {poiDetails?.email && (
            <PoiInfoRow
              icon={<Mail size={16} color={theme.purple} />}
              label={t("Poi_label_email")}
              value={poiDetails.email}
              onPress={() => Linking.openURL(`mailto:${poiDetails.email}`)}
            />
          )}
          {(selectedPOI.phone || poiDetails?.phone) && (
            <PoiInfoRow
              icon={<Phone size={16} color={theme.success} />}
              label={t("Poi_label_phone")}
              value={poiDetails?.phone || selectedPOI.phone || ""}
              onPress={() =>
                Linking.openURL(`tel:${poiDetails?.phone || selectedPOI.phone}`)
              }
            />
          )}
          {(selectedPOI.website || poiDetails?.website) && (
            <PoiInfoRow
              icon={<Globe size={16} color={theme.info} />}
              label={t("Poi_label_website")}
              value={poiDetails?.website || selectedPOI.website || ""}
              onPress={() =>
                Linking.openURL(
                  (poiDetails?.website || selectedPOI.website || "").startsWith(
                    "http",
                  )
                    ? poiDetails?.website || selectedPOI.website || ""
                    : `https://${poiDetails?.website || selectedPOI.website}`,
                )
              }
            />
          )}
          <PoiInfoRow
            icon={<MapPin size={16} color={theme.subTextColor} />}
            label={t("Poi_label_coordinates")}
            value={`${selectedPOI.lat.toFixed(5)}, ${selectedPOI.lon.toFixed(5)}`}
          />
          <PoiInfoRow
            icon={<Info size={16} color={theme.subTextColor} />}
            label={t("Poi_label_source")}
            value={t("Poi_osm_edit_hint")}
            onPress={() => {
              Linking.openURL(
                `https://www.openstreetmap.org/${selectedPOI.osmType}/${selectedPOI.osmId}`,
              );
            }}
          />
        </View>

        {loadingPoiDetails && (
          <View style={styles.poiLoading}>
            <ActivityIndicator color={theme.primary} size="small" />
            <Text
              style={[styles.poiLoadingText, { color: theme.subTextColor }]}
            >
              {t("Poi_loading_details")}
            </Text>
          </View>
        )}

        {!loadingPoiDetails && !poiDetails && (
          <Text style={[styles.poiNoDetails, { color: theme.subTextColor }]}>
            {t("Poi_no_details")}
          </Text>
        )}
      </ScrollView>
    );
  };

  const renderDiscoverTab = () => (
    <View style={{ flex: 1 }}>
      {loadingPOI ? (
        <CityLoadingSkeleton variant="discover" />
      ) : errorPOI ? (
        <View style={styles.errorBox}>
          <Text style={[styles.errorTitle, { color: theme.danger }]}>
            {t("Error_title_poi")}
          </Text>
          <Text style={[styles.errorMsg, { color: theme.subTextColor }]}>
            {errorPOI}
          </Text>
          <TouchableOpacity
            onPress={retryPOI}
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.retryBtnText}>{t("Retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : pois.length === 0 ? (
        <Text style={styles.emptyText}>{t("No_sights_found")}</Text>
      ) : (
        <FlashList
          data={pois.slice(0, visiblePoiCount)}
          keyExtractor={(item) => String(item.osmId)}

          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => {
            const poiColor = POI_COLORS[item.category] || "#6B7280";
            const poiBg = POI_BG_COLORS[item.category] || "#F3F4F6";
            return (
              <TouchableOpacity
                style={styles.poiCard}
                onPress={() => handlePOITap(item)}
                activeOpacity={0.85}
              >
                {item.image && !failedImages.has(item.osmId) ? (
                  <ExpoImage
                    source={{ uri: item.image }}
                    style={styles.poiCardImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    onError={() =>
                      setFailedImages((prev) => new Set(prev).add(item.osmId))
                    }
                  />
                ) : (
                  <View
                    style={[
                      styles.poiCardImage,
                      styles.poiCardPlaceholder,
                      { backgroundColor: poiBg },
                    ]}
                  >
                    {getPOIIcon(item.category)}
                  </View>
                )}
                <LinearGradient
                  colors={["transparent", "#000000cc"]}
                  start={{ x: 0, y: 0.3 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.poiCardGradient}
                >
                  <View style={styles.poiCardBadgeRow}>
                    <View
                      style={[
                        styles.poiCardBadge,
                        { backgroundColor: poiColor },
                      ]}
                    >
                      {getPOIIcon(item.category)}
                      <Text style={styles.poiCardBadgeText}>
                        {item.subtype?.replace(/_/g, " ") || item.category}
                      </Text>
                    </View>
                    {item.cuisine ? (
                      <View
                        style={[
                          styles.poiCardBadge,
                          { backgroundColor: poiColor },
                        ]}
                      >
                        <UtensilsCrossed size={10} color="#fff" />
                        <Text style={styles.poiCardBadgeText}>
                          {item.cuisine}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.poiCardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.openingHours && (
                    <Text style={styles.poiCardHours} numberOfLines={1}>
                      <Clock size={10} color="#fff" /> {item.openingHours}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            visiblePoiCount < pois.length ? (
              <TouchableOpacity
                onPress={() =>
                  setVisiblePoiCount((prev) =>
                    Math.min(prev + 10, pois.length),
                  )
                }
                style={styles.showMoreBtn}
              >
                <Text style={styles.showMoreBtnText}>
                  {t("Show_more")} ({pois.length - visiblePoiCount})
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );

  const renderTransitTab = () => (
    <View style={{ flex: 1 }}>
      {loadingTransit ? (
        <CityLoadingSkeleton variant="transit" />
      ) : errorTransit ? (
        <View style={styles.errorBox}>
          <Text style={[styles.errorTitle, { color: theme.danger }]}>
            {t("Error_title_transit")}
          </Text>
          <Text style={[styles.errorMsg, { color: theme.subTextColor }]}>
            {errorTransit}
          </Text>
          <TouchableOpacity
            onPress={retryTransit}
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.retryBtnText}>{t("Retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {(() => {
            const filtered =
              activeTransitType === "all"
                ? transitRoutes
                : transitRoutes.filter((r) =>
                    activeTransitType === "subway"
                      ? r.routeType === "subway" || r.routeType === "light_rail"
                      : r.routeType === activeTransitType,
                  );
            if (filtered.length === 0) {
              return (
                <Text style={styles.emptyText}>{t("No_transit_found")}</Text>
              );
            }
            const tab = TRANSIT_TABS.find((t) => t.key === activeTransitType);
            const title =
              activeTransitType === "all"
                ? `${t("Routes")} (${filtered.length})`
                : `${tab?.label || ""} (${filtered.length})`;
            return (
              <>
                <Text style={styles.tabTitle}>{title}</Text>
                {filtered.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.listItem,
                      selectedRoute?.id === item.id && styles.listItemActive,
                    ]}
                    onPress={handleRouteItemPress(item)}
                  >
                    <View
                      style={[
                        styles.routeColorDot,
                        { backgroundColor: item.colour },
                      ]}
                    />
                    <View style={styles.listItemText}>
                      <Text style={styles.listItemName} numberOfLines={1}>
                        {item.ref}
                      </Text>
                      <Text style={styles.listItemSub}>{item.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            );
          })()}
        </ScrollView>
      )}
    </View>
  );

  const renderTransitDetail = () => {
    if (!selectedRoute) return null;
    return (
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.poiDetailHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.poiDetailBadgeRow}>
              {selectedRoute.ref && (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: selectedRoute.colour,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: fonts.bold,
                      fontSize: 16,
                    }}
                  >
                    {selectedRoute.ref}
                  </Text>
                </View>
              )}
            </View>
            {(() => {
              const name = selectedRoute.name || "";
              const stations = parseRouteStations(name);
              if (stations) {
                return (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={[styles.poiDetailName, { flex: 1 }]}
                      numberOfLines={1}
                    >
                      {stations.from}
                    </Text>
                    <ArrowRight
                      size={16}
                      color={theme.subTextColor}
                      style={{ marginHorizontal: 6 }}
                    />
                    <Text
                      style={[
                        styles.poiDetailName,
                        { flex: 1, textAlign: "right" },
                      ]}
                      numberOfLines={1}
                    >
                      {stations.to}
                    </Text>
                  </View>
                );
              }
              return (
                <Text style={[styles.poiDetailName, { marginTop: 4 }]}>
                  {name || selectedRoute.ref}
                </Text>
              );
            })()}
          </View>
          <TouchableOpacity
            onPress={() => setSelectedRoute(null)}
            style={[
              styles.poiDetailClose,
              { backgroundColor: theme.cardBgSecondary },
            ]}
          >
            <X size={18} color={theme.subTextColor} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View
          style={[styles.poiDivider, { backgroundColor: theme.borderColor }]}
        />

        {/* Route details */}
        <View style={styles.poiSection}>
          <View
            style={[
              styles.routeColorBar,
              { backgroundColor: selectedRoute.colour },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.poiSectionTitleText, { color: theme.textColor }]}
            >
              {t("Route_info")}
            </Text>
            <Text
              style={[
                styles.poiCardHours,
                { color: theme.subTextColor, marginTop: 4 },
              ]}
            >
              {selectedRoute.name}
            </Text>
          </View>
        </View>

        {loadingRouteDetails && (
          <View style={styles.poiLoading}>
            <ActivityIndicator color={theme.primary} size="small" />
            <Text
              style={[styles.poiLoadingText, { color: theme.subTextColor }]}
            >
              {t("Poi_loading_details")}
            </Text>
          </View>
        )}

        {!loadingRouteDetails &&
          selectedRoute.stops &&
          selectedRoute.stops.length > 0 && (
            <View style={styles.poiSection}>
              <Text
                style={[
                  styles.poiSectionTitleText,
                  { color: theme.textColor, marginBottom: 10 },
                ]}
              >
                {t("Stations").replace(
                  "{count}",
                  String(selectedRoute.stops.length),
                )}{" "}
                ({selectedRoute.stops.length})
              </Text>
              {selectedRoute.stops.map((stop, i, arr) => (
                <View key={stop.osmId} style={styles.stopRow}>
                  <View style={styles.stopRowLine}>
                    <View
                      style={[
                        styles.stopDot,
                        { backgroundColor: selectedRoute.colour },
                      ]}
                    />
                    {i < arr.length - 1 && (
                      <View
                        style={[
                          styles.stopConnector,
                          { backgroundColor: selectedRoute.colour + "60" },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.stopName, { color: theme.textColor }]}
                    numberOfLines={1}
                  >
                    {stop.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
      </ScrollView>
    );
  };

  const renderInfoTab = () => (
    <View style={{ flex: 1 }}>
      {loadingArticle ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
      ) : article ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {article.thumbnail && (
            <ExpoImage
              source={{ uri: article.thumbnail }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
          )}
          {article.images.length > 0 && (
            <FlatList
              horizontal
              data={article.images.slice(0, 10)}
              keyExtractor={(_, i) => `${i}`}
              showsHorizontalScrollIndicator={false}
              style={{ marginVertical: 12 }}
              renderItem={({ item }) => (
                <ExpoImage
                  source={{ uri: item.previewUrl }}
                  style={styles.galleryImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              )}
            />
          )}
          <Text style={styles.articleText}>{article.extract}</Text>
          <TouchableOpacity
            style={styles.wikipediaBtn}
            onPress={() => {
              const wikiLang = (i18n.language || "en").split("-")[0];
              const url = `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, "_"))}`;
              Linking.openURL(url);
            }}
          >
            <Info size={16} color={theme.white} />
            <Text style={styles.wikipediaBtnText}>
              {t("Open_in_Wikipedia")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>{t("Article_not_found")}</Text>
      )}
    </View>
  );

  const tabs: { key: TabName; label: string; icon: any }[] = [
    { key: "discover", label: t("Discover"), icon: Star },
    { key: "transit", label: t("Transit"), icon: Bus },
    { key: "info", label: t("Info"), icon: Info },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <StatusBar style="dark" />
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              borderBottomRightRadius: 70,
              borderBottomLeftRadius: 70,
              overflow: "hidden",
            },
            mapStyle,
          ]}
        >
          <MapProvider>
            <Map
              ref={mapRef}
              options={{
                style: cityStyle as StyleSpecification,
                center: [lon, lat],
                zoom: 13,
                minZoom: 10,
                maxZoom: 18,
                maxTileCacheSize: 50,
                maxTileCacheZoomLevels: 2,
                refreshExpiredTiles: false,
              }}
            />
            {selectedRoute?.geometry && (
              <GeoJSONSource
                key={`route-${selectedRoute.id}`}
                id="selected-route"
                source={{
                  type: "geojson",
                  data: {
                    type: "Feature",
                    properties: {},
                    geometry: selectedRoute.geometry,
                  },
                }}
                layers={[
                  {
                    layer: {
                      id: "selected-route-line",
                      type: "line",
                      layout: {
                        "line-join": "round",
                        "line-cap": "round",
                      },
                      paint: {
                        "line-color": selectedRoute.colour,
                        "line-width": 5,
                        "line-opacity": 0.9,
                      },
                    },
                  },
                ]}
              />
            )}
            {selectedRoute?.stops?.map((stop) => (
              <Marker
                key={`stop-${stop.osmId}`}
                options={{
                  coordinate: [stop.lon, stop.lat],
                  element: {
                    innerHTML: `
                      <div style="
                        width: 12px; height: 12px;
                        background: ${selectedRoute.colour};
                        border-radius: 50%;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                        border: 2px solid white;
                      "></div>
                    `,
                  },
                }}
                listeners={{
                  click: {
                    elementListener: () => setToastStop(stop),
                  },
                }}
              />
            ))}
            {selectedPOI && (
              <Marker
                options={{
                  coordinate: [selectedPOI.lon, selectedPOI.lat],
                  element: {
                    innerHTML: `
                    <div style="
                      width: 28px; height: 28px;
                      background: radial-gradient(circle at 50% 35%, #E8751A, #B8500A);
                      border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      border: 2px solid white;
                    "></div>
                  `,
                  },
                }}
              />
            )}
          </MapProvider>
        </Animated.View>

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
            {selectedPOI || selectedRoute ? (
              <ChevronLeft size={24} color={theme.textColor} />
            ) : (
              <ArrowLeft size={24} color={theme.textColor} />
            )}
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {selectedPOI
                ? selectedPOI.name
                : selectedRoute
                  ? selectedRoute.ref || selectedRoute.name
                  : cityName}
            </Text>
            {selectedPOI ? (
              <Text style={styles.headerSub}>{selectedPOI.subtype}</Text>
            ) : country ? (
              <Text style={styles.headerSub}>{country}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={toggleFavorite} style={styles.headerBtn}>
            <Heart
              size={22}
              color={localSaved ? theme.danger : theme.subTextColor}
              fill={localSaved ? theme.danger : "transparent"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
            {selectedPOI || selectedRoute ? (
              <ChevronLeft size={24} color={theme.textColor} />
            ) : (
              <ArrowLeft size={24} color={theme.textColor} />
            )}
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {selectedPOI
                ? selectedPOI.name
                : selectedRoute
                  ? selectedRoute.ref || selectedRoute.name
                  : cityName}
            </Text>
            {selectedPOI ? (
              <Text style={styles.headerSub}>{selectedPOI.subtype}</Text>
            ) : selectedRoute ? (
              <Text style={styles.headerSub}>{selectedRoute.routeType}</Text>
            ) : country ? (
              <Text style={styles.headerSub}>{country}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={toggleFavorite} style={styles.headerBtn}>
            <Heart
              size={22}
              color={localSaved ? theme.danger : theme.subTextColor}
              fill={localSaved ? theme.danger : "transparent"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {toastStop && selectedRoute && (
        <StopToast
          stopName={toastStop.name}
          colour={selectedRoute.colour}
          onClose={() => setToastStop(null)}
          duration={4000}
        />
      )}

      {/* Bottom Panel */}
      <BottomPanel splitPosition={splitPosition}>
        {selectedPOI ? (
          renderPOIDetail()
        ) : selectedRoute ? (
          renderTransitDetail()
        ) : (
          <>
            <View
              style={[
                styles.sheetTabBar,
                { borderBottomColor: theme.borderColor },
              ]}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.sheetTab,
                      isActive && { borderBottomColor: theme.primary },
                    ]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Icon
                      size={16}
                      color={isActive ? theme.primary : theme.subTextColor}
                    />
                    <Text
                      style={[
                        styles.sheetTabLabel,
                        {
                          color: isActive ? theme.primary : theme.subTextColor,
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {activeTab === "transit" && (
              <View
                style={[
                  styles.transitTabBar,
                  { borderBottomColor: theme.borderColor },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.transitTabBarContent}
                >
                  {TRANSIT_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTransitType === tab.key;
                    const hasRoutes =
                      tab.key === "all" ||
                      transitRoutes.some(
                        (r) =>
                          r.routeType === tab.key ||
                          (tab.key === "subway" &&
                            (r.routeType === "subway" ||
                              r.routeType === "light_rail")),
                      );
                    if (!hasRoutes) return null;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        style={[
                          styles.transitTab,
                          isActive && {
                            backgroundColor: tab.color + "20",
                            borderColor: tab.color,
                          },
                        ]}
                        onPress={() => setActiveTransitType(tab.key)}
                      >
                        <Icon
                          size={14}
                          color={isActive ? tab.color : theme.subTextColor}
                        />
                        <Text
                          style={[
                            styles.transitTabLabel,
                            {
                              color: isActive ? tab.color : theme.subTextColor,
                            },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            <View style={styles.sheetContent}>
              {activeTab === "discover" && renderDiscoverTab()}
              {activeTab === "transit" && renderTransitTab()}
              {activeTab === "info" && renderInfoTab()}
            </View>
          </>
        )}
      </BottomPanel>
    </GestureHandlerRootView>
  );
}

export function PoiInfoRow({
  icon,
  label,
  value,
  onPress,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  valueColor?: string;
}) {
  const theme = useAppTheme();
  const s = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 10,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
      marginTop: 2,
    },
    label: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    val: {
      fontSize: 14,
      fontFamily: fonts.medium,
      lineHeight: 20,
    },
  });
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={s.row}
    >
      <View style={[s.iconBox, { backgroundColor: theme.cardBgSecondary }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.label, { color: theme.subTextColor }]}>{label}</Text>
        <Text
          style={[
            s.val,
            { color: valueColor ?? theme.textColor },
            onPress && { textDecorationLine: "underline" },
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { isDark, isModern, cardBg, textColor, subTextColor, primary, white } =
    theme;

  return StyleSheet.create({
    header: {
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 30,
      left: 12,
      right: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(20,20,30,0.85)" : "rgba(255,255,255,0.9)",
      borderRadius: isModern ? 20 : 16,
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 10,
      elevation: 4,
      zIndex: 100,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    headerCenter: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: textColor,
    },
    headerSub: {
      fontSize: 13,
      color: subTextColor,
      marginTop: 1,
      textTransform: "capitalize",
    },

    // Sheet tabs
    sheetTabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      paddingHorizontal: 12,
    },
    sheetTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    sheetTabLabel: {
      fontSize: 13,
      fontFamily: fonts.semibold,
    },
    sheetContent: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
    },

    // Transit sub-tabs
    transitTabBar: {
      borderBottomWidth: 1,
      paddingLeft: 12,
    },
    transitTabBarContent: {
      gap: 8,
      paddingVertical: 10,
      paddingRight: 16,
    },
    transitTab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    transitTabLabel: {
      fontSize: 12,
      fontFamily: fonts.semibold,
    },

    // POI Card
    poiCard: {
      borderRadius: isModern ? 16 : 14,
      marginBottom: 10,
      overflow: "hidden",
      height: 160,
      elevation: 3,
    },
    poiCardImage: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    poiCardPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    poiCardGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 14,
      paddingTop: 40,
      paddingBottom: 12,
      gap: 2,
    },
    poiCardBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
    poiCardBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    poiCardBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontFamily: fonts.semibold,
      textTransform: "capitalize",
    },
    poiCardName: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: "#fff",
      letterSpacing: -0.2,
    },
    poiCardHours: {
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
      marginTop: 2,
    },
    showMoreBtn: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: primary,
      alignItems: "center",
    },
    showMoreBtnText: {
      color: primary,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },

    // POI Detail
    poiHero: {
      width: "100%",
      height: 200,
    },
    poiDetailHeader: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      gap: 12,
    },
    poiDetailBadgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 6,
    },
    poiDetailBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    poiDetailDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    poiDetailBadgeText: {
      fontSize: 12,
      fontFamily: fonts.semibold,
      textTransform: "capitalize",
    },
    poiDetailName: {
      fontSize: 22,
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: textColor,
    },
    poiDetailDesc: {
      fontSize: 13,
      lineHeight: 19,
      color: subTextColor,
      marginTop: 6,
    },
    poiDetailClose: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
      marginTop: 2,
    },
    poiActions: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 10,
      marginBottom: 16,
      alignItems: "center",
    },
    poiPrimaryBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    poiPrimaryBtnText: {
      color: "#fff",
      fontFamily: fonts.bold,
      fontSize: 15,
    },
    poiIconBtn: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    poiDivider: {
      height: 1,
      marginHorizontal: 20,
      marginBottom: 12,
    },
    poiLoading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    poiLoadingText: {
      fontSize: 14,
    },
    poiSection: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    poiSectionTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    },
    poiSectionTitleText: {
      fontSize: 15,
      fontFamily: fonts.bold,
    },
    poiHoursRaw: {
      fontSize: 14,
      lineHeight: 20,
      paddingLeft: 4,
      marginBottom: 6,
    },
    poiDayRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 2,
    },
    poiDayName: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      width: 100,
    },
    poiDayHours: {
      flex: 1,
    },
    poiDayHoursText: {
      fontSize: 14,
      fontFamily: fonts.medium,
    },
    poiDayClosed: {
      fontSize: 13,
      fontFamily: fonts.medium,
    },
    poiDayStatus: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    poiDayStatusText: {
      color: "#fff",
      fontSize: 11,
      fontFamily: fonts.bold,
    },
    poiInfoGrid: {
      paddingHorizontal: 20,
      gap: 4,
      marginBottom: 16,
    },
    poiInfoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 10,
    },
    poiInfoIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
      marginTop: 2,
    },
    poiInfoLabel: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    poiInfoValue: {
      fontSize: 14,
      fontFamily: fonts.medium,
      lineHeight: 20,
    },
    poiNoDetails: {
      textAlign: "center",
      fontSize: 14,
      paddingVertical: 24,
    },

    // Transit Detail
    routeColorBar: {
      width: 4,
      borderRadius: 2,
      marginRight: 12,
    },
    stopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 2,
    },
    stopRowLine: {
      width: 24,
      alignItems: "center",
      flexShrink: 0,
      paddingTop: 4,
    },
    stopDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: white,
    },
    stopConnector: {
      width: 2,
      flex: 1,
      minHeight: 20,
    },
    stopName: {
      fontSize: 14,
      fontFamily: fonts.medium,
      paddingLeft: 8,
      paddingVertical: 6,
      flex: 1,
    },

    // Shared
    tabTitle: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: textColor,
      marginBottom: 8,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: isModern ? 14 : 12,
      marginBottom: 4,
      backgroundColor: cardBg,
    },
    listItemActive: {
      backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "#EBF5FF",
      borderWidth: 1,
      borderColor: primary + "40",
    },
    listItemIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F0F0F0",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    routeColorDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 12,
      borderWidth: 2,
      borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
    },
    listItemText: {
      flex: 1,
    },
    listItemName: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: textColor,
    },
    listItemSub: {
      fontSize: 12,
      color: subTextColor,
      marginTop: 1,
      textTransform: "capitalize",
    },
    emptyText: {
      textAlign: "center",
      color: subTextColor,
      fontSize: 14,
      marginTop: 30,
    },
    heroImage: {
      width: "100%",
      height: 160,
      borderRadius: isModern ? 16 : 12,
      marginBottom: 12,
    },
    galleryImage: {
      width: 100,
      height: 70,
      borderRadius: isModern ? 12 : 8,
      marginRight: 8,
    },
    articleText: {
      fontSize: 14,
      color: textColor,
      lineHeight: 22,
    },
    wikipediaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: primary,
      paddingVertical: 12,
      borderRadius: isModern ? 16 : 12,
      marginTop: 16,
      marginBottom: 10,
    },
    wikipediaBtnText: {
      color: white,
      fontSize: 14,
      fontFamily: fonts.bold,
    },
    errorBox: {
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 8,
    },
    errorTitle: {
      fontSize: 15,
      fontFamily: fonts.bold,
      textAlign: "center",
    },
    errorMsg: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
    },
    retryBtn: {
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 12,
    },
    retryBtnText: {
      color: white,
      fontFamily: fonts.bold,
      fontSize: 14,
    },
    sectionHeader: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginTop: 16,
      marginBottom: 6,
      paddingHorizontal: 4,
    },
  });
};
