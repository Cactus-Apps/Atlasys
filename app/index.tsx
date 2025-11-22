import Weather from "@/components/weather";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Device from "expo-device";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { t } from "i18next";
import {
  Clock4,
  HelpCircle,
  Home,
  Map,
  MapPin,
  Timer,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { supabase } from "../lib/supabase";
import { loadLanguage } from "./i18n";
import "./i18n.js";
import MapScreen from "./mapscreen";
import Profilescreen from "./profilescreen";

function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [Admin, setAdmin] = useState(false);
  const [time, setTime] = useState(new Date());
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

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

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const stopWatching = () => {
    subscription?.remove();
    setSubscription(null);
  };

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (Admin) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#000" }}>
          Admin Panel Entwicklungsversion
        </Text>
        <Text style={{ color: "#000" }}>Benachrichtigungen aktiv.</Text>
      </View>
    );
  } else {
    return (
      <GestureHandlerRootView>
        <ScrollView>
          <View style={styles.screen}>
            <View style={styles.header}>
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.image}
              />
            </View>
            <View style={styles.card}>
              <View>
                <Text style={styles.gps}> GPS Koordinaten</Text>
                {location ? (
                  <View>
                    <Text style={styles.gpskoords}>
                      {" "}
                      {location.coords.latitude}° N{" "}
                    </Text>
                    <Text style={styles.gpskoords2}>
                      {" "}
                      {location.coords.longitude}° E
                    </Text>
                  </View>
                ) : errorMsg ? (
                  <Text style={{ color: "red" }}>{errorMsg}</Text>
                ) : (
                  <Text
                    style={{ color: scheme === "dark" ? "#d8d8d8ff" : "#000" }}
                  >
                    {t("waiting")}
                  </Text>
                )}
              </View>
              <View>
                <MapPin
                  style={{ marginLeft: 120, marginTop: 22 }}
                  color="#EF4444"
                  strokeWidth={3}
                  size={36}
                />
              </View>
            </View>
            <View style={styles.card}>
              <View>
                <Text style={styles.time}> Aktuelle Zeit</Text>
                <Text style={styles.timetime}>
                  {""}
                  {time.toLocaleTimeString()}
                </Text>
                <Text style={styles.timezone}> {timezone}</Text>
              </View>
              <View>
                <Clock4
                  style={{ marginLeft: 158, marginTop: 22 }}
                  color="#3B82F6"
                  strokeWidth={3}
                  size={36}
                />
              </View>
            </View>
            <View style={styles.card}>
              <View>
                <Text style={styles.time}> Timer </Text>
                <Text style={styles.timetime}> 00:00:00</Text>
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity style={styles.buttonStart}>
                      <Text style={styles.buttonText}> Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonStop}>
                      <Text style={styles.buttonText}> Stop</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View>
                <Timer
                  style={{ left: 158, top: 22, position: "absolute"}}
                  color="#22C55E"
                  strokeWidth={3}
                  size={36}
                />
              </View>
            </View>
            <View>
              <Weather />
            </View>
          </View>
        </ScrollView>
      </GestureHandlerRootView>
    );
  }
}

const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function App() {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  useEffect(() => {
    loadLanguage();
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync();
    const unsubscribe = subscribeToNewRequests();

    return () => {
      unsubscribe();
    };
  }, []);

  const subscribeToNewRequests = () => {
    console.log("checking");

    const channel = supabase
      .channel("delete-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "delete_requests" },
        async (payload: any) => {
          console.log("Neuer Antrag:", payload.new);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Neuer Löschantrag",
              body: `Von ${payload.new.email}`,
              sound: "default",
            },
            trigger: null,
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Benachrichtigungen sind deaktiviert 😕");
        return;
      }
    } else {
    }
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: scheme === "dark" ? "#2c2a28ff" : "#e2d7d7ff",
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let IconComponent;

          switch (route.name) {
            case "Home":
              IconComponent = Home;
              break;
            case "Map":
              IconComponent = Map;
              break;
            case "Profile":
              IconComponent = User;
              break;
            default:
              IconComponent = HelpCircle;
              break;
          }

          return <IconComponent size={size} color={color} />;
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
      fontWeight: "500",
      paddingRight: 150,
      color: scheme === "dark" ? "#FFE8D1" : "#24262E",
    },
    error: {
      color: "red",
      marginTop: 10,
    },
    icon: {
      marginLeft: 13,
    },
    card: {
      borderColor: "#E5E7EB",
      backgroundColor: "#fff",
      borderRadius: 16,
      borderWidth: 1,
      width: 340,
      height: 120,
      elevation: 1,
      marginVertical: 12,
      paddingVertical: 13,
      paddingHorizontal: 13,
      flexDirection: "row",
    },
    gps: {
      color: "#4B5563",
      fontSize: 19,
      fontWeight: "500",
    },
    gpskoords: {
      marginBottom: 2,
      marginTop: 6,
      color: "#252E3C",
      fontSize: 15,
      fontWeight: "500",
    },
    gpskoords2: {
      fontSize: 15,
      fontWeight: "500",
    },
    buttonStart: {
      backgroundColor: "#22C55E",
      borderRadius: 7,
      width: 200,
      flex: 1,
      marginHorizontal: 5,
      padding: 15,
      alignItems: "center",
      height: 30,
    },
    buttonStop: {
      backgroundColor: "#EF4444",
      borderRadius: 7,
      width: 100,
      flex: 1,
      marginHorizontal: 5,
      padding: 15,
      alignItems: "center",
      height: 30,
    },
    time: {
      color: "#4B5563",
      fontSize: 18,
      fontWeight: "500",
    },
    timetime: {
      color: "#1F2937",
      fontSize: 26,
      fontWeight: "700",
    },
    timezone: {
      color: "#6B7280",
      fontSize: 17,
      fontWeight: "500",
    },
    buttonText: {
      color: "#fff",
      fontSize: 14,
    },
    containerl: {
      paddingVertical: 12,
      borderColor: scheme === "dark" ? "#d8d8d8ff" : "#24262E",
      borderWidth: 2,
      borderRadius: 8,
      marginTop: 30,
      padding: 16,
    },
    containerlr: {
      paddingVertical: 12,
      borderColor: scheme === "dark" ? "#d8d8d8ff" : "#24262E",
      borderWidth: 2,
      borderRadius: 8,
      marginTop: 30,
      padding: 16,
      paddingHorizontal: 70,
    },
    screen: {
      alignItems: "center",
      flex: 1,
    },
    line: {
      height: 1,
      backgroundColor: "#ccc",
      alignSelf: "stretch",
      marginVertical: 12,
      marginHorizontal: 17,
    },
    settings: {
      borderColor: "#24262E",
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
      backgroundColor: "#fff",
      width: "100%",
      borderBottomColor: "#fff",
      borderWidth: 1,
      flex: 1,
      elevation: 2,
    },
    title2: {
      fontSize: 16,
      fontWeight: "600",
      color: scheme === "dark" ? "#d8d8d8ff" : "#24262E",
    },
    image: {
      width: 170,
      height: 60,
      marginTop: 40,
      marginBottom: 15,
      marginRight: 190,
    },
  });

export default App;
