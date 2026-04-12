// Version 1.3.6 - © Cactus Apps 2026
import * as Clipboard from "expo-clipboard";
import * as Location from "expo-location";
import { Copy, MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "@/lib/theme";
import { t } from "i18next";
import { useloadingStore, useAuthStore } from "@/lib/storage/zustand";

function Gpskoords() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [time, setTime] = useState(new Date());

  const setLoadingGpsCoords = useloadingStore((s) => s.setloadingGpsCoords);
  const locationSharing = useAuthStore((s) => s.settings.locationSharing);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const startWatching = async () => {
    try {
      setLoadingGpsCoords(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg(t("Location_authorization_denied"));
        setLoadingGpsCoords(false);
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
    } finally {
      setLoadingGpsCoords(false);
    }
  };

  const copy = async (text: string[]) => {
    await Clipboard.setStringAsync(text.join(" "));
  };

  const copyCoords = async () => {
    try {
      const message = location
        ? [
          t("Latitude:"),
          `${location.coords.latitude}`,
          t("Longitude:"),
          `${location.coords.longitude}`,
        ]
        : [t("No_location_available")];

      copy(message);
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
    if (!locationSharing) {
      stopWatching();
      setLocation(null);
      setErrorMsg(null);
      return;
    }
    startWatching();
    return () => stopWatching();
  }, [locationSharing]);

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.gps}>{t("GPS_coordinates")}</Text>
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
          <Text style={{ color: theme.textColor }}>
            {t("waiting")}
          </Text>
        )}
      </View>
      <View>
        <MapPin
          style={{ marginLeft: 120, marginTop: 22 }}
          color={theme.danger}
          strokeWidth={3}
          size={36}
        />
      </View>
      <TouchableOpacity onPress={copyCoords} style={styles.button}>
        <Copy strokeWidth={3} size={20} color={theme.isDark ? "#d8d8d8ff" : "#2e2c2cff"} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { cardBg, borderColor, textColor, subTextColor, isModern } = theme;

  return StyleSheet.create({
    card: {
      borderColor: borderColor,
      backgroundColor: cardBg,
      borderRadius: isModern ? 24 : 16,
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
      color: subTextColor,
      fontSize: 19,
      fontWeight: "500",
    },
    gpskoords: {
      marginBottom: 2,
      marginTop: 6,
      color: textColor,
      fontSize: 15,
      fontWeight: "500",
    },
    gpskoords2: {
      color: textColor,
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
};

export default Gpskoords;
