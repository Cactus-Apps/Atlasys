import * as Location from "expo-location";
import { Search, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import Modal from "react-native-modal";
import { Button } from "react-native-paper";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview";
import "./i18n.js";


const { width, height } = Dimensions.get("window");

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST;
const API_KEY = process.env.EXPO_PUBLIC_MAP_TILER_API_KEY || "";

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
  const webRef = useRef<WebView | null>(null);
  const [query, setQuery] = useState("");
  const lastLocRef = useRef<Location.LocationObject | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<Location.LocationSubscription | null>(null);
  const scheme = useColorScheme();
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState<CityResult[]>([]);
  const [selected, setSelected] = useState<CityResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => searchCities(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  async function searchCities(q: string) {
    setLoadingSearch(true);
    try {
      const url = `https://${RAPIDAPI_HOST}/v1/geo/cities?namePrefix=${encodeURIComponent(
        q
      )}&limit=8&sort=-population`;
      const resp = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY ?? "",
          "X-RapidAPI-Host": RAPIDAPI_HOST ?? "",
        },
      });
      if (!resp.ok) {
        console.warn("GeoDB error", resp.status);
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
      console.error("Search error", err);
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }


  function onSelectCity(city: CityResult) {
    setSelected(city);
    setModalVisible(true);
    Keyboard.dismiss();

    const payload = {
      type: "goto",
      lat: city.latitude,
      lng: city.longitude,
      zoom: 12,
      title: city.name ?? city.city,
      subtitle: `${city.region ? city.region + ", " : ""}${city.country}`,
    };
    webRef.current?.postMessage(JSON.stringify(payload));
    setResults([]);
    setQuery(city.name ?? city.city);
  }

  const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    html,body,#map { height:100%; margin:0; }
    .marker-accuracy { color:#555; background:rgba(255, 255, 255, 0.85); padding:2px 6px; border-radius:4px; font:12px/1.2 system-ui,sans-serif; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([0,0], 2);

    let tilelayer =
    L.tileLayer("https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${API_KEY}", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://www.maptiler.com/">MapTiler</a>',
      maxZoom: 20
    }).addTo(map);

    const pinSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2b6cb0" d="M12 2c-3.866 0-7 3.134-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>');
    const pinIcon = L.icon({
      iconUrl: 'data:image/svg+xml;utf8,' + pinSvg,
      iconSize: [32, 32],
      iconAnchor: [16, 32],   
      popupAnchor: [0, -28]
    });

    let marker = null, accuracyCircle = null;

    function goto(lat, lng, zoom, title, subtitle) {
        map.setView([lat, lng], zoom || 12);
        if (!tempMarker) {
          tempMarker = L.marker([lat, lng]).addTo(map);
        } else {
          tempMarker.setLatLng([lat, lng]);
        }
        const popupHtml = '<b>' + (title||'Ort') + '</b><br/>' + (subtitle||'');
        if (tempMarker.getPopup()) tempMarker.setPopupContent(popupHtml);
        else tempMarker.bindPopup(popupHtml);
        tempMarker.openPopup();
      }

      document.addEventListener('message', function(e) {
        try {
          const d = JSON.parse(e.data);
          if (d && d.type === 'goto') {
            goto(d.lat, d.lng, d.zoom, d.title, d.subtitle);
          }
        } catch (err) {}
      });

    function handleIncoming(evt){
      const raw = evt && (evt.data || (evt.originalEvent && evt.originalEvent.data));
      if (!raw) return;
      let data = null;
      try { data = JSON.parse(raw); } catch(_) { return; }

      const c = data.coords || data; // toleranter Parser
      if (!c || typeof c.latitude !== 'number' || typeof c.longitude !== 'number') return;

      const lat = c.latitude, lng = c.longitude, acc = c.accuracy;

      if (!marker) {
        marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
        marker.bindTooltip('<div class="marker-accuracy">You are here</div>');
        map.setView([lat, lng], 16, { animate: true });
      } else {
        marker.setLatLng([lat, lng]);
      }

      if (acc) {
        if (!accuracyCircle) {
          accuracyCircle = L.circle([lat, lng], { radius: acc, weight: 1, fillOpacity: 0.1 });
          accuracyCircle.addTo(map);
        } else {
          accuracyCircle.setLatLng([lat, lng]);
          accuracyCircle.setRadius(acc);
        }
      }
    }

    window.addEventListener('message', handleIncoming);
    document.addEventListener('message', handleIncoming);
    window.addEventListener('message', function(e) {
        try {
          const d = JSON.parse(e.data);
          if (d && d.type === 'goto') {
            goto(d.lat, d.lng, d.zoom, d.title, d.subtitle);
          }
        } catch (err) {}
      });

    window.onload = () => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ ready: true }));
      }
    };
  </script>
