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
      <View style={styles.placeholder} />
      <TouchableOpacity
        style={styles.page}
        onPress={() => router.navigate("/account")}
      >
        <User style={styles.icon} />
        <Text style={styles.link}>{t("profile")}</Text>
        <ChevronRight style={styles.arrow1} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.page}
        onPress={() => router.navigate("/settings")}
      >
        <Bolt style={styles.icon} />
        <Text style={styles.link}>{t("settings")}</Text>
        <ChevronRight style={styles.arrow2} />
      </TouchableOpacity>
      <View style={styles.placeholderk} />
      <View style={styles.line} />
      <TouchableOpacity
        style={styles.page}
        onPress={() => router.navigate("/updatelog")}
      >
        <List style={styles.icon} />
        <Text style={styles.link}>{t("update_log")}</Text>
        <ChevronRight style={styles.arrow3} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.page}
        onPress={() => router.navigate("/about")}
      >
        <Info style={styles.icon} />
        <Text style={styles.link}>{t("about_gps")}</Text>
        <ChevronRight style={styles.arrow4} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.page}
        onPress={() => router.navigate("/bugreport")}
      >
        <Bug style={styles.icon} />
        <Text style={styles.link}>{t("bug_report")}</Text>
        <ChevronRight style={styles.arrow5} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.page}
        onPress={() => router.navigate("/invite")}
      >
        <Users style={styles.icon} />
        <Text style={styles.link}>{t("invite")}</Text>
        <ChevronRight style={styles.arrow7} />
      </TouchableOpacity>
      <View style={styles.placeholderk} />
      <View style={styles.line} />
      <TouchableOpacity
        style={styles.page}
        onPress={() => router.navigate("/test")}
      >
        <TestTube style={styles.icon} />
        <Text style={styles.link}>{t("test")}</Text>
        <ChevronRight style={styles.arrow6} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: "#ccc",
    alignSelf: "stretch",
    marginVertical: 12,
    marginHorizontal: 17,
  },
  page: {
    flexDirection: "row",
    marginLeft: 35,
    marginTop: 17,
    alignItems: "center",
  },
  link: {
    fontSize: 21,
    fontWeight: "600",
  },
  icon: {
    marginRight: 28,
    marginVertical: 8,
    flexDirection: "column",
  },
  placeholder: {
    marginTop: 23,
  },
  arrow: {
    marginHorizontal: 70,
  },
  all: {
    flexDirection: "column",
  },
  arrow1: {
    marginLeft: 168,
  },
  arrow2: {
    marginLeft: 154,
  },
  arrow3: {
    marginLeft: 154,
  },
  arrow4: {
    marginLeft: 129,
  },
  arrow5: {
    marginLeft: 126,
  },
  arrow6: {
    marginLeft: 196,
  },
  arrow7: {
    marginLeft: 103,
  },
  placeholderk: {
    marginVertical: 10,
  },
});

export default ProfileScreen;
