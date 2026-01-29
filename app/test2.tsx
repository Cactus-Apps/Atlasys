import {
  MapProvider,
  Map,
  Marker,
  MapRef,
  MarkerRef,
  GeoJSONSource,
  VectorTileSource,
} from "react-native-maplibre-gl-js";
import React, { useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Modal,
  Alert,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useMemo } from "react";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { Linking } from "react-native";
import { WebView } from "react-native-webview";

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

const windowWidth = Dimensions.get("window").width;

export default function App() {
  const [query, setQuery] = useState("");
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "25%", "50%", "80%"], []);

  const [start, setStart] = useState<[number, number] | null>([9, 53]);
  const [end, setEnd] = useState<[number, number] | null>([10, 50]);
  const [BottomSheetIndex, setBottomSheetIndex] = useState<number>(-1);
  const [city, setCity] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [Info, setInfo] = useState<{
    distance: number;
    duration: number;
  } | null>();
  const [profile, setProfile] = useState<"driving" | "cycling" | "walking">(
    "driving",
  );
  const [route, setRoute] = useState<any>(null);
  const mapRef = useRef<MapRef | null>(null);
  const markerRef = useRef<MarkerRef | null>(null);
  const markerRef2 = useRef<MarkerRef | null>(null);
  const [hasfetchtOnce, sethasfetchtOnce] = useState(false);
  const [results, setResults] = useState<CityResult[]>([]);
  const [info, setinfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  const toWikiImage = (fileTitle: string) => {
    const file = fileTitle
      .replace(/^Datei:/, "")
      .replace(/^File:/, "")
      .trim();

    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
      file,
    )}?width=1200`;
  };

  const res = `https://wikipedia.org/wiki/${encodeURIComponent(city?.name)}`;

  useEffect(() => {
    if (!city?.name) return;

    const now = Date.now();
    if (now - lastFetchTime < 3000) return;
    setLastFetchTime(now);

    const fetchText = async () => {
      try {
        const res = await fetch(
          `https://de.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(
            city.name,
          )}&format=json&origin=*`,
          {
            headers: {
              "User-Agent": "GPS/1.0 (cactus_apps@proton.me)",
              Accept: "application/json",
            },
          },
        );

        const data = await res.json();
        const pageId = Object.keys(data.query.pages)[0];
        setinfo(
          data.query.pages[pageId].extract ?? "Keine Informationen gefunden.",
        );
      } catch {
        setinfo("Fehler beim Laden der Daten");
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
      setInfo({
        distance: json.routes[0].distance,
        duration: json.routes[0].duration,
      });
      fitRouteBounds();
    };

    fetchRoute().catch(console.error);
  }, [start, end, profile]);

  const imagesHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- 🔥 DAS IST DER FIX 🔥 -->
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src * data: blob: https:;"
  />

  <style>
    body {
      margin: 0;
      padding: 0;
      overflow-x: auto;
      background: transparent;
    }
    .row {
      display: flex;
      flex-direction: row;
      gap: 12px;
      padding: 10px;
    }
    img {
      height: 200px;
      border-radius: 14px;
      object-fit: cover;
    }
  </style>
</head>
<body>
  <div class="row">
    ${images.map((url) => `<img src="${url}" />`).join("")}
  </div>
</body>
</html>
`;

  const openURL = async () => {
    const supported = await Linking.canOpenURL(res);

    if (supported) {
      await Linking.openURL(res);
    } else {
      Alert.alert(`Die URL kann nicht geöffnet werden: ${res}`);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MapProvider>
        <Map
//          ref={mapRef}
//          options={{ style: "https://tiles.openfreemap.org/styles/bright" }}
        />
{/*Start and end Marker*/}        
        {/*Route*/}        
                {/*Vector Titel Soucre*/}        


        

        {Info && (
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
            <Text>{(Info.distance / 1000).toFixed(1)} km</Text>
            <Text>{(Info.duration / 60).toFixed(0)} min</Text>
          </View>
        )}
        <BottomSheet
          ref={sheetRef}
          index={BottomSheetIndex}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
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
              >
                <WebView
                  originWhitelist={["*"]}
                  source={{
                    html: imagesHtml,
                    baseUrl: "https://commons.wikimedia.org/",
                  }}
                  mixedContentMode="always"
                  allowFileAccess
                  allowUniversalAccessFromFileURLs
                  style={{ backgroundColor: "transparent" }}
                />
              </View>
            )}
            {city && <View style={{ paddingBottom: 16 }}></View>}
            <Text>{info}</Text>
            <TouchableOpacity onPress={openURL}>
              <Text style={{ color: "blue" }}> Mehr Lesen</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        </BottomSheet>
      </MapProvider>
    </GestureHandlerRootView>
  );
}
