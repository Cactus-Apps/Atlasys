import * as React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import {
  ChevronRight,
  Github,
  Mail,
  MessageSquare,
  LifeBuoy,
  ChevronLeft,
  TriangleAlertIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react-native";

const HelpFeedback = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const styles = getStyles(theme);

  const openGithub = () => {
    Linking.openURL("https://github.com/Cactus-Apps/Atlasys/issues/new").catch(
      (err) => Sentry.captureException(err),
    );
  };

  const openEmail = () => {
    Linking.openURL("mailto:cactus_apps@proton.me").catch((err) =>
      Sentry.captureException(err),
    );
  };

  const handleBug = () => {
    Sentry.setTag("type", "bug");
    Sentry.showFeedbackWidget();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/profilescreen")}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Help_and_Feedback")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <LifeBuoy size={48} color={theme.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.heroTitle}>{t("Help_hero_title")}</Text>
          <Text style={styles.heroSub}>{t("Help_hero_sub")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Help_section_contact")}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={openGithub}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: theme.cardBgSecondary },
                ]}
              >
                <Github size={22} color={theme.subTextColor} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>
                  {t("Help_github_report_label")}
                </Text>
                <Text style={styles.menuSub}>
                  {t("Help_github_report_sub")}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.chevronColor} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleBug}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: theme.dangerLight },
                ]}
              >
                <TriangleAlertIcon size={22} color={theme.danger} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>
                  {t("Help_bug_report_label")}
                </Text>
                <Text style={styles.menuSub}>{t("Help_bug_report_sub")}</Text>
              </View>
              <ChevronRight size={18} color={theme.chevronColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Help_section_support")}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={openEmail}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: theme.purpleLight },
                ]}
              >
                <Mail size={22} color={theme.purple} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>{t("Help_email_label")}</Text>
                <Text style={styles.menuSub}>cactus_apps@proton.me</Text>
              </View>
              <ChevronRight size={18} color={theme.chevronColor} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.navigate("/feature_request")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: theme.successLight },
                ]}
              >
                <MessageSquare size={22} color={theme.success} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>
                  {t("Help_feature_requests_label")}
                </Text>
                <Text style={styles.menuSub}>
                  {t("Help_feature_requests_sub")}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.chevronColor} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    primaryLight,
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
    },
    content: {
      padding: 24,
      paddingBottom: 40,
    },
    heroSection: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 20,
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: isModern ? 32 : 48,
      backgroundColor: isModern ? theme.iconBg : primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: "900",
      color: textColor,
      letterSpacing: -0.5,
    },
    heroSub: {
      fontSize: 15,
      color: subTextColor,
      textAlign: "center",
      marginTop: 8,
      paddingHorizontal: 20,
      fontWeight: "500",
    },
    section: {
      marginBottom: 24,
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
      padding: 8,
      borderWidth: 1,
      borderColor: borderColor,
      elevation: 3,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
    },
    menuIcon: {
      width: 44,
      height: 44,
      borderRadius: isModern ? 16 : 12,
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
    menuSub: {
      fontSize: 13,
      color: subTextColor,
      marginTop: 2,
    },
    separator: {
      height: 1,
      backgroundColor: borderColor,
      marginHorizontal: 12,
    },
  });
};

export default HelpFeedback;
