import { t } from "i18next";
import * as React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const updatelog = () => {
  return (
    <ScrollView style={styles.view}>
      <View style={styles.container}>
        <Text style={styles.text}>v1.0.8</Text>
        <Text>{t("v1.0.8")}</Text>
        <Text>{t("v1.0.82")}</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.text}>v1.0.9</Text>
        <Text> Die Map wurder hinzugefügt und kleiner Fehler</Text>
        <Text> wurden behoben. </Text>
      </View>
    </ScrollView>
  );
};

export default updatelog;

const styles = StyleSheet.create({
  view: {},
  container: {
    top: 50,
    borderRadius: 8,
    borderColor: "#292828ff",
    borderWidth: 1,
    padding: 20,
    alignSelf: "center",
    marginBottom: 12,
  },
  text: {
    fontSize: 23,
    paddingBottom: 3,
    alignSelf: "center",
  },
});
