import { t } from "i18next";
import { Rocket } from "lucide-react-native";
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
        <View style={[styles.banner, { backgroundColor: "#212434" }]}>
          <Rocket color={"#5164C8"} size={25} strokeWidth={2} />
          <Text style={[styles.bannertext, { color: "#5164C8" }]}>Feature</Text>
        </View>
        <Text style={styles.title}>v1.3.2</Text>
        <Text style={styles.text}>Improved home screen and </Text>
        <Text style={styles.text}>minor improvements</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.3.1</Text>
        <Text style={styles.text}>New home screen and </Text>
        <Text style={styles.text}>new animation and weather display</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.3.0</Text>
        <Text style={styles.text}>New update log and </Text>
        <Text style={styles.text}>new account screen</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.8</Text>
        <Text style={styles.text}>Better design and </Text>
        <Text style={styles.text}>new login screen</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.7</Text>
        <Text style={styles.text}>Security improvement and </Text>
        <Text style={styles.text}>und kleinere Verbesserung</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.6</Text>
        <Text style={styles.text}>Account löschen verbessert </Text>
        <Text style={styles.text}>and minor improvements</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.4</Text>
        <Text style={styles.text}>Delete account via email </Text>
        <Text style={styles.text}>
          disabled, new account deletion system, and minor improvements
        </Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.3</Text>
        <Text style={styles.text}>New backend, minor improvements</Text>
        <Text style={styles.text}>,new home screen and</Text>
        <Text style={styles.text}>delete account via email</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.2</Text>
        <Text style={styles.text}>Map search function</Text>
        <Text style={styles.text}>and minor improvements</Text>
        <Text style={styles.text}></Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.1</Text>
        <Text style={styles.text}>Account, authentication</Text>
        <Text style={styles.text}>and login options</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.0</Text>
        <Text style={styles.text}>The card has been added and</Text>
        <Text style={styles.text}>beta release of the app</Text>
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
    banner: {
      alignItems: "center",
      flexDirection: "row",
      position: 'absolute',
      left: -14,
      top: -16,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    bannertext: {
      fontWeight: "700",
      fontSize: 20,
      paddingLeft: 8,
    },
  });
