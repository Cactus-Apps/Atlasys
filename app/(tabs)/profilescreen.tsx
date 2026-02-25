// Version 1.3.6 - © Cactus Apps 2026
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
    scheme === "light" || scheme === "dark" ? scheme : null,
  );

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setEmail(user?.email);
    };

    fetchUserEmail();
  }, []);

  let username = email ? email.split("@")[0] : "User";

  let name = username
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const menuItems: {
    group: string;
    items: {
      label: string;
      sub?: string;
      icon: any;
      color: string;
      bg: string;
      route: string;
    }[];
  }[] = [
    {
      group: "ACCOUNT SETTINGS",
      items: [
        {
          label: "Edit Profile",
          sub: "Update your photo and details",
          icon: UserRound,
          color: "#4F46E5",
          bg: "#EEF2FF",
          route: "/account",
        },
        {
          label: "Privacy & Security",
          sub: "Manage your privacy settings",
          icon: ShieldCheck,
          color: "#9333EA",
          bg: "#F5F3FF",
          route: "/settings",
        },
        {
          label: "Notifications",
          sub: "Customize your alerts",
          icon: Bell,
          color: "#2563EB",
          bg: "#EFF6FF",
          route: "/notifications",
        },
        {
          label: "Billing & Plans",
          sub: "Manage subscription and payment",
          icon: CreditCard,
          color: "#16A34A",
          bg: "#F0FDF4",
          route: "/paywall",
        },
      ],
    },
    {
      group: "APP INFO",
      items: [
        {
          label: t("Help_&_Feedback"),
          icon: MessageCircleQuestionMark,
          color: "#EA580C",
          bg: "#FFF7ED",
          route: "/help_feedback",
        },
        {
          label: t("Info"),
          icon: Info,
          color: "#0284C7",
          bg: "#F0F9FF",
          route: "/info",
        },
        {
          label: t("Admin_Panel"),
          icon: ShieldUser,
          color: "#DC2626",
          bg: "#FEF2F2",
          route: "/AdminPanel",
        },
      ],
    },
  ];

  return (
    <GestureHandlerRootView>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
          <TouchableOpacity onPress={() => router.navigate("/account")}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Avatar
              size={90}
              name={email ?? "U"}
              email={email ?? undefined}
              colorize={true}
              radius={45}
              badgeColor="#2563EB"
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <TouchableOpacity style={styles.badge} activeOpacity={0.8}>
              <Rocket size={12} color="#fff" fill="#fff" />
              <Text style={styles.badgeText}>Premium User</Text>
            </TouchableOpacity>
          </View>
        </View>
        </TouchableOpacity>

        <View style={styles.listContainer}>
          {menuItems.map((group, gIdx) => (
            <View key={gIdx} style={styles.group}>
              <Text style={styles.groupTitle}>{group.group}</Text>
              <View style={styles.groupContent}>
                {group.items.map((item, iIdx) => (
                  <React.Fragment key={iIdx}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      activeOpacity={0.7}
                      onPress={() => router.navigate(item.route as any)}
                    >
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor:
                              scheme === "dark"
                                ? "rgba(255,255,255,0.05)"
                                : item.bg,
                          },
                        ]}
                      >
                        <item.icon
                          color={item.color}
                          size={22}
                          strokeWidth={2.5}
                        />
                      </View>
                      <View style={styles.menuTextContainer}>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        {item.sub && (
                          <Text style={styles.menuSubLabel}>{item.sub}</Text>
                        )}
                      </View>
                      <ChevronRight
                        size={18}
                        color={scheme === "dark" ? "#4b5563" : "#94a3b8"}
                        strokeWidth={3}
                      />
                    </TouchableOpacity>
                    {iIdx < group.items.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.navigate("/test")}>
            <Text style={styles.footerText}>Version 1.4.1 • GPS </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) => {
  const isDark = scheme === "dark";
  const bg = isDark ? "#0D1117" : "#F8FAFC";
  const cardBg = isDark ? "#161B22" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#1E293B";
  const subTextColor = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.05)";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    content: {
      paddingBottom: 40,
    },
    profileHeader: {
      padding: 30,
      paddingTop: 60,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#161B22" : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    avatarContainer: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    profileInfo: {
      marginLeft: 20,
      flex: 1,
    },
    profileName: {
      fontSize: 24,
      fontWeight: "800",
      color: textColor,
    },
    profileEmail: {
      fontSize: 14,
      color: subTextColor,
      marginTop: 2,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#2563EB",
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
      gap: 4,
    },
    badgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },
    listContainer: {
      padding: 20,
    },
    group: {
      marginBottom: 25,
    },
    groupTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: subTextColor,
      letterSpacing: 1.5,
      marginBottom: 12,
      marginLeft: 4,
    },
    groupContent: {
      backgroundColor: cardBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: borderColor,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    menuTextContainer: {
      flex: 1,
      marginLeft: 16,
    },
    menuLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
    },
    menuSubLabel: {
      fontSize: 13,
      color: subTextColor,
      marginTop: 2,
    },
    separator: {
      height: 1,
      backgroundColor: borderColor,
      marginLeft: 76,
    },
    footer: {
      alignItems: "center",
      marginTop: 10,
    },
    footerText: {
      fontSize: 12,
      color: "#94a3b8",
      fontWeight: "600",
    },
  });
};

export default ProfileScreen;
