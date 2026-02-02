// Version 1.3.6 - © Cactus Apps 2025
import { Avatar } from "@kolking/react-native-avatar";
import { useRouter } from "expo-router";
import {
  Bell,
  Bolt,
  ChevronRight,
  CreditCard,
  HeartHandshake,
  Info,
  MessageCircleQuestionMark,
  Rocket,
  ShieldCheck,
  ShieldUser,
  TestTube,
  TestTube2,
  User,
  UserRound,
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
import { supabase } from "@/lib/auth/supabase";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";

export function ProfileScreen() {
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

  let username = email ? email.split("@")[0] : "";

  let name = username
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <GestureHandlerRootView>
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarView}>
            <Avatar
              size={85}
              name={email ?? undefined}
              email={email ?? undefined}
              colorize={true}
              radius={100}
              badgeColor="#146275ff"
              defaultSource={require("@/assets/images/icon.png")}
            />
          </View>
          <View style={styles.emailName}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <View style={{paddingHorizontal: 10,paddingVertical: 10}}>
            <Text style={{ color: "#737B87", fontSize: 13, fontWeight: "500" }}>
              ACCOUNT SETTINGS
            </Text>
          </View>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 15,
              paddingVertical: 5,
            }}
          >
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 50,
                backgroundColor: "#E0E7FF",
              }}
            >
              <UserRound color={"#4F46E5"} size={26} strokeWidth={3} />
            </View>
            <View style={{ paddingHorizontal: 18 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600" }}>
                Edit Profile
              </Text>
              <Text
                style={{ color: "#737B87", fontSize: 16, fontWeight: "500" }}
              >
                Update your photo and details
              </Text>
            </View>
            <ChevronRight style={styles.arrow} />
          </TouchableOpacity>
          <View style={styles.line} />
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 15,
              paddingVertical: 5,
            }}
          >
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 50,
                backgroundColor: "#F3E8FF",
              }}
            >
              <ShieldCheck color={"#9333EA"} size={26} strokeWidth={3} />
            </View>
            <View style={{ paddingHorizontal: 18 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600" }}>
                Privacy & Security
              </Text>
              <Text
                style={{ color: "#737B87", fontSize: 16, fontWeight: "500" }}
              >
                Manage your privacy settings
              </Text>
            </View>
            <ChevronRight style={styles.arrow} />
          </TouchableOpacity>
          <View style={styles.line} />
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 15,
              paddingVertical: 5,
            }}
          >
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 50,
                backgroundColor: "#DBEAFE",
              }}
            >
              <Bell color={"#2563EB"} size={26} strokeWidth={3} />
            </View>
            <View style={{ paddingHorizontal: 18 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600" }}>
                Notification
              </Text>
              <Text
                style={{ color: "#737B87", fontSize: 16, fontWeight: "500" }}
              >
                Customize notification preferences
              </Text>
            </View>
            <ChevronRight style={styles.arrow} />
          </TouchableOpacity>
          <View style={styles.line} />
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 15,
              paddingVertical: 5,
            }}
          >
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 50,
                backgroundColor: "#DCFCE7",
              }}
            >
              <CreditCard color={"#16A34A"} size={26} strokeWidth={3} />
            </View>
            <View style={{ paddingHorizontal: 18 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600" }}>
                Billing & Plans
              </Text>
              <Text
                style={{ color: "#737B87", fontSize: 16, fontWeight: "500" }}
              >
                Manage subscription and payment
              </Text>
            </View>
            <ChevronRight style={styles.arrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.page}
            onPress={() => router.navigate("/account")}
          >
            <User strokeWidth={2.5} style={styles.icon} />
            <Text style={styles.link}>{t("Profile")}</Text>
            <ChevronRight style={styles.arrow} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.page}
            onPress={() => router.navigate("/settings")}
          >
            <Bolt strokeWidth={2.5} style={styles.icon} />
            <Text style={styles.link}>{t("Settings")}</Text>
            <ChevronRight style={styles.arrow} />
          </TouchableOpacity>
          <View style={styles.line} />
          <TouchableOpacity
            style={styles.page}
            onPress={() => router.navigate("/help_feedback")}
          >
            <MessageCircleQuestionMark strokeWidth={2.5} style={styles.icon} />
            <Text style={styles.link}>{t("Help_&_Feedback")}</Text>
            <ChevronRight style={styles.arrow} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.page}
            onPress={() => router.navigate("/info")}
          >
            <Info strokeWidth={2.5} style={styles.icon} />
            <Text style={styles.link}>{t("Info")}</Text>
            <ChevronRight style={styles.arrow} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.page}
            onPress={() => router.navigate("/AdminPanel")}
          >
            <ShieldUser strokeWidth={2.5} style={styles.icon} />
            <Text style={styles.link}>{t("Admin_Panel")}</Text>
            <ChevronRight style={styles.arrow} />
          </TouchableOpacity>
          <View>
            <TouchableOpacity
              style={styles.page}
              onPress={() => router.navigate("/test")}
            >
              <TestTube strokeWidth={2.5} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.page}
              onPress={() => router.navigate("/test2")}
            >
              <TestTube2 strokeWidth={2.5} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
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
      height: 0.7,
      backgroundColor: "#ccc",
      alignSelf: "stretch",
      marginVertical: 12,
      marginHorizontal: 16,
    },
    image: {
      width: 200,
      height: 100,
      marginTop: 25,
      justifyContent: "center",
      alignSelf: "center",
    },
    profileHeader: {
      backgroundColor: "#222222",
      padding: 30,
      paddingTop: 40,
      flexDirection: "row",
    },
    avatarView: {
      alignSelf: "flex-start",
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
    emailName: {
      paddingHorizontal: 15,
      paddingVertical: 3,
    },
  });

export default ProfileScreen;