</body>
</html>
  `;

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
          if (ready && webRef.current) {
            webRef.current.postMessage(JSON.stringify(loc));
          }
        }
      );
      if (!cancelled) setSub(s);
    })().catch((e: any) => setError(e?.message ?? "Unknown error"));

    return () => {
      cancelled = true;
      sub?.remove();
      setSub(null);
    };
  }, [ready]);

  const onWebMessage = (e: any) => {
    let msg: any = null;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {}
    if (msg?.ready) {
      setReady(true);
      if (lastLocRef.current && webRef.current) {
        webRef.current.postMessage(JSON.stringify(lastLocRef.current));
      }
    }
  };

  const clearInput = () => {
    setQuery("");
    !modalVisible;
  };

  return ( 
    <View style={styles.container2}>
      <View style={styles.searchContainer}>
        <Search
          size={25}
          strokeWidth={3}
          color={scheme === "dark" ? "#d8d8d8ff" : "#666"}
          style={styles.icon}
        />
        <TextInput
          placeholder="Search"
          placeholderTextColor={scheme === "dark" ? "#d8d8d8ff" : "#666"}
          style={styles.input}
          value={query}
          onChangeText={(value) => setQuery(value)}
        />
        {loadingSearch && query.length > 0 ? (
          <></>
        ) : (
          <Button onPress={clearInput}>
            <X
              size={25}
              strokeWidth={3}
              color={scheme === "dark" ? "#d8d8d8ff" : "#666"}
              style={styles.loader}
            />
          </Button>
        )}
        {loadingSearch && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>

      {results.length > 0 && !modalVisible && (
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

      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: leafletHTML }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={onWebMessage}
        mixedContentMode="compatibility"
      />
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
        coverScreen={false}
      >
        <View style={styles.modalContent}>
          {selected ? (
            <>
              <Text style={styles.cityTitle}>
                {selected.name ?? selected.city}
              </Text>
              <Text style={styles.citySub}>
                {selected.region ? selected.region + ", " : ""}
                {selected.country}
              </Text>
              <Text style={styles.cityCoords}>
                {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
              </Text>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#fff" }}>Schließen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text>Kein Ort ausgewählt</Text>
          )}
        </View>
      </Modal>
      <Toast />
    </View>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    icon: {
      marginLeft: 13,
    },
    container2: { flex: 1 },
    searchContainer: {
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 40,
      left: 12,
      right: 12,
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      backgroundColor: scheme === "dark" ? "#24262E" : "#d8d8d8ff",
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    input: {
      flex: 1,
      height: 44,
      paddingHorizontal: 12,
      color: scheme === "dark" ? "#fff" : "#000",
    },
    loader: {
      position: "absolute",
      right: 18,
    },
    suggestionBox: {
      position: "absolute",
      top: Platform.OS === "ios" ? 100 : 83,
      left: 12,
      right: 12,
      maxHeight: 220,
      backgroundColor: scheme === "dark" ? "#24262E" : "#d8d8d8ff",
      borderRadius: 8,
      zIndex: 25,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
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
    modal: {
      justifyContent: "flex-end",
      margin: 0,
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: 20,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      alignItems: "center",
    },
    cityTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
    citySub: { fontSize: 14, color: "#555" },
    cityCoords: { marginTop: 8, color: "#666" },
    closeButton: {
      marginTop: 14,
      backgroundColor: "#e53935",
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 8,
    },
  });