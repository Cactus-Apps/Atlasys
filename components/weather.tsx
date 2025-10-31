import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
      console.warn("Fehler beim Laden des Wetters", e);
      setError("Fehler beim Laden des Wetters");
      setWeather(null);
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

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color={'#466483ff'}/>}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {weather ? (
        <View style={styles.card}>
          <Text style={styles.temp}>{weather.temperature}°C</Text>
          <Text>{weatherCodeToText(weather.weathercode)}</Text>
          <Text>Wind: {weather.windspeed} km/h</Text>
          <Text>Wind Richtung: {Math.round(weather.winddirection)}°</Text>
        </View>
      ) : (
        <Text>Kein Wetter geladen</Text>
      )}
      {location ? <></> : <Text>Standort nicht verfügbar</Text>}

      <View style={{ height: 16 }} />

      <TouchableOpacity
        onPress={getLocationAsync}
        style={styles.button}
      ><Text style={{color: "#d8d8d8ff",}}>Standort & Wetter aktualisieren</Text></TouchableOpacity>
      <View style={{ marginVertical: 200 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    backgroundColor: "#d8d8d8ff",
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  temp: {
    fontSize: 36,
    fontWeight: "700",
  },
  error: {
    color: "red",
    marginVertical: 8,
  },
  button: {
    fontSize: 21,
    fontWeight: "600",
    borderRadius: 8,
    backgroundColor: "#466483ff",
    color: "#d8d8d8ff",
    paddingHorizontal: 35,
    paddingVertical: 12,
    alignSelf: "center",
  },
});
