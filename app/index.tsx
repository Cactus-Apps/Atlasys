import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Location from "expo-location";
import { t } from "i18next";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { Button } from "react-native-paper";
import { WebView } from "react-native-webview";
import { loadLanguage } from "./i18n";
import "./i18n.js";
import Profilescreen from "./profilescreen";

function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
    const scheme = useColorScheme(); 
    const styles = getStyles(scheme === "light" || scheme === "dark" ? scheme : null);
    

  const startWatching = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location authorization denied");
        return;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (loc) => {
          setLocation(loc);
          setErrorMsg(null);
        }
      );

      setSubscription(sub);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const stopWatching = () => {
    subscription?.remove();
    setSubscription(null);
  };

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <Image source={require("../assets/images/logo.png")} style={styles.image}/>
      <View style={styles.containerl}>
        <Text style={styles.title}>{t("title")}</Text>
        <View
          style={{
            height: 1,
            backgroundColor: "#ccc",
            alignSelf: "stretch",
            marginVertical: 16,
          }}
        />
        {location ? (
          <Text style={{fontSize: 15, fontWeight: '500', color: scheme === "dark" ? "#d8d8d8ff" : "#000"}}>
           {t('latitude')} {location.coords.latitude}, {t('longitude')} {" "}
            {location.coords.longitude}
          </Text>
        ) : errorMsg ? (
          <Text style={{ color: "red" }}>{errorMsg}</Text>
        ) : (
          <Text style={{color: scheme === "dark" ? "#d8d8d8ff" : "#000"}}>{t('waiting')}</Text>
        )}

        <View style={{ flexDirection: "row", marginTop: 20 }}>
          <Button
            onPress={startWatching}
            disabled={subscription !== null}
            mode="contained"
            buttonColor="#466483ff"
          ><Text style={styles.buttonText} >{t('start')}</Text></Button>
          <View style={{paddingHorizontal: 8,}} />
          <Button
            onPress={stopWatching}
            disabled={subscription === null}
            mode="contained"
            buttonColor="#466483ff"
          > <Text style={styles.buttonText}>{t('stop')}</Text></Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function MapScreen() {
  const webref = useRef<WebView>(null);
  const lastLocRef = useRef<Location.LocationObject | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<Location.LocationSubscription | null>(null);
  const scheme = useColorScheme(); 
  const styles = getStyles(scheme === "light" || scheme === "dark" ? scheme : null);

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
    L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=0I4OJd1qI6EDbqGbnHgZ', {
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
          if (ready && webref.current) {
            webref.current.postMessage(JSON.stringify(loc));
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
      if (lastLocRef.current && webref.current) {
        webref.current.postMessage(JSON.stringify(lastLocRef.current));
      }
    }
  };

  return (
    <View style={styles.container}>
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

const Tab = createBottomTabNavigator();

function App() {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme(); 
  const styles = getStyles(scheme === "light" || scheme === "dark" ? scheme : null);

  useEffect(() => {
    loadLanguage();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: scheme === "dark" ? '#2c2a2aff' :  "#ffffffff"},
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof MaterialIcons>["name"];
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Map":
              iconName = "map";
              break;
            case "Profile":
              iconName = "person";
              break;
            default:
              iconName = "help";
              break;
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#466483ff",
      })}
    >
      <Tab.Screen
        name="Home"
        options={{ tabBarLabel: t("Home"), headerShown: false }}
        component={HomeScreen}
      />
      <Tab.Screen
        name="Map"
        options={{ tabBarLabel: t("map"), headerShown: false }}
        component={MapScreen}
      />
      <Tab.Screen
        name="Profile"
        options={{ tabBarLabel: t("profile"), headerShown: false }}
        component={Profilescreen}
      />
    </Tab.Navigator>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
 StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '500',
    paddingRight: 150,
    color: scheme === "dark" ? "#d8d8d8ff" : "#000",
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  buttonText: {
    color: "#d8d8d8ff",
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: "auto",
  },
  containerl: {
    paddingVertical: 12,
    borderColor: scheme === "dark" ? "#d8d8d8ff" : "#000",
    borderWidth: 2,
    borderRadius: 8,
    bottom: 230,
    padding: 16,
    backgroundColor: scheme === "dark" ? "#333333ff" : "#ffffffff",
  },
  screen: {
    alignItems: "center",
    flex: 1,
    backgroundColor: scheme === "dark" ? "#2c2a2aff" : "#fff",
  },
  line: {
    height: 1,
    backgroundColor: "#ccc",
    alignSelf: "stretch",
    marginVertical: 12,
    marginHorizontal: 17,
  },
  settings: {
    borderColor: "#292828ff",
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 8,
    top: 55,
    marginLeft: 23,
    marginRight: 23,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 12,
  },
  title2: {
    fontSize: 16,
    fontWeight: "600",
    color: scheme === "dark" ? "#d8d8d8ff" : "#000",
  },
  error2: {
    color: "red",
    marginTop: 6,
  },
  map: {
    flex: 1,
  },
  image: {
    width: 200,
    height: 100,
    borderRadius: 12,
    marginBottom: 230,
    marginTop: 34,
    justifyContent:'center'
  },
});

export default App;
