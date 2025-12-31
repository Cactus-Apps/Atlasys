// Version 1.3.6 - © Cactus Apps 2025
import * as Clipboard from "expo-clipboard";
import * as Location from "expo-location";
import { Copy, MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import "../app/i18n";
import { t } from "i18next";


function Gpskoords() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [time, setTime] = useState(new Date());

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const startWatching = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg(t("Location_authorization_denied"));
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

  const copy = async (text: string[]) => {
      await Clipboard.setStringAsync(text.join(" "));
    };

  const copyCoords = async () => {
    try {
      const message = location
        ? [t('Latitude:'), `${location.coords.latitude}` ,t('Longitude:'),`${location.coords.longitude}`]
        : [t("No_location_available")];
      
        copy(message)
    } catch (error: any) {
      console.log(error.message);
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

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.gps}>{t('GPS_coordinates')}</Text>
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
          <Text style={{ color: scheme === "dark" ? "#d8d8d8ff" : "#000" }}>
            {t('waiting')}
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
      <TouchableOpacity onPress={copyCoords} style={styles.button}>
        <Copy strokeWidth={3} size={20} color={"#2e2c2cff"} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
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

export default Gpskoords;
