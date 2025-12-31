// Version 1.3.6 - © Cactus Apps 2025
import AntDesign from "@expo/vector-icons/AntDesign";
import * as React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const bugreport = () => {
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const openLink = () => {
    Linking.openURL("https://github.com/Cactus-Apps/GPS/issues/new").catch(
      (err) => console.error("An error occurred", err)
    );
  };

  return (
    <SafeAreaView style={styles.all}>
      <Text style={styles.title}>Bug Report</Text>
      <View style={styles.container}>
        <Text style={styles.text}>please report on</Text>
        <AntDesign style={styles.icon} name="github" size={24} color="black" />
        <TouchableOpacity onPress={openLink}>
          <Text style={styles.link}>GitHub</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default bugreport;

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    all: {
      flex: 1,
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 40,
    },
    link: {
      fontSize: 17,
      fontWeight: "600",
      textDecorationLine: "underline",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    title: {
      fontSize: 30,
      paddingTop: 15,
      alignSelf: "center",
      fontWeight: "600",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    text: {
      marginHorizontal: 12,
      fontSize: 17,
      fontWeight: "500",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    icon: {
      marginLeft: 10,
      marginRight: 3,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
  });
