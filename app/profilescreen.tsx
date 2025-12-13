import { Avatar } from "@kolking/react-native-avatar";
import { useRouter } from "expo-router";
import {
  Bolt,
  ChevronRight,
  HeartHandshake,
  Info,
  MessageCircleQuestionMark,
  ShieldUser,
  User
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import "./i18n.js";

function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState<string | undefined>("");
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setEmail(user?.email);
    };

    fetchUserEmail();
  }, []);

  let username = email!.split("@")[0];

  let name = username
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileHeader}>
        <Avatar
          size={80}
          name={email ?? undefined}
          email={email ?? undefined}
          colorize={true}
          radius={100}
          badgeColor="#146275ff"
          defaultSource={require("../assets/images/icon.png")}
        />
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
      </View>

      <View style={styles.menuContainer}>
        <View style={styles.placeholder} />
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/account")}
        >
          <User strokeWidth={2.5} style={styles.icon} />
          <Text style={styles.link}>{t("profile")}</Text>
          <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/settings")}
        >
          <Bolt strokeWidth={2.5} style={styles.icon} />
          <Text style={styles.link}>{t("settings")}</Text>
          <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
        <View style={styles.line} />
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/test2")}
        >
          <MessageCircleQuestionMark strokeWidth={2.5} style={styles.icon} />
          <Text style={styles.link}>Help & Feedback</Text>
          <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/info")}
        >
          <Info strokeWidth={2.5} style={styles.icon} />
          <Text style={styles.link}>Info</Text>
          <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/support")}
        >
          <HeartHandshake strokeWidth={2.5} style={styles.icon} />
          <Text style={styles.link}>Support</Text>
          <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.page}
          onPress={() => router.navigate("/AdminPanel")}
        >
          <ShieldUser strokeWidth={2.5} style={styles.icon} />
          <Text style={styles.link}>{t("Admin Panel")}</Text>
          <ChevronRight style={styles.arrow} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    page: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    icon: {
      marginRight: 15,
      color: scheme === "dark" ? "#d8d8d8" : "#000",
      width: 24,
      height: 24,
    },
    link: {
      flex: 1,
      fontSize: 18,
      fontWeight: "600",
      color: scheme === "dark" ? "#d8d8d8" : "#000",
      flexShrink: 1,
      flexWrap: "wrap",
    },
    arrow: {
      width: 20,
      height: 20,
      color: scheme === "dark" ? "#d8d8d8" : "#000",
      marginLeft: 10,
    },
    menuContainer: {
      marginVertical: 10,
      borderRadius: 10,
      overflow: "hidden",
      elevation: 2,
    },
    all: {
      flexDirection: "row",
      backgroundColor: "#121212",
      flex: 1,
    },
    placeholder: {
      marginTop: 8,
    },
    container: {
      flex: 1,
      backgroundColor: "#000",
    },
    line: {
      height: 1,
      backgroundColor: "#ccc",
      alignSelf: "stretch",
      marginVertical: 12,
      marginHorizontal: 0,
    },
    image: {
      width: 200,
      height: 100,
      marginTop: 25,
      justifyContent: "center",
      alignSelf: "center",
    },
    // New
    profileHeader: {
      backgroundColor: "#222222",
      padding: 30,
      paddingTop: 40,
      alignItems: "center",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#4285F4",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },
    profileName: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#fff",
    },
    profileEmail: {
      fontSize: 14,
      color: "gray",
    },
  });

export default ProfileScreen;
