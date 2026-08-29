import { Avatar } from "@avatune/react-native";
import nevmstasTheme from "@avatune/nevmstas-theme/react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Download,
  HardDrive,
  Info,
  MapIcon,
  MessageCircleQuestionMark,
  SettingsIcon,
  UserIcon,
  UserRound,
} from "lucide-react-native";
import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "@/lib/auth/supabase";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { useAppTheme } from "@/lib/theme";
import * as Application from "expo-application";
import { UpdateBanner } from "@/components/overlays/UpdateBanner";
import { useAuthStore } from "@/lib/storage/zustand";
import { fonts } from "@/lib/fonts";

export function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState<string | undefined>("");
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const version = Application.nativeApplicationVersion;
  const avatarConfig = useAuthStore((s) => s.avatarConfig);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setEmail(user?.email);
    };

    fetchUserEmail();
  }, []);

  let username = email ? email.split("@")[0] : t("Profile_default_name");

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
  }[] = useMemo(
    () => [
      {
        group: t("Profile_group_Account_Settings"),
        items: [
          {
            label: t("Profile_edit_profile"),
            sub: t("Profile_edit_profile_sub"),
            icon: UserRound,
            color: theme.primary,
            bg: theme.primaryLight,
            route: "/account",
          },
          {
            label: t("Profile_privacy_settings"),
            sub: t("Profile_privacy_settings_sub"),
            icon: SettingsIcon,
            color: theme.purple,
            bg: theme.purpleLight,
            route: "/settings",
          },
          {
            label: t("Profile_notifications"),
            sub: t("Profile_notifications_sub"),
            icon: Bell,
            color: theme.success,
            bg: theme.successLight,
            route: "/notifications",
          },
        ],
      },
      {
        group: t("Profile_group_Storage"),
        items: [
          {
            label: t("Profile_storage"),
            sub: t("Profile_storage_sub"),
            icon: HardDrive,
            color: theme.info,
            bg: theme.infoLight,
            route: "/OfflineMapsTab",
          },
        ],
      },
      {
        group: t("Profile_group_Tools"),
        items: [
          {
            label: t("Profile_just_map"),
            sub: t("Profile_just_map_sub"),
            icon: MapIcon,
            color: theme.success,
            bg: theme.successLight,
            route: "/just_map",
          },
        ],
      },
      {
        group: t("Profile_group_App_Info"),
        items: [
          {
            label: t("Help_and_Feedback"),
            sub: t("Profile_help_sub"),
            icon: MessageCircleQuestionMark,
            color: theme.warningDark,
            bg: theme.warningLight,
            route: "/help_feedback",
          },
          {
            label: t("Info"),
            sub: t("Profile_info_sub"),
            icon: Info,
            color: theme.info,
            bg: theme.infoLight,
            route: "/info",
          },
        ],
      },
    ],
    [t, theme],
  );

  return (
    <GestureHandlerRootView>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity onPress={() => router.navigate("/account")}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Avatar
                theme={nevmstasTheme}
                seed={email ?? undefined}
                size={90}
                accessories="none"
                hats="none"
                {...(avatarConfig
                  ? Object.fromEntries(
                      Object.entries(avatarConfig).filter(
                        ([k]) => k !== "seed",
                      ),
                    )
                  : {})}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
              <TouchableOpacity style={styles.badge} activeOpacity={0.8}>
                <UserIcon size={12} color={theme.white} fill={theme.white} />
                <Text style={styles.badgeText}>
                  {t("Profile_badge_normal_user")}
                </Text>
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
                          color={theme.white}
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
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.navigate("/settings")}
          >
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
      fontFamily: fonts.displayBold,
      color: textColor,
    },
    profileEmail: {
      fontFamily: fonts.regular,
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
      fontFamily: fonts.semibold,
      color: white,
      fontSize: 11,
    },
    listContainer: {
      padding: 20,
    },
    group: {
      marginBottom: 25,
    },
    groupTitle: {
      fontSize: 12,
      color: subTextColor,
      letterSpacing: 1.5,
      marginBottom: 12,
      marginLeft: 4,
      fontFamily: fonts.semibold,
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
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: textColor,
    },
    menuSubLabel: {
      fontFamily: fonts.regular,
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
      fontFamily: fonts.medium,
      fontSize: 12,
      color: chevronColor,
    },
  });
};

export default ProfileScreen;
