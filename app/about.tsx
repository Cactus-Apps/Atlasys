import { t } from "i18next";
import * as React from "react";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
import "./i18n";

const about = () => {
  return (
    <SafeAreaView>
      <View>
        <Text style={styles.title}>{t("about_us")}</Text>
        <Text> </Text>
        <View style={styles.imagecontainer}>
          <Image source={require("../assets/images/cactus_apps_icon.jpeg")} style={styles.image}/>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default about;

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: 30,
    paddingTop: 40,
    alignSelf: 'center',
  },
  imagecontainer: {
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginLeft: 240,
    marginTop: 25,
  },
});
