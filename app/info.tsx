import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  Copyright,
  List,
  Github,
  Globe,
  ChevronLeft,
  ScaleIcon,
  ShieldIcon,
  Instagram,
} from "lucide-react-native";
import * as React from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import * as Application from "expo-application";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";

export default function Info() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const version = Application.nativeApplicationVersion ?? "dev";

  const textColor = theme.textColor;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/profilescreen")}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Info_title_about_app")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandingSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../assets/images/icons/cactus_apps-logo.png")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.appName}>{t("Cactus_Apps")}</Text>
          <Text style={styles.tagline}>{t("Info_tagline")}</Text>

          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                Linking.openURL("https://github.com/Cactus-Apps/Atlasys")
              }
            >
              <Github size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL("https://atlasys.vercel.app/")}
            >
              <Globe size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                Linking.openURL("https://www.instagram.com/atlasys.app")
              }
            >
              <Instagram size={20} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Development")}</Text>
          <View style={styles.card}>
            <Text style={styles.descriptionText}>
              {t("We_are_Cactus_Apps")} {t("develops_apps")}{" "}
              {t("Customer_satisfaction_suffix")}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Info_section_legal")}</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.navigate("/(legal)/Privacy_Policy")}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: "rgba(0,196,180,0.15)" },
                ]}
              >
                <ShieldIcon size={20} color={"#00C4B4"} />
              </View>
              <Text style={styles.menuLabel}>
                {t("Info_menu_privacy_policy")}
              </Text>
              <ChevronRight size={18} color={theme.chevronColor} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.navigate("/(legal)/Terms_of_Use")}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: "rgba(59,130,246,0.15)" },
                ]}
              >
                <ScaleIcon size={20} color={"#3B82F6"} />
              </View>
              <Text style={styles.menuLabel}>
                {t("Info_menu_terms_of_use")}
              </Text>
              <ChevronRight size={18} color={theme.chevronColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Info_section_resources")}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.navigate("/licenses")}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: theme.purpleLight },
                ]}
              >
                <Copyright size={20} color={theme.purple} />
              </View>
              <Text style={styles.menuLabel}>{t("Licenses_screen_title")}</Text>
              <ChevronRight size={18} color={theme.chevronColor} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.navigate("/updatelog")}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: theme.successLight },
                ]}
              >
                <List size={20} color={theme.success} />
              </View>
              <Text style={styles.menuLabel}>{t("Info_menu_update_log")}</Text>
              <ChevronRight size={18} color={theme.chevronColor} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>
          {t("Info_version_footer", { version, year: 2026 })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    cardBgSecondary,
    textColor,
    subTextColor,
    borderColor,
    iconBg,
    isModern,
  } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: textColor,
    },
    backButton: {
      padding: 8,
      borderRadius: 12,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    brandingSection: {
      alignItems: "center",
      paddingVertical: 40,
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    logoWrapper: {
      width: 100,
      height: 100,
      borderRadius: isModern ? 28 : 24,
      backgroundColor: bg,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.1) : 0,
      shadowRadius: isModern ? 20 : 0,
      elevation: isModern ? 5 : 0,
      marginBottom: 20,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 16,
    },
    appName: {
      fontSize: 28,
      fontWeight: "900",
      color: textColor,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 14,
      color: subTextColor,
      fontWeight: "600",
      marginTop: 4,
    },
    socialLinks: {
      flexDirection: "row",
      gap: 16,
      marginTop: 24,
    },
    socialButton: {
      width: 44,
      height: 44,
      borderRadius: isModern ? 16 : 22,
      backgroundColor: isModern ? iconBg : cardBgSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: borderColor,
    },
    section: {
      padding: 24,
      paddingBottom: 0,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: 12,
      marginLeft: 4,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: isModern ? 32 : 24,
      padding: 20,
      borderWidth: 1,
      borderColor: borderColor,
    },
    descriptionText: {
      fontSize: 15,
      lineHeight: 24,
      color: textColor,
      fontWeight: "500",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: isModern ? 14 : 12,
      alignItems: "center",
      justifyContent: "center",
    },
    menuLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
      marginLeft: 16,
    },
    separator: {
      height: 1,
      backgroundColor: borderColor,
      marginVertical: 4,
    },
    bannerRow: {
      flexDirection: "row",
      padding: 24,
      gap: 12,
    },
    banner: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: isModern ? 20 : 16,
      gap: 8,
    },
    bannerText: {
      fontWeight: "800",
      fontSize: 14,
    },
    versionText: {
      textAlign: "center",
      fontSize: 12,
      color: subTextColor,
      fontWeight: "600",
      marginTop: 20,
    },
  });
};
