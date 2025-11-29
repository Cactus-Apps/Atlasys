import {
  Clock4
} from "lucide-react-native";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useColorScheme
} from "react-native";

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;


function Clock() {
  const [time, setTime] = useState(new Date());
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  return (
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
  });

export default Clock;
