import { useRouter } from "expo-router";
import { t } from "i18next";
import {
  ChevronLeft,
  ChevronRight,
  Copyright,
  Heart,
  List,
} from "lucide-react-native";
import * as React from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "./i18n";

const about = () => {
  const scheme = useColorScheme();
  const router = useRouter();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.back}>
            <TouchableOpacity style={styles.backbutton} onPress={router.back}>
              <ChevronLeft
                size={30}
                strokeWidth={2}
                color={scheme === "dark" ? "#d8d8d8ff" : "#000"}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{t("about_gps")}</Text>
        </View>
        <Text style={styles.development}>Development</Text>
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
            <Text style={styles.text}>
              We are Cactus Apps, a company {"\n"}
              that develops apps with a focus {"\n"}
              on customer satisfaction.
            </Text>
          </View>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: "#ccc",
            alignSelf: "stretch",
            marginVertical: 16,
          }}
        />
        <View style={styles.all}>
          <View>
            <TouchableOpacity
              style={styles.page}
              onPress={() => router.navigate("/licenses")}
            >
              <Copyright strokeWidth={3} style={styles.icon} />
              <Text style={styles.link2}>{t("licenses")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.page}
              onPress={() => router.navigate("/updatelog")}
            >
              <List strokeWidth={3} style={styles.icon} />
              <Text style={styles.link2}>{t("update_log")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.page}
              onPress={() => router.navigate("/thanks")}
            >
              <Heart strokeWidth={3} style={styles.icon} />
              <Text style={styles.link2}>Thanks</Text>
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity onPress={() => router.navigate("/licenses")}>
              <ChevronRight style={styles.arrow} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.navigate("/updatelog")}>
              <ChevronRight style={styles.arrow} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.navigate("/thanks")}>
              <ChevronRight style={styles.arrow} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default about;

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    all: {
      flexDirection: "row",
      paddingTop: 20,
      paddingBottom: 50,
      marginLeft: 16,
    },
    title: {
      fontSize: 30,
      fontWeight: "600",
      alignSelf: "center",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
      marginLeft: 66,
    },
    arrow: {
      paddingHorizontal: 180,
      marginVertical: 23,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    button: {
      fontSize: 21,
      fontWeight: "600",
      borderRadius: 8,
      backgroundColor: "#466483ff",
      color: scheme === "dark" ? "#d8d8d8ff" : "#fff",
      paddingHorizontal: 35,
      paddingVertical: 12,
      alignSelf: "center",
    },
    page: {
      flexDirection: "row",
      alignItems: "center",
    },
    icon: {
      marginHorizontal: 23,
      marginVertical: 23,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },

    credits: {
      fontSize: 26,
      alignSelf: "center",
      fontWeight: "600",
      paddingVertical: 20,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    text: {
      fontSize: 15,
      paddingLeft: 18,
      fontWeight: "600",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    back: {
      paddingLeft: 20,
      alignSelf: "center",
    },
    backbutton: {
      width: 30,
      height: 30,
      borderRadius: 35,
      backgroundColor: "#466583aa",
    },
    header: {
      flexDirection: "row",
      paddingTop: 50,
      paddingBottom: 16,
    },
    development: {
      fontSize: 26,
      alignSelf: "center",
      fontWeight: "600",
      paddingVertical: 20,
      paddingTop: 30,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
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
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    link2: {
      fontSize: 21,
      fontWeight: "600",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
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
