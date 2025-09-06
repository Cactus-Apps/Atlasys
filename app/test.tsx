import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

export default function App() {
  const webref = useRef<WebView>(null);
  const lastLocRef = useRef<Location.LocationObject | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<Location.LocationSubscription | null>(null);

  // Leaflet + eigener SVG-Pin (damit kein Asset-Pfad-Problem entsteht)
  const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    html,body,#map { height:100%; margin:0; }
    .marker-accuracy { color:#555; background:rgba(255,255,255,.85); padding:2px 6px; border-radius:4px; font:12px/1.2 system-ui,sans-serif; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([0,0], 2);
    // 👉 hier kannst du den Stil austauschen (Carto, Stamen, MapTiler ...)
    L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=0I4OJd1qI6EDbqGbnHgZ', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://www.maptiler.com/">MapTiler</a>',
      maxZoom: 20

    }).addTo(map);

    // Eigenes SVG-Icon (blaue Träne)
    const pinSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2b6cb0" d="M12 2c-3.866 0-7 3.134-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>');
    const pinIcon = L.icon({
      iconUrl: 'data:image/svg+xml;utf8,' + pinSvg,
      iconSize: [32, 32],
      iconAnchor: [16, 32],   // Spitze unten mittig
      popupAnchor: [0, -28]
    });

    let marker = null, accuracyCircle = null;

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
        marker.bindTooltip('<div class="marker-accuracy">Du bist hier</div>');
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

    // RN ➜ WebView Nachrichten (Android & iOS)
    window.addEventListener('message', handleIncoming);
    document.addEventListener('message', handleIncoming);

    // WebView ➜ RN: "bereit"
    window.onload = () => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ ready: true }));
      }
    };
  </script>
</body>
</html>
  `;

  // Startet Standort-Tracking (läuft unabhängig davon, ob die Map schon "ready" ist)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Standortberechtigung verweigert.");
        return;
      }

      const s = await Location.watchPositionAsync(
        {
          accuracy: Platform.OS === "android" ? Location.Accuracy.Balanced : Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1
        },
        (loc) => {
          if (cancelled) return;
          lastLocRef.current = loc;
          // Sende sofort, wenn die Karte bereit ist
          if (ready && webref.current) {
            webref.current.postMessage(JSON.stringify(loc));
          }
        }
      );
      if (!cancelled) setSub(s);
    })().catch((e:any)=> setError(e?.message ?? "Unbekannter Fehler"));

    return () => {
      cancelled = true;
      sub?.remove();
      setSub(null);
    };
  }, [ready]);

  const onWebMessage = (e: any) => {
    let msg: any = null;
    try { msg = JSON.parse(e.nativeEvent.data); } catch {}
    if (msg?.ready) {
      setReady(true);
      // beim ersten Ready die letzte bekannte Position pushen
      if (lastLocRef.current && webref.current) {
        webref.current.postMessage(JSON.stringify(lastLocRef.current));
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meine Position (Leaflet + OSM)</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <WebView
        ref={webref}
        originWhitelist={["*"]}
        source={{ html: leafletHTML }}
        onMessage={onWebMessage}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 12 },
  title: { fontSize: 16, fontWeight: "600" },
  error: { color: "red", marginTop: 6 },
  map: { flex: 1 }
});
