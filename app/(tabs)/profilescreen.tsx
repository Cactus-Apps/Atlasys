// Version 1.3.6 - © Cactus Apps 2026
import { Avatar } from "@kolking/react-native-avatar";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Download,
  Info,
  MapIcon,
  MessageCircleQuestionMark,
  SettingsIcon,
  ShieldUser,
  UserIcon,
  UserRound,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "@/lib/auth/supabase";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { useAppTheme } from "@/lib/theme";
import * as Application from "expo-application";
import { UpdateBanner } from "@/components/UpdateBanner";

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState<string | undefined>("");
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const version = Application.nativeApplicationVersion;

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
          sub: "Sign out and Account details",
          icon: UserRound,
          color: theme.primary,
          bg: theme.primaryLight,
          route: "/account",
        },
        {
          label: "Privacy & Settings",
          sub: "Manage your settings",
          icon: SettingsIcon,
          color: theme.purple,
          bg: theme.purpleLight,
          route: "/settings",
        },
        {
          label: "Notifications",
          sub: "Customize your alerts",
          icon: Bell,
          color: theme.success,
          bg: theme.successLight,
          route: "/notifications",
        },
      ],
    },
    {
      group: "OFFLINE MAPS",
      items: [
        {
          label: "Offline Maps",
          sub: "Manage your offline Maps",
          icon: Download,
          color: theme.info,
          bg: theme.infoLight,
          route: "/OfflineMapsTab",
        },
      ],
    },
    {
      group: "Tools",
      items: [
        {
          label: "Just a Map Mode",
          sub: "It's a Map",
          icon: MapIcon,
          color: theme.success,
          bg: theme.successLight,
          route: "/just_map",
        },
      ],
    },
    {
      group: "APP INFO",
      items: [
        {
          label: t("Help_&_Feedback"),
          sub: "Give Feedback and get Help",
          icon: MessageCircleQuestionMark,
          color: theme.warningDark,
          bg: theme.warningLight,
          route: "/help_feedback",
        },
        {
          label: t("Info"),
          sub: "Info about the App",
          icon: Info,
          color: theme.info,
          bg: theme.infoLight,
          route: "/info",
        },
        {
          label: t("Admin_Panel"),
          sub: "Not for you 🤨 !",

          icon: ShieldUser,
          color: theme.danger,
          bg: theme.dangerLight,
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
                badgeColor={theme.primary}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
              <TouchableOpacity style={styles.badge} activeOpacity={0.8}>
                <UserIcon size={12} color={theme.white} fill={theme.white} />
                <Text style={styles.badgeText}>Normal User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        <UpdateBanner />

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
                            backgroundColor: theme.isDark
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
                        color={theme.chevronColor}
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
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.footerText}>Version {version} • Atlasys </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    primary,
    white,
    chevronColor,
  } = theme;

  const defaultRadius = isModern ? 24 : 20;
  const innerRadius = isModern ? 16 : 12;

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
      backgroundColor: cardBg,
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
      backgroundColor: primary,
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
      gap: 4,
    },
    badgeText: {
      color: white,
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
      borderRadius: defaultRadius,
      borderWidth: 1,
      borderColor: borderColor,
      overflow: "hidden",
      shadowColor: theme.black,
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.06) : 0,
      shadowRadius: isModern ? 12 : 0,
      elevation: isModern ? 4 : 0,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      paddingVertical: isModern ? 20 : 16,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: innerRadius,
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
      color: chevronColor,
      fontWeight: "600",
    },
  });
};

export default ProfileScreen;
