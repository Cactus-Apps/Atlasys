// Version 1.3.6 - © Cactus Apps 2026
import { useRouter } from "expo-router";
import { t } from "i18next";
import {
  ChevronRight,
  Copyright,
  List,
  Github,
  Globe,
} from "lucide-react-native";
import * as React from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  ScrollView,
} from "react-native";
import "./i18n";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Info() {
  const scheme = useColorScheme();
  const router = useRouter();
  const isDark = scheme === "dark";
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const textColor = isDark ? "#FFFFFF" : "#1E293B";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate("/(tabs)/profilescreen")} style={styles.backButton}>
          <ChevronRight size={24} color={textColor} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("About GPS")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandingSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../assets/images/cactus_apps-logo.png")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.appName}>Cactus Apps</Text>
          <Text style={styles.tagline}>Premium Mobile Experiences</Text>

          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL("https://github.com/Cactus-Apps/GPS")}
            >
              <Github size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL("https://cactus-apps.dev")}
            >
              <Globe size={20} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Development')}</Text>
          <View style={styles.card}>
            <Text style={styles.descriptionText}>
              {t('We_are_Cactus_Apps')} {t('develops_apps')} {t('customer_satisfaction')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.navigate("/licenses")}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#EEF2FF' }]}>
                <Copyright size={20} color="#4F46E5" />
              </View>
              <Text style={styles.menuLabel}>{t("licenses")}</Text>
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.navigate("/updatelog")}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#F0FDF4' }]}>
                <List size={20} color="#16A34A" />
              </View>
              <Text style={styles.menuLabel}>{t("update_log")}</Text>
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>Version 1.3.6 • © 2025 Cactus Apps</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) => {
  const isDark = scheme === "dark";
  const bg = isDark ? "#0D1117" : "#F8FAFC";
  const cardBg = isDark ? "#161B22" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#1E293B";
  const subTextColor = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";

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
      borderRadius: 24,
      backgroundColor: bg,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
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
      borderRadius: 22,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
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
      borderRadius: 24,
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
      borderRadius: 12,
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
      borderRadius: 16,
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
