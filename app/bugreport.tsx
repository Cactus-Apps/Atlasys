import AntDesign from "@expo/vector-icons/AntDesign";
import * as React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, } from "react-native-safe-area-context";

const bugreport = () => {
  const openLink = () => {
    Linking.openURL("https://github.com/Cactus-Apps/GPS/issues/new").catch(
      (err) => console.error("An error occurred", err)
    );
  };

  return (
    <SafeAreaView>
      <Text style={styles.title}>Fehler Melden</Text>
      <View style={styles.container}>
      <Text style={styles.text}>
        Bitte melden sie Fehler auf
        <AntDesign name="github" size={24} color="black" />
        <TouchableOpacity onPress={openLink}>
          <Text style={styles.link}>GitHub</Text>
        </TouchableOpacity>
      </Text>
      </View>
    </SafeAreaView>
  );
};

export default bugreport;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",

  },
  link: {
    fontSize: 17,
    fontWeight: "500",
  },
  title: {
    fontSize: 30,
    paddingTop: 15,
    alignSelf: "center",
  },
  text: {
    fontSize: 17,
    paddingLeft: 12,
    paddingTop: 12,
  },
});
