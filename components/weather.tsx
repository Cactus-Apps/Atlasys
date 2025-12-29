import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import LottieView from "lottie-react-native";
import { RefreshCcw } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Weather() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getLocationAsync = async () => {
    setError(null);
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Standortberechtigung verweigert");
        setLoading(false);
        setLocation(null);
        setWeather(null);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };

      setLocation(coords);
      await fetchWeather(coords.latitude, coords.longitude);
    } catch (e) {
      console.warn("Fehler beim Bestimmen des Standorts", e);
      setError("Fehler beim Bestimmen des Standorts");
      setLocation(null);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setWeather(null);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setWeather(json.current_weather || null);
    } catch (e) {
      console.warn("Error loading weather", e);
      setError("Error loading weather");
      setWeather(null);
    }
  };

  const getAnimation = (
    animations: string | { uri: string }
  ): string | { uri: string } => {
    switch (animations) {
      case "Klarer Himmel":
        return require("../assets/animations/sunny.json");
      case "Überwiegend klar":
        return require("../assets/animations/partly-cloudy.json");
      case "Teilweise bewölkt":
        return require("../assets/animations/partly-cloudy.json");
      case "Bedeckt":
        return require("../assets/animations/windy.json");
      case "Nebel":
        return require("../assets/animations/mist.json");
      case "Reifnebel":
        return require("../assets/animations/Foggy.json");
      case "leichter Nieselregen":
        return require("../assets/animations/partly-cloudy.json");
      case "mäßiger Nieselregen":
        return require("../assets/animations/partly-cloudy.json");
      case "starker Nieselregen":
        return require("../assets/animations/partly-cloudy.json");
      case "leichter Regen":
        return require("../assets/animations/rain.json");
      case "mäßiger Regen":
        return require("../assets/animations/rain.json");
      case "starker Regen":
        return require("../assets/animations/rain.json");
      case "leichter Schnee":
        return require("../assets/animations/snow.json");
      case "mäßiger Schnee":
        return require("../assets/animations/snow.json");
      case "starker Schnee":
        return require("../assets/animations/snow.json");
      case "Schneegriesel":
        return require("../assets/animations/snow.json");
      case "leichte Schauer":
        return require("../assets/animations/rain.json");
      case "mäßige Schauer":
        return require("../assets/animations/rain.json");
      case "starke Schauer":
        return require("../assets/animations/rain.json");
      case "⚠️ Gewitter":
        return require("../assets/animations/storm-rain-thunder.json");
      case "⚠️ Gewitter und starker Hagel":
        return require("../assets/animations/storm-rain-thunder.json");
      default:
        return require("../assets/animations/error.json");
    }
  };

  const getGradientColors = (status: string): readonly [string, string] => {
    switch (status) {
      case "Klarer Himmel":
        return ["#87CEEB", "#00BFFF"] as const;
      case "Überwiegend klar":
        return ["#ADD8E6", "#87CEFA"] as const;
      case "Teilweise bewölkt":
        return ["#B0C4DE", "#4682B4"] as const;
      case "Bedeckt":
        return ["#A9A9A9", "#696969"] as const;
      case "Nebel":
        return ["#D3D3D3", "#A9A9A9"] as const;
      case "Reifnebel":
        return ["#B0C4DE", "#FFFFFF"] as const;
      case "leichter Nieselregen":
        return ["#A9A9A9", "#B0E0E6"] as const;
      case "mäßiger Nieselregen":
        return ["#696969", "#87CEFA"] as const;
      case "starker Nieselregen":
        return ["#4B0082", "#00BFFF"] as const;
      case "leichter Regen":
        return ["#4682B4", "#ADD8E6"] as const;
      case "mäßiger Regen":
        return ["#4169E1", "#1E90FF"] as const;
      case "starker Regen":
        return ["#00008B", "#00CED1"] as const;
      case "leichter Schnee":
        return ["#F0F8FF", "#FFFFFF"] as const;
      case "mäßiger Schnee":
        return ["#E6E6FA", "#F5FFFA"] as const;
      case "starker Schnee":
        return ["#DCDCDC", "#F8F8FF"] as const;
      case "Schneegriesel":
        return ["#F5F5F5", "#FFFFFF"] as const;
      case "leichte Schauer":
        return ["#87CEEB", "#B0E0E6"] as const;
      case "mäßige Schauer":
        return ["#00BFFF", "#1E90FF"] as const;
      case "starke Schauer":
        return ["#4682B4", "#5F9EA0"] as const;
      case "⚠️ Gewitter":
        return ["#4B0082", "#808080"] as const;
      case "⚠️ Gewitter und starker Hagel":
        return ["#2F4F4F", "#A9A9A9"] as const;
      default:
        return ["#ffffff", "#ffffff"] as const;
    }
  };

  const weatherCodeToText = (code: number) => {
    const map: { [key: number]: string } = {
      0: "Klarer Himmel",
      1: "Überwiegend klar",
      2: "Teilweise bewölkt",
      3: "Bedeckt",
      45: "Nebel",
      48: "Reifnebel",
      51: "leichter Nieselregen",
      53: "mäßiger Nieselregen",
      55: "starker Nieselregen",
      61: "leichter Regen",
      63: "mäßiger Regen",
      65: "starker Regen",
      71: "leichter Schnee",
      73: "mäßiger Schnee",
      75: "starker Schnee",
      77: "Schneegriesel",
      80: "leichte Schauer",
      81: "mäßige Schauer",
      82: "starke Schauer",
      95: "⚠️ Gewitter",
      96: "⚠️ Gewitter und starker Hagel",
      99: "⚠️ Gewitter und leichter Hagel",
    };
    return map[code] || `Code ${code}`;
  };

  useEffect(() => {
    getLocationAsync();
  }, []);

  if (loading) {
    return (
      <View style={styles.card2}>
        <ActivityIndicator size="large" color={"#466483ff"} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View>
          <LinearGradient colors={["#fff", "#fff"]} style={styles.card}>
            <View>
              <Text style={styles.error}>{error}</Text>
            </View>
            <View style={{ right: 130, bottom: 2, position: "absolute" }}>
              <LottieView
                source={require("../assets/animations/error.json")}
                style={{ width: 80, height: 80 }}
                autoPlay
                loop
              />
            </View>
          </LinearGradient>
        </View>
      )}
      {weather ? (
        <LinearGradient
          colors={getGradientColors(weatherCodeToText(weather.weathercode))}
          style={styles.card}
        >
          <View>
            <Text style={{ fontSize: 17, fontWeight: "600" }}> Weather</Text>
            <Text style={styles.temp}>{weather.temperature}°C</Text>
            <Text style={{ fontSize: 16 }}>
              {weatherCodeToText(weather.weathercode)}
            </Text>
          </View>
          <View style={{ right: 10, top: 20, position: "absolute" }}>
            <LottieView
              source={getAnimation(weatherCodeToText(weather.weathercode))}
              style={{ width: 80, height: 80 }}
              autoPlay
              loop
            />
          </View>
          <TouchableOpacity onPress={getLocationAsync} style={styles.button}>
            <RefreshCcw strokeWidth={3} size={20} color={"#2e2c2cff"} />
          </TouchableOpacity>
        </LinearGradient>
      ) : (
        <></>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderColor: "transparent",
    borderWidth: 1,
    width: 340,
    height: 120,
    elevation: 1,
    marginVertical: 12,
    paddingVertical: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
  },
  card2: {
    borderRadius: 16,
    borderColor: "transparent",
    borderWidth: 0,
    width: 340,
    height: 120,
    marginVertical: 12,
    paddingVertical: 16,
    paddingHorizontal: 13,
    flexDirection: "row",
    justifyContent: "center",
  },
  temp: {
    fontSize: 36,
    fontWeight: "700",
  },
  error: {
    color: "red",
    marginVertical: 8,
    fontSize: 18,
    fontWeight: "600",
  },
  button: {
    fontSize: 21,
    fontWeight: "600",
    borderRadius: 8,
    left: 308,
    bottom: 10,
    position: "absolute",
    alignSelf: "center",
  },
});
