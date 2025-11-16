import { useRouter } from "expo-router";
import * as React from "react";
import {
    Image,
    Linking,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";
import "./i18n";

export default function thanks() {
  const scheme = useColorScheme();
  const router = useRouter();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  return (
    <View>
      <Text style={styles.credits}>Special Thanks</Text>
      <View
        style={{
          height: 1,
          backgroundColor: "#ccc",
          alignSelf: "stretch",
          marginVertical: 16,
        }}
      />
      <View style={styles.all2}>
        <Image
          source={require("../assets/images/maptiler.png")}
          style={styles.image}
        />
        <Text
          style={styles.link}
          onPress={() => Linking.openURL("https://www.maptiler.com/copyright/")}
        >
          &copy; MapTiler
        </Text>
      </View>
      <View style={styles.all3}>
        <Image
          source={require("../assets/images/Openstreetmap_logo.png")}
          style={styles.image}
        />
        <Text
          style={styles.link}
          onPress={() =>
            Linking.openURL("https://www.openstreetmap.org/copyright")
          }
        >
          &copy; OpenStreetMap contributors
        </Text>
      </View>
      <View style={styles.all4}>
        <Image
          source={require("../assets/images/logo-leaflet.png")}
          style={styles.image}
        />
        <View>
          <Text
            style={styles.link}
            onPress={() => Linking.openURL("https://leafletjs.com/")}
          >
            &copy; Leaflet
          </Text>
          <Text
            style={styles.link}
            onPress={() => Linking.openURL("https://agafonkin.com/")}
          >
            &copy; Volodymyr Agafonkin. Maps
          </Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    credits: {
      fontSize: 26,
      alignSelf: "center",
      fontWeight: "600",
      paddingVertical: 20,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 12,
      marginLeft: 30,
      marginTop: 30,
    },
    link: {
      fontSize: 15,
      fontWeight: "600",
      paddingLeft: 25,
      textDecorationLine: "underline",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    all2: {
      flexDirection: "row",
      alignItems: "center",
    },
    all3: {
      flexDirection: "row",
      alignItems: "center",
    },
    all4: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
