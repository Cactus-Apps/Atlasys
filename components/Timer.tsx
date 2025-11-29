import {
  TimerIcon
} from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";


function Timer() {
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  return (
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
        <TimerIcon
          style={{ left: 158, top: 22, position: "absolute" }}
          color="#22C55E"
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
    buttonText: {
      color: "#fff",
      fontSize: 14,
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
  });

export default Timer;
