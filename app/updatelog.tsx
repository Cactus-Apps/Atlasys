// Version 1.3.6 - © Cactus Apps 2026
import { t } from "i18next";
import {
  Rocket,
  ChevronRight,
  History,
  Zap,
  Sparkles,
} from "lucide-react-native";
import * as React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import "./i18n";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const UpdateLog = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const router = useRouter();
  const styles = getStyles(isDark);

  const logs = [
    {
      version: "1.3.6",
      date: "2025-02-09",
      text: "Full localization in German, English, and French. UI Overhaul with glassmorphic design system.",
      type: "feature",
    },
    {
      version: "1.3.5",
      date: "2025-01-20",
      text: "New navigation system and expanded translations across most screens.",
      type: "improvement",
    },
    {
      version: "1.3.4",
      date: "2025-01-10",
      text: "New Profile screen and minor performance improvements.",
      type: "improvement",
    },
    {
      version: "1.3.2",
      date: "2024-12-25",
      text: "Improved home screen and weather display animations.",
      type: "feature",
    },
    {
      version: "1.3.1",
      date: "2024-12-15",
      text: "New home screen with advanced animation system.",
      type: "improvement",
    },
    {
      version: "1.3.0",
      date: "2024-12-01",
      text: "Redesigned account and update log screens for better readability.",
      type: "feature",
    },
    {
      version: "1.2.8",
      date: "2024-11-20",
      text: "Security improvements and a new, more secure login flow.",
      type: "improvement",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronRight
            size={24}
            color={isDark ? "#fff" : "#000"}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("update_log")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <History size={40} color="#2563EB" strokeWidth={2.5} />
          <Text style={styles.introTitle}>Version History</Text>
          <Text style={styles.introSub}>See what's new in GPS Explore.</Text>
        </View>

        <View style={styles.timeline}>
          {logs.map((log, index) => (
            <View key={index} style={styles.logItem}>
              <View style={styles.timelineLine}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor:
                        log.type === "feature" ? "#2563EB" : "#94a3b8",
                    },
                  ]}
                />
                {index !== logs.length - 1 && <View style={styles.line} />}
              </View>

              <View style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.versionTag}>{log.version}</Text>
                  {log.type === "feature" ? (
                    <Sparkles size={14} color="#2563EB" strokeWidth={3} />
                  ) : (
                    <Zap size={14} color="#94a3b8" />
                  )}
                </View>
                <Text style={styles.logText}>{log.text}</Text>
                <Text style={styles.logDate}>{log.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => {
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
      padding: 20,
      paddingBottom: 40,
    },
    introSection: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 12,
    },
    introTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: textColor,
      marginTop: 16,
    },
    introSub: {
      fontSize: 15,
      color: subTextColor,
      textAlign: "center",
      marginTop: 8,
    },
    timeline: {
      paddingLeft: 8,
    },
    logItem: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 0,
    },
    timelineLine: {
      alignItems: "center",
      width: 20,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      zIndex: 1,
      marginTop: 24,
    },
    line: {
      width: 2,
      flex: 1,
      backgroundColor: borderColor,
      marginTop: -4,
      marginBottom: -24,
    },
    logCard: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 20,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
    },
    logHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    versionTag: {
      fontSize: 14,
      fontWeight: "800",
      color: "#2563EB",
      backgroundColor: isDark ? "rgba(37, 99, 235, 0.1)" : "#EFF6FF",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    logText: {
      fontSize: 15,
      color: textColor,
      lineHeight: 22,
      fontWeight: "500",
    },
    logDate: {
      fontSize: 12,
      color: subTextColor,
      marginTop: 12,
      fontWeight: "600",
    },
  });
};

export default UpdateLog;
