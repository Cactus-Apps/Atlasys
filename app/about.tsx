import { t } from "i18next";
import * as React from "react";
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import "./i18n";

const about = () => {
  return (
    <SafeAreaView>
      <ScrollView>
        <Text style={styles.title}>{t("about_gps")}</Text>
        <Text
          style={{
            fontSize: 26,
            alignSelf: "center",
            fontWeight: "600",
            paddingVertical: 20,
            paddingTop: 30,
          }}
        >
          Development
        </Text>
        <View
          style={{
            height: 1,
            backgroundColor: "#ccc",
            alignSelf: "stretch",
            marginVertical: 16,
          }}
        />
        <View style={styles.all1}>
          <Image
            source={require("../assets/images/cactus_apps-logo.png")}
            style={styles.image}
          />
          <View>
          <Text
            style={styles.link}
            onPress={() =>
              Linking.openURL("https://github.com/Cactus-Apps/GPS")
            }
          >
            &copy; Cactus Apps
          </Text>
          <Text style={{fontSize: 15, paddingLeft: 18, fontWeight: '600'}}>We are Cactus Apps, a company {"\n"} 
             that develops apps with a focus {"\n"} 
             on customer satisfaction.</Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: 26,
            alignSelf: "center",
            fontWeight: "600",
            paddingVertical: 20,
          }}
        >
          Credits
        </Text>
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
            onPress={() =>
              Linking.openURL("https://www.maptiler.com/copyright/")
            }
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default about;

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: 30,
    paddingTop: 40,
    alignSelf: "center",
    fontWeight: "600",
  },
  imagecontainer: {},
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginLeft: 30,
    marginTop: 30,
  },
  maptiler: {},
  link: {
    fontSize: 15,
    fontWeight: "600",
    paddingLeft: 25,
    textDecorationLine: "underline",
  },
  all1: {
    flexDirection: "row",
    alignItems: "center",
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
