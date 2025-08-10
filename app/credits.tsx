import * as React from "react";
import { Linking, SafeAreaView, StyleSheet, Text } from "react-native";

const credits = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text
        style={styles.maptiler}
        onPress={() => Linking.openURL("https://www.maptiler.com/copyright/")}
      >
        &copy; MapTiler
      </Text>
      <Text
        style={styles.osm}
        onPress={() =>
          Linking.openURL("https://www.openstreetmap.org/copyright")
        }
      >
        &copy; OpenStreetMap contributors
      </Text>
    </SafeAreaView>
  );
};

export default credits;

const styles = StyleSheet.create({
  container: {

  },
  maptiler: {

  },
  osm: {

  },
});
