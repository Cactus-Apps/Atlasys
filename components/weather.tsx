// Version 1.3.6 - © Cactus Apps 2025
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { t } from "i18next";
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
import { CardSkeletonView, CardSkeletonViewText } from "./SkeletonView";
import { useAppTheme } from "@/lib/theme";

export default function Weather() {
  const theme = useAppTheme();
  const styles = getStyles(theme);
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
      case t("Clear_sky"):
        return require("../assets/animations/sunny.json");
      case t("Mostly_clear"):
        return require("../assets/animations/partly-cloudy.json");
      case t("Partly_cloudy"):
        return require("../assets/animations/partly-cloudy.json");
      case t("Overcast"):
        return require("../assets/animations/windy.json");
      case t("Fog"):
        return require("../assets/animations/mist.json");
      case t("Depositing_rime_fog"):
        return require("../assets/animations/Foggy.json");
      case t("Light_drizzle"):
        return require("../assets/animations/partly-cloudy.json");
      case t("Moderate_drizzle"):
        return require("../assets/animations/partly-cloudy.json");
      case t("Heavy_drizzle"):
        return require("../assets/animations/partly-cloudy.json");
      case t("Light_rain"):
        return require("../assets/animations/rain.json");
      case t("Moderate_rain"):
        return require("../assets/animations/rain.json");
      case t("Heavy_rain"):
        return require("../assets/animations/rain.json");
      case t("Light_snow"):
        return require("../assets/animations/snow.json");
      case t("Moderate_snow"):
        return require("../assets/animations/snow.json");
      case t("Heavy_snow"):
        return require("../assets/animations/snow.json");
      case t("Snow_grains"):
        return require("../assets/animations/snow.json");
      case t("Light_showers"):
        return require("../assets/animations/rain.json");
      case t("Moderate_showers"):
        return require("../assets/animations/rain.json");
      case t("Heavy_showers"):
        return require("../assets/animations/rain.json");
      case t("⚠️ Thunderstorm"):
        return require("../assets/animations/storm-rain-thunder.json");
      case t("⚠️ Thunderstorm_with_heavy_hail"):
        return require("../assets/animations/storm-rain-thunder.json");
      default:
        return require("../assets/animations/error.json");
    }
  };

  const getGradientColors = (status: string): readonly [string, string] => {
    switch (status) {
      case t("Clear_sky"):
        return ["#87CEEB", "#00BFFF"] as const;
      case t("Mostly_clear"):
        return ["#ADD8E6", "#87CEFA"] as const;
      case t("Partly_cloudy"):
        return ["#B0C4DE", "#4682B4"] as const;
      case t("Overcast"):
        return ["#A9A9A9", "#696969"] as const;
      case t("Fog"):
        return ["#D3D3D3", "#A9A9A9"] as const;
      case t("Depositing_rime_fog"):
        return ["#B0C4DE", "#FFFFFF"] as const;
      case t("Light_drizzle"):
        return ["#A9A9A9", "#B0E0E6"] as const;
      case t("Moderate_drizzle"):
        return ["#696969", "#87CEFA"] as const;
      case t("Heavy_drizzle"):
        return ["#4B0082", "#00BFFF"] as const;
      case t("Light_rain"):
        return ["#4682B4", "#ADD8E6"] as const;
      case t("Moderate_rain"):
        return ["#4169E1", "#1E90FF"] as const;
      case t("Heavy_rain"):
        return ["#00008B", "#00CED1"] as const;
      case t("Light_snow"):
        return ["#F0F8FF", "#FFFFFF"] as const;
      case t("Moderate_snow"):
        return ["#E6E6FA", "#F5FFFA"] as const;
      case t("Heavy_snow"):
        return ["#DCDCDC", "#F8F8FF"] as const;
      case t("Snow_grains"):
        return ["#F5F5F5", "#FFFFFF"] as const;
      case t("Light_showers"):
        return ["#87CEEB", "#B0E0E6"] as const;
      case t("Moderate_showers"):
        return ["#00BFFF", "#1E90FF"] as const;
      case t("Heavy_showers"):
        return ["#4682B4", "#5F9EA0"] as const;
      case t("⚠️ Thunderstorm"):
        return ["#4B0082", "#808080"] as const;
      case t("⚠️ Thunderstorm_with_heavy_hail"):
        return ["#2F4F4F", "#A9A9A9"] as const;
      default:
        return ["#ffffff", "#ffffff"] as const;
    }
  };

  const weatherCodeToText = (code: number) => {
    const map: { [key: number]: string } = {
      0: t("Clear_sky"),
      1: t("Mostly_clear"),
      2: t("Partly_cloudy"),
      3: t("Overcast"),
      45: t("Fog"),
      48: t("Depositing_rime_fog"),
      51: t("Light_drizzle"),
      53: t("Moderate_drizzle"),
      55: t("Heavy_drizzle"),
      61: t("Light_rain"),
      63: t("Moderate_rain"),
      65: t("Heavy_rain"),
      71: t("Light_snow"),
      73: t("Moderate_snow"),
      75: t("Heavy_snow"),
      77: t("Snow_grains"),
      80: t("Light_showers"),
      81: t("Moderate_showers"),
      82: t("Heavy_showers"),
      95: t("⚠️ Thunderstorm"),
      96: t("⚠️ Thunderstorm_with_heavy_hail"),
      99: t("⚠️ Thunderstorm_with_light_hail"),
    };
    return map[code] || `Code ${code}`;
  };

  useEffect(() => {
    getLocationAsync();
  }, []);

  if (loading) {
    return (
      <View style={styles.card2}>
        <CardSkeletonView/>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View>
          <LinearGradient colors={[theme.cardBg, theme.cardBg]} style={styles.card}>
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

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
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
    borderRadius: theme.isModern ? 24 : 16,
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
    borderRadius: theme.isModern ? 24 : 16,
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
