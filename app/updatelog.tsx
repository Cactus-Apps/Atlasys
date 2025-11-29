import { t } from "i18next";
import * as React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import "./i18n";

const updatelog = () => {
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  return (
    <ScrollView style={styles.view}>
      <View style={styles.placeholder}>
        <Text style={styles.titlet}>{t("update_log")}</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.3.2</Text>
        <Text style={styles.text}>Verbserter Home Screen und </Text>
        <Text style={styles.text}>und kleinere Verbesserung</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.3.1</Text>
        <Text style={styles.text}>Neuer Home Screen und </Text>
        <Text style={styles.text}>neue animation und wetter anzeige</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.3.0</Text>
        <Text style={styles.text}>Neuer Update log und </Text>
        <Text style={styles.text}>Neuer Account Screen</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.8</Text>
        <Text style={styles.text}>Besseres Design und </Text>
        <Text style={styles.text}>Neuer Anmelde Screen</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.7</Text>
        <Text style={styles.text}>Sicherheits Verbesserung und </Text>
        <Text style={styles.text}>und kleinere Verbesserung</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.6</Text>
        <Text style={styles.text}>Account löschen verbessert </Text>
        <Text style={styles.text}>und kleinere Verbesserung</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.4</Text>
        <Text style={styles.text}>Account per E-Mail löschen </Text>
        <Text style={styles.text}>
          eingestellt, neues Account löschen system und kleinere Verbesserung
        </Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.3</Text>
        <Text style={styles.text}>Neues Backend, kleine Verbesserung</Text>
        <Text style={styles.text}>und neuer Home screen und</Text>
        <Text style={styles.text}>account löschen per E-Mail</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.2</Text>
        <Text style={styles.text}>Karten such funktion</Text>
        <Text style={styles.text}>und kleinere Verbesserung</Text>
        <Text style={styles.text}></Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.1</Text>
        <Text style={styles.text}>Acount, Auth und</Text>
        <Text style={styles.text}>anmelde möglichkeit</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.0</Text>
        <Text style={styles.text}>{t("v1.2.0")}</Text>
        <Text style={styles.text}>Beta realease der App</Text>
      </View>
    </ScrollView>
  );
};

export default updatelog;

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    view: {
      flex: 1,
    },
    titlet: {
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
      fontSize: 30,
      fontWeight: "600",
    },
    placeholder: {
      marginVertical: 30,
      marginTop: 40,
      alignSelf: "center",
    },
    container: {
      borderRadius: 8,
      borderColor: scheme === "dark" ? "#d8d8d8ff" : "#292828ff",
      alignSelf: "center",
      width: 350,
      height: 130,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      marginBottom: 12,
      marginHorizontal: 15,
      paddingHorizontal: 45,
      paddingVertical: 20,
    },
    title: {
      fontSize: 23,
      alignSelf: "center",
      fontWeight: "600",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    text: {
      fontSize: 15,
      fontWeight: "500",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
  });
