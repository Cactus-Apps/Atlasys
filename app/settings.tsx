import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import "./i18n";


const settings = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: any) => {
    i18n.changeLanguage(lng);
  };

  const handlePress = () => {
    () => changeLanguage("de");
  };

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name="settings-outline" size={35} color="black" />
        <Text style={styles.title}>{t("settings")}</Text>
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: "#ccc",
          alignSelf: "stretch",
          marginVertical: 16,
        }}
      />
      <TouchableOpacity style={styles.button} onPress={() => changeLanguage("de")}>
        <Text style={styles.text}>{t("german")}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => changeLanguage("en")}
      >
        <Text style={styles.text}>{t("english")}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default settings;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  button: {
    backgroundColor: "#466483ff",
    borderRadius: 8,
    marginBottom: 12,
  },
  text: {
    fontSize: 22,
    padding: 14,
    paddingHorizontal: 90,
    color: "#ffffffff",
  },
  icon: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 52,
  },
  title: {
    fontSize: 35,
    marginLeft: 15,
  },
});
