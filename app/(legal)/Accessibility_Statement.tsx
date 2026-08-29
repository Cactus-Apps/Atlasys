import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { router } from "expo-router";
import { ChevronLeft, Accessibility } from "lucide-react-native";
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

const ACCESS_SECTION_COUNT = 5;

export default function Accessibility_Statement() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const sections = useMemo(
    () =>
      Array.from({ length: ACCESS_SECTION_COUNT }, (_, i) => ({
        title: t(`Access_${i}_title`),
        content: t(`Access_${i}_content`),
      })),
    [t],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("Accessibility_statement_title")}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBanner}>
          <View style={styles.introIconWrap}>
            <Accessibility size={28} color="#00C4B4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>
              {t("Accessibility_statement_title")}
            </Text>
            <Text style={styles.introSub}>{t("Access_intro")}</Text>
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
          <Text style={styles.footerTitle}>{t("Access_feedback_title")}</Text>
          <Text style={styles.footerContent}>
            {t("Access_feedback_content")}
          </Text>
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
      gap: 8,
    },
    footerTitle: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: textColor,
    },
    footerContent: {
      fontSize: 13,
      color: subTextColor,
      lineHeight: 20,
    },
  });
};