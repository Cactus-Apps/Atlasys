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
  Camera,
  Clock,
  Phone,
  Globe,
  ChevronLeft,
  X,
  Route,
  Share2,
  Accessibility,
  ChefHat,
  Mail,
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { Image as ExpoImage } from "expo-image";
import cityStyle from "@/assets/map/city-style.json";
import { useAuthStore } from "@/lib/storage/zustand";
import { posthog } from "@/lib/config/posthog";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  fetchCityPOIs,
  fetchTransitRoutes,
  type CityPOI,
  type TransitRoute,
} from "@/lib/geocoding/cityoverpass";
import {
  fetchPOIDetails,
  parseOpeningHours,
  type OverpassPOIDetails,
  type OpenStatus,
} from "@/lib/geocoding/overpass";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomPanel, {
  SCREEN_HEIGHT,
  MIN_TOP,
  MAX_TOP,
} from "@/components/sheets_modal/BottomPanel";

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
  const styles = useMemo(
    () => getStyles(theme),
    [theme.isDark, theme.isModern],
  );

  const cityName = params.name || params.cityId || "Unknown";
  const lat = params.latitude ? parseFloat(params.latitude) : NaN;
  const lon = params.longitude ? parseFloat(params.longitude) : NaN;
  const country = params.country || "";
  const region = params.region || "";

  const [activeTab, setActiveTab] = useState<TabName>("discover");
  const [pois, setPois] = useState<CityPOI[]>([]);
  const [transitRoutes, setTransitRoutes] = useState<TransitRoute[]>([]);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loadingPOI, setLoadingPOI] = useState(true);
  const [loadingTransit, setLoadingTransit] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [errorPOI, setErrorPOI] = useState<string | null>(null);
  const [errorTransit, setErrorTransit] = useState<string | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<CityPOI | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null);
  const [localSaved, setLocalSaved] = useState(false);

  // POI detail state
  const [poiDetails, setPoiDetails] = useState<OverpassPOIDetails | null>(null);
  const [loadingPoiDetails, setLoadingPoiDetails] = useState(false);

  const isPlaceSaved = useAuthStore((s) => s.isPlaceSaved);
  const addPlace = useAuthStore((s) => s.addPlace);
  const removePlace = useAuthStore((s) => s.removePlace);

  const poiDetailsCache = useRef<Record<number, OverpassPOIDetails>>({});
  const splitPosition = useSharedValue(0.5);
  const mapStyle = useAnimatedStyle(() => ({
    bottom: (1 - splitPosition.value) * SCREEN_HEIGHT,
  }));

  useEffect(() => {
    setLocalSaved(isPlaceSaved(cityName));
  }, [cityName]);

  useEffect(() => {
    if (!lat || !lon) return;
    let cancelled = false;
    setLoadingPOI(true);
    setErrorPOI(null);
    fetchCityPOIs(lat, lon)
      .then((data: CityPOI[]) => {
        if (!cancelled) {
          setPois(data);
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
    setLoadingTransit(true);
    setErrorTransit(null);
    fetchTransitRoutes(lat, lon)
      .then((routes: TransitRoute[]) => {
        if (!cancelled) {
          setTransitRoutes(routes);
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
                  `https://${wikiLang}.wikipedia.org/w/api.php?action=query&titles=${titlesQuery}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=600&format=json&origin=*`,
                  { headers, signal: controller.signal },
                );
                const iiData = await iiRes.json();
                if (iiData.query?.pages) {
                  Object.values(iiData.query.pages).forEach((p: any) => {
                    const info = p.imageinfo?.[0];
                    if (
                      info?.url &&
                      (info.url.endsWith(".jpg") ||
                        info.url.endsWith(".png") ||
                        info.url.endsWith(".jpeg"))
                    ) {
                      imageUrls.push({
                        previewUrl: info.thumburl || info.url,
                        fullUrl: info.url,
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
  }, [cityName]);

  const handleBack = () => {
    if (selectedPOI) {
      setSelectedPOI(null);
      return;
    }
    router.back();
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
      posthog.capture("city_saved", { city: cityName });
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
      .then((data: CityPOI[]) => {
        setPois(data);
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
        setTransitRoutes(routes);
        setLoadingTransit(false);
      })
      .catch((err: any) => {
        setErrorTransit((err?.message || String(err)).substring(0, 120));
        setLoadingTransit(false);
      });
  }, [lat, lon]);

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

    fetchPOIDetails(poi.osmId)
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

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [poi.lon, poi.lat],
        zoom: 16,
        duration: 600,
      });
    }
  }, []);

  const handleRouteTap = (route: TransitRoute) => {
    if (selectedRoute?.id === route.id) {
      setSelectedRoute(null);
      return;
    }
    setSelectedRoute(route);
    setSelectedPOI(null);

    if (mapRef.current && route.geometry) {
      const coords =
        route.geometry.type === "LineString"
          ? route.geometry.coordinates
          : route.geometry.coordinates.flat();
      if (coords.length > 0) {
        const lons = coords.map((c: any) => c[0]);
        const lats = coords.map((c: any) => c[1]);
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

  const openStatus: OpenStatus | null = poiDetails?.openingHours
    ? parseOpeningHours(poiDetails.openingHours)
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
        {(selectedPOI.image) && (
          <ExpoImage
            source={{ uri: selectedPOI.image }}
            style={styles.poiHero}
            contentFit="cover"
            transition={300}
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
            {poiDetails?.description && (
              <Text style={styles.poiDetailDesc}>{poiDetails.description}</Text>
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
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({
                  center: [selectedPOI.lon, selectedPOI.lat],
                  zoom: 17,
                  duration: 600,
                });
              }
            }}
            style={[styles.poiPrimaryBtn, { backgroundColor: theme.primary }]}
          >
            <Navigation color="#fff" size={18} />
            <Text style={styles.poiPrimaryBtnText}>{t("Show_on_map")}</Text>
          </TouchableOpacity>
          {poiDetails?.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${poiDetails.phone}`)}
              style={[
                styles.poiIconBtn,
                { backgroundColor: theme.successLight },
              ]}
            >
              <Phone color={theme.success} size={20} />
            </TouchableOpacity>
          )}
          {poiDetails?.website && (
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  poiDetails.website!.startsWith("http")
                    ? poiDetails.website!
                    : `https://${poiDetails.website}`,
                )
              }
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

        {!loadingPoiDetails && poiDetails && (
          <>
            {/* Opening Hours */}
            {selectedPOI.openingHours && (
              <View style={styles.poiSection}>
                <View style={styles.poiSectionTitle}>
                  <Clock size={16} color={theme.primary} />
                  <Text
                    style={[
                      styles.poiSectionTitleText,
                      { color: theme.textColor },
                    ]}
                  >
                    {t("Poi_label_opening_hours")}
                  </Text>
                </View>
                <Text style={[styles.poiHoursRaw, { color: theme.textColor }]}>
                  {selectedPOI.openingHours}
                </Text>
                {openStatus && (
                  <View style={styles.poiDayStatus}>
                    <Text
                      style={[
                        styles.poiDayStatusText,
                        { color: openStatus.color },
                      ]}
                    >
                      {openStatus.label}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Info Section */}
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
              {poiDetails.cuisine && (
                <PoiInfoRow
                  icon={<ChefHat size={16} color={theme.warning} />}
                  label={t("Poi_label_cuisine")}
                  value={poiDetails.cuisine}
                />
              )}
              {poiDetails.stars && (
                <PoiInfoRow
                  icon={<Star size={16} color={theme.warning} />}
                  label={t("Poi_label_category")}
                  value={
                    "★".repeat(parseInt(poiDetails.stars)) +
                    ` (${poiDetails.stars})`
                  }
                />
              )}
              {poiDetails.wheelchair && (
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
              {poiDetails.email && (
                <PoiInfoRow
                  icon={<Mail size={16} color={theme.purple} />}
                  label={t("Poi_label_email")}
                  value={poiDetails.email}
                  onPress={() => Linking.openURL(`mailto:${poiDetails.email}`)}
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
          </>
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
        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
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
        <FlatList
          data={pois}
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
                {item.image ? (
                  <ExpoImage
                    source={{ uri: item.image }}
                    style={styles.poiCardImage}
                    contentFit="cover"
                    transition={200}
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
        />
      )}
    </View>
  );

  const renderTransitTab = () => (
    <View style={{ flex: 1 }}>
      {loadingTransit ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
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
      ) : transitRoutes.length === 0 ? (
        <Text style={styles.emptyText}>{t("No_transit_found")}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.tabTitle}>
            {t("Routes")} ({transitRoutes.length})
          </Text>
          {transitRoutes.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.listItem,
                selectedRoute?.id === item.id && styles.listItemActive,
              ]}
              onPress={() => handleRouteTap(item)}
            >
              <View
                style={[styles.routeColorDot, { backgroundColor: item.colour }]}
              />
              <View style={styles.listItemText}>
                <Text style={styles.listItemName} numberOfLines={1}>
                  {item.ref}
                </Text>
                <Text style={styles.listItemSub}>
                  {item.name} · {item.routeType}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

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
                key={selectedRoute.id}
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
            {selectedPOI ? (
              <ChevronLeft size={24} color={theme.textColor} />
            ) : (
              <ArrowLeft size={24} color={theme.textColor} />
            )}
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {selectedPOI ? selectedPOI.name : cityName}
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
            {selectedPOI ? (
              <ChevronLeft size={24} color={theme.textColor} />
            ) : (
              <ArrowLeft size={24} color={theme.textColor} />
            )}
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {selectedPOI ? selectedPOI.name : cityName}
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
      </View>

      {/* Bottom Panel */}
      <BottomPanel splitPosition={splitPosition}>
        {selectedPOI ? (
          renderPOIDetail()
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

function PoiInfoRow({
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
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    val: {
      fontSize: 14,
      fontWeight: "500",
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
  const {
    isDark,
    isModern,
    cardBg,
    textColor,
    subTextColor,
    primary,
    white,
    black,
  } = theme;

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
      fontWeight: "800",
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
      fontWeight: "600",
    },
    sheetContent: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
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
      fontWeight: "600",
      textTransform: "capitalize",
    },
    poiCardName: {
      fontSize: 17,
      fontWeight: "800",
      color: "#fff",
      letterSpacing: -0.2,
    },
    poiCardHours: {
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
      marginTop: 2,
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
      fontWeight: "600",
      textTransform: "capitalize",
    },
    poiDetailName: {
      fontSize: 22,
      fontWeight: "700",
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
      fontWeight: "700",
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
      fontWeight: "700",
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
      fontWeight: "600",
      width: 100,
    },
    poiDayHours: {
      flex: 1,
    },
    poiDayHoursText: {
      fontSize: 14,
      fontWeight: "500",
    },
    poiDayClosed: {
      fontSize: 13,
      fontWeight: "500",
    },
    poiDayStatus: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    poiDayStatusText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
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
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    poiInfoValue: {
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
    },
    poiNoDetails: {
      textAlign: "center",
      fontSize: 14,
      paddingVertical: 24,
    },

    // Shared
    tabTitle: {
      fontSize: 15,
      fontWeight: "700",
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
      fontWeight: "600",
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
      fontWeight: "700",
    },
    errorBox: {
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 8,
    },
    errorTitle: {
      fontSize: 15,
      fontWeight: "700",
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
      fontWeight: "700",
      fontSize: 14,
    },
  });
};
