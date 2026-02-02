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
  Search,
  X,
  Heart,
  Share2,
  Navigation,
  Layers,
  Shuffle,
  History,
  Star,
  BookOpen,
  Box,
  Compass,
  ImageIcon,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  LocateFixed,
  MapPin,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
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
  Modal,
  Pressable,
  Share,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";

import { Avatar } from "@kolking/react-native-avatar";
import { supabase } from "@/lib/auth/supabase";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  GestureHandlerRootView,
  FlatList as GHFlatList,
} from "react-native-gesture-handler";
import { LoadingOverlay } from "@/components/LoadingOverlay";

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
  extract: string;
  thumbnail: string | null;
  images: string[];
}

export default function MapScreen() {
  const mapRef = useRef<MapRef | null>(null);
  const userMarkerRef = useRef<MarkerRef | null>(null);
  const startMarkerRef = useRef<MarkerRef | null>(null);
  const endMarkerRef = useRef<MarkerRef | null>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const [pitch, setPitch] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [route, setRoute] = useState<any>(null);
  const hasCenteredOnce = useRef(false);
  const [profile, setProfile] = useState<"driving" | "cycling" | "walking">(
    "driving",
  );
  const [DistanceInfo, setDistanceInfo] = useState<{
    distance: number;
    duration: number;
  } | null>();
  const [MapStyle, setMapStyle] = useState(
    "https://tiles.openfreemap.org/styles/bright",
  );
  const [error, setError] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState<string | undefined>();
  const [markerPos, setMarkerPos] = useState<[number, number]>();
  const [city, setCity] = useState<SelectedCity | null>(null);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [BottomSheetIndex, setBottomSheetIndex] = useState<number>(-1);
  const [results, setResults] = useState<CityResult[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [savedLocations, setSavedLocations] = useState<SelectedCity[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [mapThemeIndex, setMapThemeIndex] = useState(0);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(
    null,
  );

  const mapThemes = [
    "https://tiles.openfreemap.org/styles/bright",
    "https://tiles.openfreemap.org/styles/dark",
    "https://tiles.openfreemap.org/styles/liberty",
  ];

  const teleportCities = [
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "Tokyo", lat: 35.6895, lon: 139.6917 },
    { name: "New York", lat: 40.7128, lon: -74.006 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    { name: "Berlin", lat: 52.52, lon: 13.405 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Rome", lat: 41.9028, lon: 12.4964 },
  ];

  const snapPoints = useMemo(() => ["15%", "25%", "50%", "80%"], []);
  const scheme = useColorScheme();
  const styles = getStyles(scheme === "dark" ? "dark" : "light");

  const { t } = useTranslation();

  const filters = [
    "Restaurants",
    "Cafés",
    "Hotels",
    "Sehenswürdigkeiten",
    "Bars",
    "Shopping",
  ];

  // Location/GPS Tracking
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location authorization denied");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy:
            Platform.OS === "android"
              ? Location.Accuracy.Balanced
              : Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setMarkerPos([longitude, latitude]);

          if (!hasCenteredOnce.current && mapRef.current) {
            hasCenteredOnce.current = true;
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              duration: 1000,
            });
            ensureGlobe();
          }
        },
      );
    };

    startLocationTracking().catch((e) =>
      setError(e?.message ?? "Unknown location error"),
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  // User Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      setEmail(data?.user?.email);
    });
  }, []);

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
    setArticle(null);
    setBottomSheetIndex(-1);
    sheetRef.current?.close();
  };

  const resetToNorth = () => {
    mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 });
    setPitch(false);
  };

  const resetPitch = () => {
    const nextPitch = !pitch;
    mapRef.current?.easeTo({ pitch: nextPitch ? 60 : 0, duration: 500 });
    setPitch(nextPitch);
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

  const openDirections = () => {
    if (!city) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = Platform.select({
      ios: `maps://0,0?q=${city.latitude},${city.longitude}(${city.name})`,
      android: `geo:0,0?q=${city.latitude},${city.longitude}(${city.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const nextTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = (mapThemeIndex + 1) % mapThemes.length;
    setMapThemeIndex(next);
    setMapStyle(mapThemes[next]);
  };

  const discoverRandom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const randomCity =
      teleportCities[Math.floor(Math.random() * teleportCities.length)];
    onSelectCity({
      id: randomCity.name,
      city: randomCity.name,
      name: randomCity.name,
      latitude: randomCity.lat,
      longitude: randomCity.lon,
      country: "Teleportation",
    });
  };

  const headers = {
    "User-Agent": "GPS/1.0 (test@gmail.com)",
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
        // 1. Search for best title
        const searchRes = await fetch(
          `https://de.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(city.name)}&limit=1&format=json&origin=*`,
          { headers },
        );
        const searchData = await searchRes.json();

        if (!searchData[1]?.[0]) {
          setError("Kein Artikel gefunden.");
          return;
        }
        const pageTitle = searchData[1][0];

        // 2. Fetch extract and main thumbnail (representative image)
        const extractRes = await fetch(
          `https://de.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&piprop=thumbnail&pithumbsize=1000&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`,
          { headers },
        );
        const extractData = await extractRes.json();
        const pages = extractData.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId].extract;
        const thumbnail = pages[pageId].thumbnail?.source || null;
        // 3. Fetch image titles in exact article order using Parse API
        const parseRes = await fetch(
          `https://de.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=images&format=json&origin=*`,
          { headers },
        );
        const parseData = await parseRes.json();
        const imageTitles =
          parseData.parse?.images?.map((img: string) => `Datei:${img}`) || [];

        let imageUrls: string[] = [];
        const isJunk = (url: string) => {
          const lower = url.toLowerCase();
          return (
            lower.includes("flag") ||
            lower.includes("wappen") ||
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
          // We split into chunks if necessary, but 50 is usually enough for a single request
          const titlesChunk = imageTitles
            .slice(0, 50)
            .map((t: string) => encodeURIComponent(t))
            .join("|");
          const imagesInfoRes = await fetch(
            `https://de.wikipedia.org/w/api.php?action=query&titles=${titlesChunk}&prop=imageinfo&iiprop=url&format=json&origin=*`,
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

            // Filter and maintain order. Note: parse api returns titles without 'Datei:' prefix,
            // but query API returns them with it. We prepended 'Datei:' above.
            const uniqueUrls = new Set<string>();
            imageTitles.forEach((title: string) => {
              const url = urlMap[title];
              if (
                url &&
                !isJunk(url) &&
                (url.endsWith(".jpg") ||
                  url.endsWith(".png") ||
                  url.endsWith(".jpeg"))
              ) {
                uniqueUrls.add(url);
              }
            });
            imageUrls = Array.from(uniqueUrls);
          }
        }

        // Smarter Thumbnail Selection: If the default thumbnail is junk, use the first gallery image
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
        setError("Fehler beim Laden der Wikipedia-Daten.");
      } finally {
        setLoading(false);
      }
    };

    const now = Date.now();
    if (now - lastFetchTime < 1000) return;
    setLastFetchTime(now);
    fetchWikipediaData();
  }, [city?.name]);

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

  const flyToUser = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({});
    mapRef.current?.flyTo({
      center: [loc.coords.longitude, loc.coords.latitude],
      zoom: 14,
      duration: 1500,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Search logic
  async function searchCities(q: string) {
    if (!q || q.length < 2) return;
    setLoadingSearch(true);
    try {
      const url = `https://${RAPIDAPI_HOST}/v1/geo/cities?namePrefix=${encodeURIComponent(q)}&limit=8&sort=-population`;
      const resp = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY ?? "",
          "X-RapidAPI-Host": RAPIDAPI_HOST ?? "",
        },
      });
      if (!resp.ok) {
        setResults([]);
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
      console.error(err);
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => searchCities(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  function onSelectCity(cityRes: CityResult) {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    setQuery(cityRes.name ?? cityRes.city);
    setResults([]);

    // Add to history
    setSearchHistory((prev) => {
      const filtered = prev.filter((q) => q !== (cityRes.name ?? cityRes.city));
      return [cityRes.name ?? cityRes.city, ...filtered].slice(0, 5);
    });

    setCity({
      name: cityRes.name ?? cityRes.city,
      latitude: cityRes.latitude,
      longitude: cityRes.longitude,
      region: cityRes.region,
      country: cityRes.country,
    });

    mapRef.current?.flyTo({
      center: [cityRes.longitude, cityRes.latitude],
      zoom: 12,
      duration: 1500,
    });

    setBottomSheetIndex(2);
    sheetRef.current?.snapToIndex(2);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MapProvider>
        <Map
          ref={mapRef}
          options={{
            style: MapStyle,
            center: markerPos || [0, 0],
            zoom: 12,
          }}
          listeners={{
            mount: { rnListener: ensureGlobe },
          }}
        />

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

        {markerPos && (
          <Marker
            ref={userMarkerRef}
            options={{
              coordinate: markerPos,
              element: {
                innerHTML: `
                  <div style="width: 20px; height: 20px; background: #007AFF; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
                `,
              },
            }}
          />
        )}

        {/* Feature Layer for Cities */}
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
                layout: { "text-field": ["get", "name"], "text-size": 12 },
              },
              listeners: {
                click: async (e: any) => {
                  const features = await mapRef.current?.queryRenderedFeatures(
                    e.point,
                    { layers: ["cities-layer"] },
                  );
                  if (!features?.length) return;
                  const f = features[0];
                  if (f.geometry.type !== "Point") return;
                  setCity({
                    name: f.properties?.name ?? "Unbekannt",
                    latitude: f.geometry.coordinates[1],
                    longitude: f.geometry.coordinates[0],
                  });
                  setBottomSheetIndex(2);
                  sheetRef.current?.snapToIndex(2);
                },
              },
            },
          ]}
        />

        {/* UI Elements */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <View style={styles.searchRow}>
              <Search size={22} color="#667" />
              <TextInput
                placeholder={t("Search") || "Suchen..."}
                placeholderTextColor={scheme === "dark" ? "#bbb" : "#667"}
                style={styles.input}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={clearInput}>
                  <X size={18} color="#667" />
                </TouchableOpacity>
              )}
              {loadingSearch && (
                <ActivityIndicator size="small" style={{ marginLeft: 8 }} />
              )}

              <View style={styles.avatarView}>
                <Avatar
                  size={34}
                  name={email}
                  email={email}
                  colorize
                  radius={100}
                />
              </View>
            </View>
          </View>

          {query.length === 0 && searchHistory.length > 0 && (
            <Animated.View entering={FadeInDown} style={styles.suggestionBox}>
              <View style={styles.historyHeader}>
                <History size={16} color="#888" />
                <Text style={styles.historyHeaderText}>Zuletzt gesucht</Text>
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

          {results.length > 0 && (
            <Animated.View entering={FadeInUp} style={styles.suggestionBox}>
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
                      {item.region ? `${item.region}, ` : ""}
                      {item.country}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </Animated.View>
          )}

          {!results.length && !query && (
            <Animated.View
              entering={FadeInDown.delay(200)}
              style={styles.filterOuter}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {filters.map((f, i) => (
                  <TouchableOpacity
                    key={f}
                    style={styles.filterChip}
                    onPress={() => {
                      setQuery(f);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.filterChipText}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={flyToUser}>
            <LocateFixed color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={discoverRandom}
          >
            <Shuffle color="#fff" size={24} />
          </TouchableOpacity>
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

        {/* Wikipedia BottomSheet */}
        {city && (
          <BottomSheet
            ref={sheetRef}
            index={BottomSheetIndex}
            snapPoints={snapPoints}
            enablePanDownToClose
            onChange={setBottomSheetIndex}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleContainer}>
                <MapPin color="#007AFF" size={24} />
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={styles.sheetTitle}>{city.name}</Text>
                    {weather && (
                      <View style={styles.weatherBadge}>
                        {getWeatherIcon(weather.code)}
                        <Text style={styles.weatherText}>{weather.temp}°C</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sheetSubtitle}>
                    {city.region ? `${city.region}, ` : ""}
                    {city.country}
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={toggleFavorite}
                  style={styles.actionIconButton}
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
                  style={styles.actionIconButton}
                >
                  <Share2 color="#007AFF" size={24} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={openDirections}
                  style={styles.actionIconButton}
                >
                  <Navigation color="#007AFF" size={24} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.closeIconBtn}
                >
                  <X color="#333" size={24} />
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <LoadingOverlay />
            ) : (
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
                  {article?.images && article.images.length > 0 && (
                    <View style={styles.imageSection}>
                      <View style={styles.sectionHeader}>
                        <ImageIcon color="#007AFF" size={18} />
                        <Text style={styles.sectionTitle}>
                          Bilder ({article.images.length})
                        </Text>
                      </View>
                      <GHFlatList
                        horizontal
                        data={article.images}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item}
                        renderItem={({ item, index }) => (
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

                  <Text style={styles.extractText}>
                    {article?.extract || "Wird geladen..."}
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
      </MapProvider>
    </GestureHandlerRootView>
  );
}

const getStyles = (theme: "light" | "dark") =>
  StyleSheet.create({
    searchWrapper: {
      position: "absolute",
      top: Platform.OS === "ios" ? 60 : 40,
      left: 16,
      right: 16,
      zIndex: 100,
    },
    searchContainer: {
      backgroundColor: theme === "dark" ? "#24262E" : "#fff",
      borderRadius: 15,
      paddingHorizontal: 12,
      height: 50,
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
      color: theme === "dark" ? "#fff" : "#333",
    },
    avatarView: {
      marginLeft: 10,
    },
    suggestionBox: {
      marginTop: 5,
      backgroundColor: theme === "dark" ? "#24262E" : "#fff",
      borderRadius: 12,
      maxHeight: 250,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    suggestionItem: {
      padding: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#eee",
    },
    suggTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme === "dark" ? "#fff" : "#333",
    },
    suggSub: {
      fontSize: 13,
      color: "#888",
      marginTop: 2,
    },
    controlsContainer: {
      position: "absolute",
      bottom: 100,
      right: 16,
      gap: 12,
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
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#eee",
    },
    sheetTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#1a1a1a",
    },
    sheetSubtitle: {
      fontSize: 13,
      color: "#666",
    },
    extractText: {
      fontSize: 16,
      lineHeight: 24,
      color: "#444",
      textAlign: "justify",
    },
    imageSection: {
      marginBottom: 25,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#1a1a1a",
    },
    imageList: {
      paddingRight: 10,
    },
    imageWrapper: {
      width: width * 0.7,
      height: 180,
      marginRight: 15,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#eee",
    },
    image: {
      width: "100%",
      height: "100%",
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
    // Modal & Fullscreen Gallery
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
      width: width,
      height: height,
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenImageWrapper: {
      width: width,
      height: height,
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenImage: {
      width: width,
      height: height * 0.8,
    },
    closeButton: {
      position: "absolute",
      top: 50,
      right: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: 10,
      borderRadius: 25,
      zIndex: 100,
    },
    // Hero Image
    heroImageContainer: {
      width: "100%",
      height: 250,
      backgroundColor: "#f0f0f0",
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
    },
    actionIconButton: {
      padding: 5,
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
    },
    filterOuter: {
      marginTop: 10,
    },
    filterScroll: {
      paddingRight: 20,
    },
    filterChip: {
      backgroundColor: theme === "dark" ? "#24262E" : "#fff",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
    },
    filterChipText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme === "dark" ? "#fff" : "#333",
    },
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
  });
