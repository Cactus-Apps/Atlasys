import { useRouter } from "expo-router";
import {
  Bolt,
  Bug,
  ChevronRight,
  Info,
  List,
  TestTube,
  User,
  Users,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "./i18n.js";


function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.all}>
      <View>
        <View style={styles.placeholder} />
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/account")}
        >
          <User style={styles.icon} />
          <Text style={styles.link}>{t("profile")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/settings")}
        >
          <Bolt style={styles.icon} />
          <Text style={styles.link}>{t("settings")}</Text>
        </TouchableOpacity>
        <View style={styles.line} />
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/updatelog")}
        >
          <List style={styles.icon} />
          <Text style={styles.link}>{t("update_log")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/about")}
        >
          <Info style={styles.icon} />
          <Text style={styles.link}>{t("about_gps")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/bugreport")}
        >
          <Bug style={styles.icon} />
          <Text style={styles.link}>{t("bug_report")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/invite")}
        >
          <Users style={styles.icon} />
          <Text style={styles.link}>{t("invite")}</Text>
        </TouchableOpacity>
        <View style={styles.line} />
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/test")}
        >
          <TestTube style={styles.icon} />
          <Text style={styles.link}>{t("test")}</Text>
        </TouchableOpacity>
      </View>
      <View>
        <View style={styles.placeholder} />
        <TouchableOpacity onPress={() => router.navigate("/account")}>
        <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
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
        <View style={styles.line} />
        <TouchableOpacity onPress={() => router.navigate("/test")}>
        <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  all: {
    flexDirection: "row",
  },
  placeholder: {
    marginTop: 34,
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
});

export default ProfileScreen;
