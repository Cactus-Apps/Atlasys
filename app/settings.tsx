// Version 1.3.6 - © Cactus Apps 2026
import { useRouter } from "expo-router";
import { Bolt, ChevronRight, Check, ChevronLeft } from "lucide-react-native";
import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  ScrollView,
} from "react-native";
import "./i18n";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useAuthStore } from "@/lib/storage/zustand";
import { Lock } from "lucide-react-native";

const Settings = () => {
  const [ModalVisible, setModalVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme();
  const isSubscribed = useAuthStore((s) => s.isSubscribed);
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null,
  );

  const languages = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "es", label: "Spanish", flag: "🇪🇸" },
    { code: "fr", label: "French", flag: "🇫🇷" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
    { code: "ko", label: "한국어", flag: "🇰🇷" },
    { code: "pt", label: "Português", flag: "🇵🇹" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "zh", label: "中文", flag: "🇨🇳" },
  ];

  const handleLanguagePress = (langCode: string) => {
    if (!isSubscribed && langCode !== i18n.language && langCode !== "en") {
      setModalVisible(false);
      router.push("/paywall");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    i18n.changeLanguage(langCode);
    setModalVisible(false);
  };

  const currentLanguageLabel =
    languages.find((l) => l.code === i18n.language)?.label || "English";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/profilescreen")}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={styles.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Settings")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.menuIconContainer}>
                <Text style={{ fontSize: 20 }}>🌐</Text>
              </View>
              <View style={styles.menuTextContainer}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text style={styles.menuLabel}>{t("Laguage")}</Text>
                  {!isSubscribed && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.menuValue}>{currentLanguageLabel}</Text>
              </View>
              <ChevronRight size={20} color={styles.subTextColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.3.6</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Build</Text>
              <Text style={styles.infoValue}>1092</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={ModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("Select Language")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>{t("Cancel")}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
            >
              {languages.map((lang) => {
                const isLocked =
                  !isSubscribed &&
                  lang.code !== i18n.language &&
                  lang.code !== "en";
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={styles.languageItem}
                    onPress={() => handleLanguagePress(lang.code)}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.languageLabel,
                        i18n.language === lang.code &&
                          styles.selectedLanguageLabel,
                        isLocked && { color: styles.subTextColor },
                      ]}
                    >
                      {lang.label}
                    </Text>
                    {i18n.language === lang.code ? (
                      <Check size={20} color="#2563EB" strokeWidth={3} />
                    ) : isLocked ? (
                      <Lock size={16} color={styles.subTextColor} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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
    textColor: textColor as any, // Helper for component usage
    subTextColor: subTextColor as any,
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
    section: {
      padding: 20,
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
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: borderColor,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#F1F5F9",
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
    menuValue: {
      fontSize: 14,
      color: subTextColor,
      marginTop: 2,
    },
    infoItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    infoLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: textColor,
    },
    infoValue: {
      fontSize: 15,
      color: subTextColor,
      fontWeight: "500",
    },
    separator: {
      height: 1,
      backgroundColor: borderColor,
      marginVertical: 12,
    },
    modalBackground: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: bg,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingTop: 24,
      paddingHorizontal: 20,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: textColor,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#2563EB",
    },
    languageList: {
      marginBottom: 40,
    },
    languageItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    languageFlag: {
      fontSize: 24,
      marginRight: 16,
    },
    languageLabel: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
      color: textColor,
    },
    selectedLanguageLabel: {
      color: "#2563EB",
      fontWeight: "700",
    },
    premiumBadge: {
      backgroundColor: "#2563EB",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    premiumBadgeText: {
      fontSize: 10,
      fontWeight: "900",
      color: "#FFFFFF",
    },
  });
};

export default Settings;
