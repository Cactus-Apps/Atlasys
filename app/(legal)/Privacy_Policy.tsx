import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Shield } from "lucide-react-native";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";

const PRIVACY_SECTION_COUNT = 11;

export default function Privacy_Policy() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const sections = useMemo(
    () =>
      Array.from({ length: PRIVACY_SECTION_COUNT }, (_, i) => ({
        title: t(`PP_${i}_title`),
        content: t(`PP_${i}_content`),
      })),
    [t],
  );

  const params = useLocalSearchParams<{ from?: string }>();
  const fromConsent = params.from === "consent";

  const handleBack = () => {
    if (fromConsent) {
      router.replace({
        pathname: "/onboarding",
        params: { showConsent: "true" },
      });
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Privacy_policy_title")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBanner}>
          <View style={styles.introIconWrap}>
            <Shield size={28} color="#00C4B4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>{t("Privacy_intro_title")}</Text>
            <Text style={styles.introSub}>{t("Privacy_intro_sub")}</Text>
            <Text style={styles.introSub}>{t("PP_0_heading")}</Text>
          </View>
        </View>

        {sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
            {i < sections.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("Legal_footer_questions")}</Text>
          <Text style={styles.footerText}>{t("Legal_footer_source")}</Text>
        </View>
      </ScrollView>
    </View>
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
  } = theme;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop:
        Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ?? 24) + 12,
      backgroundColor: cardBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: borderColor,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: textColor,
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 48,
    },
    introBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: "rgba(0,196,180,0.10)",
      borderWidth: 1,
      borderColor: "rgba(0,196,180,0.30)",
      borderRadius: isModern ? 18 : 12,
      padding: 16,
      marginBottom: 24,
    },
    introIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(0,196,180,0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    introTitle: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: textColor,
      marginBottom: 3,
    },
    introSub: {
      fontSize: 13,
      color: subTextColor,
      lineHeight: 18,
    },
    section: {
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: textColor,
      marginBottom: 8,
      letterSpacing: 0.2,
    },
    sectionContent: {
      fontSize: 14,
      color: subTextColor,
      lineHeight: 22,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: borderColor,
      marginVertical: 20,
    },
    footer: {
      marginTop: 28,
      paddingTop: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: borderColor,
      gap: 6,
      alignItems: "center",
    },
    footerText: {
      fontSize: 12,
      color: subTextColor,
      textAlign: "center",
    },
  });
};
