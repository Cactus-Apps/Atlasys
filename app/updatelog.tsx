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
        <Text style={styles.title}>v1.1.9</Text>
        <Text style={styles.text}>{t("v1.1.9")}</Text>
        <Text style={styles.text}>{t("v1.1.92")}</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>v1.2.0</Text>
        <Text style={styles.text}>{t("v1.2.0")}</Text>
        <Text style={styles.text}>{t("v1.2.02")}</Text>
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
