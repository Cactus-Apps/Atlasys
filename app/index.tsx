import Clock from "@/components/clock";
import Weather from "@/components/weather";
import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Device from "expo-device";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { t } from "i18next";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, View, useColorScheme } from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { Button } from "react-native-paper";
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

  const stopWatching = () => {
    subscription?.remove();
    setSubscription(null);
  };

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  if (Device.isDevice) {
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
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: scheme === "dark" ? "#d8d8d8ff" : "#000",
                  }}
                >
                  {t("latitude")} {location.coords.latitude}, {t("longitude")}{" "}
                  {location.coords.longitude}
                </Text>
              ) : errorMsg ? (
                <Text style={{ color: "red" }}>{errorMsg}</Text>
              ) : (
                <Text
                  style={{ color: scheme === "dark" ? "#d8d8d8ff" : "#000" }}
                >
                  {t("waiting")}
                </Text>
              )}

              <View style={{ flexDirection: "row", marginTop: 20 }}>
                <Button
                  onPress={startWatching}
                  disabled={subscription !== null}
                  mode="contained"
                  buttonColor="#FFE8D1"
                >
                  <Text style={styles.buttonText}>{t("start")}</Text>
                </Button>
                <View style={{ paddingHorizontal: 8 }} />
                <Button
                  onPress={stopWatching}
                  disabled={subscription === null}
                  mode="contained"
                  buttonColor="#FFE8D1"
                >
                  {" "}
                  <Text style={styles.buttonText}>{t("stop")}</Text>
                </Button>
              </View>
            </View>
            <View style={styles.containerlr}>
              <Text style={styles.title}> Uhr</Text>
              <View
                style={{
                  height: 1,
                  backgroundColor: "#ccc",
                  alignSelf: "stretch",
                  marginVertical: 16,
                }}
              />
              <Clock />
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
    buttonText: {
      color: "#FFE8D1",
      fontSize: 16,
      fontWeight: "bold",
      marginHorizontal: "auto",
    },
    containerl: {
      paddingVertical: 12,
      borderColor: scheme === "dark" ? "#d8d8d8ff" : "#24262E",
      borderWidth: 2,
      borderRadius: 8,
      marginTop: 30,
      padding: 16,
      backgroundColor: scheme === "dark" ? "#2a2b2cff" : "#ffffffff",
    },
    containerlr: {
      paddingVertical: 12,
      borderColor: scheme === "dark" ? "#d8d8d8ff" : "#24262E",
      borderWidth: 2,
      borderRadius: 8,
      marginTop: 30,
      padding: 16,
      backgroundColor: scheme === "dark" ? "#2d2e30ff" : "#ffffffff",
      paddingHorizontal: 70,
    },
    screen: {
      backgroundColor: scheme === "dark" ? "#272625ff" : "#ffffffff",
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
      backgroundColor: "#FFE8D1",
      width: "100%",
      borderBottomColor: "#fff",
      borderWidth: 1,
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
