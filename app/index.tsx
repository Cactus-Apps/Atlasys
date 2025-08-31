import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import onboarding from "./app_intro_slider";
import { loadLanguage } from "./i18n";
import "./i18n.js";
import Profilescreen from "./profilescreen";

function HomeScreen() {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const LANGUAGE_KEY = "user_language";

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError("Keine Berechtigung für Standortzugriff");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords);
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
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
          <>
            <Text>
              {t("latitude")} {location.latitude}
            </Text>
            <Text>
              {t("longitude")} {location.longitude}
            </Text>
          </>
        ) : (
          <Text>{t("waiting")}</Text>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={getLocation}>
          <Text style={styles.buttonText}>{t("refreshing")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MapScreen() {
//  return <GoogleMaps.View style={{ flex: 1 }} />;
return <View> </View>
}

const Tab = createBottomTabNavigator();

function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const isFirstLaunch = await AsyncStorage.getItem("isFirstLaunch");
      if (isFirstLaunch === null) {
        await AsyncStorage.setItem("isFirstLaunch", "true");
        useEffect(() => {
          onboarding;
        }, []);
      }
    } catch (error) {}
  };

  useEffect(() => {
    loadLanguage();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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

const styles = StyleSheet.create({
  container: {
    flex: 7,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffffff",
  },
  title: {
    fontSize: 24,
    paddingRight: 150,
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#466483ff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: "auto",
  },
  containerl: {
    paddingVertical: 12,
    borderColor: "#292828ff",
    borderWidth: 1,
    borderRadius: 8,
    bottom: 230,
    padding: 16,
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});

export default App;
