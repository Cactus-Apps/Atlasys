import { useRouter } from "expo-router";
import {
  Bolt,
  Bug,
  ChevronRight,
  Info,
  List,
  Users
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import "./i18n.js";


function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView>
      <Image source={require("../assets/images/logo.png")} style={styles.image}/>
      <View style={styles.all}>
      <View>
        <View style={styles.placeholder} />
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/settings")}
        >
          <Bolt strokeWidth={3} style={styles.icon} />
          <Text style={styles.link}>{t("settings")}</Text>
        </TouchableOpacity>
        <View style={styles.line} />
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/updatelog")}
        >
          <List strokeWidth={3} style={styles.icon} />
          <Text style={styles.link}>{t("update_log")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/about")}
        >
          <Info strokeWidth={3} style={styles.icon} />
          <Text style={styles.link}>{t("about_gps")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/bugreport")}
        >
          <Bug strokeWidth={3} style={styles.icon} />
          <Text style={styles.link}>{t("bug_report")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/invite")}
        >
          <Users strokeWidth={3} style={styles.icon} />
          <Text style={styles.link}>{t("invite")}</Text>
        </TouchableOpacity>
      </View>
      <View>
        <View style={styles.placeholder} />
        <TouchableOpacity onPress={() => router.navigate("/settings")}>
        <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
        <View style={styles.line} />
        <TouchableOpacity onPress={() => router.navigate("/updatelog")}>
        <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate("/about")}>
        <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate("/bugreport")}>
        <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate("/invite")}>
        <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  all: {
    flexDirection: "row",
  },
  placeholder: {
    marginTop: 8,
  },
  line: {
    height: 1,
    backgroundColor: "#ccc",
    alignSelf: "stretch",
    marginVertical: 12,
    marginHorizontal: 0,
  },

  link: {
    fontSize: 21,
    fontWeight: "600",
  },
  page: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginHorizontal: 23,
    marginVertical: 23,
  },
  arrow: {
    paddingHorizontal: 130,
    marginVertical: 23,
  },
  image: {
    width: 200,
    height: 100,
    marginTop: 25,
    justifyContent:'center',
    alignSelf: 'center',
  },
});

export default ProfileScreen;
