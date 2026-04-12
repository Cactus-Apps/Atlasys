// Version 1.3.6 - © Cactus Apps 2026
import { useRouter } from "expo-router";
import {
  BarChart2,
  Bug,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RefreshCw,
} from "lucide-react-native";
import * as React from "react";
import * as Application from "expo-application";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "./i18n";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useAuthStore } from "@/lib/storage/zustand";
import { AppTheme } from "@/lib/theme";
import { Lock } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";

const Settings = () => {
  const [ModalVisible, setModalVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isSubscribed = useAuthStore((s) => s.isSubscribed);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const appSettings = useAuthStore((s) => s.settings);
  const currentTheme = useAuthStore((s) => s.settings.theme) ?? "light";
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const [DesignModalVisible, setDesignModalVisible] = useState(false);
  const [ThemeModeModalVisible, setThemeModeModalVisible] = useState(false);
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const buildNumber = Application.nativeBuildVersion;
  const version = Application.nativeApplicationVersion;

  const languages = [
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
    { code: "ar", label: "العربية" },
    { code: "es", label: "Spanish" },
    { code: "fr", label: "French" },
    { code: "hi", label: "हिन्दी" },
    { code: "it", label: "Italiano" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" },
    { code: "pt", label: "Português" },
    { code: "ru", label: "Русский" },
    { code: "zh", label: "中文" },
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

  const crashReportsOn = appSettings.crashReports !== false;
  const autoUpdateOn = appSettings.autoUpdateCheck !== false;

  const togglePrivacy = (
    key: "locationSharing" | "analytics" | "crashReports" | "autoUpdateCheck",
    value: boolean,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === "crashReports") {
      updateSettings({ crashReports: value });
      return;
    }
    if (key === "autoUpdateCheck") {
      updateSettings({ autoUpdateCheck: value });
      return;
    }
    updateSettings({ [key]: value });
  };

  const THEME_OPTIONS: {
    value: AppTheme;
    label: string;
    previewBg: string;
    previewCard: string;
    previewAccent: string;
    previewText: string;
    previewSub: string;
  }[] = [
    {
      value: "light",
      label: "Hell",
      previewBg: "#F4F7FB",
      previewCard: "#FFFFFF",
      previewAccent: "#2563EB",
      previewText: "#2D4A6B",
      previewSub: "#B0BEC5",
    },
    {
      value: "dark",
      label: "Dunkel",
      previewBg: "#0F1B2A",
      previewCard: "#17263A",
      previewAccent: "#2563EB",
      previewText: "#F3F7FC",
      previewSub: "#4A6A8A",
    },
    {
      value: "modern",
      label: "Modern",
      previewBg: "#F8F8F8",
      previewCard: "#FFFFFF",
      previewAccent: "#007AFF",
      previewText: "#111111",
      previewSub: "#CCCCCC",
    },
    {
      value: "claude",
      label: "Chill",
      previewBg: "#1C1C1C",
      previewCard: "#2A2A2A",
      previewAccent: "#CFA06B",
      previewText: "#F5F0E8",
      previewSub: "#555555",
    },
    {
      value: "midnight",
      label: "Midnight",
      previewBg: "#000000",
      previewCard: "#0A0A0A",
      previewAccent: "#6C63FF",
      previewText: "#FFFFFF",
      previewSub: "#333333",
    },
    {
      value: "ocean",
      label: "Ocean",
      previewBg: "#0A1628",
      previewCard: "#0F2040",
      previewAccent: "#00B4D8",
      previewText: "#E0F0FF",
      previewSub: "#1A3A5A",
    },
    {
      value: "forest",
      label: "Forest",
      previewBg: "#F0F7EE",
      previewCard: "#FFFFFF",
      previewAccent: "#2E7D32",
      previewText: "#1B3A2D",
      previewSub: "#C8E6C9",
    },
  ];

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
          <Text style={styles.sectionTitle}>Design</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 12,
              paddingBottom: 8,
            }}
          >
            {THEME_OPTIONS.map((t) => {
              const isActive = currentTheme === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    updateSettings({ theme: t.value });
                  }}
                  activeOpacity={0.8}
                  style={{ alignItems: "center", width: 110 }}
                >
                  {/* Vorschaukarte */}
                  <View
                    style={[
                      {
                        width: 110,
                        height: 85,
                        borderRadius: 16,
                        backgroundColor: t.previewBg,
                        padding: 10,
                        borderWidth: isActive ? 2.5 : 1,
                        borderColor: isActive
                          ? t.previewAccent
                          : "rgba(128,128,128,0.2)",
                        overflow: "hidden",
                        position: "relative",
                      },
                    ]}
                  >
                    {/* Mini Card */}
                    <View
                      style={{
                        backgroundColor: t.previewCard,
                        borderRadius: 8,
                        padding: 6,
                        gap: 4,
                      }}
                    >
                      {/* Accent Button simulieren */}
                      <View
                        style={{
                          width: 36,
                          height: 7,
                          backgroundColor: t.previewAccent,
                          borderRadius: 4,
                          alignSelf: "flex-end",
                        }}
                      />
                      {/* Text-Zeilen simulieren */}
                      {[0.9, 0.7, 0.5].map((opacity, i) => (
                        <View
                          key={i}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 2,
                          }}
                        >
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: t.previewAccent,
                              opacity,
                            }}
                          />
                          <View
                            style={{
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: t.previewText,
                              flex: 1,
                              opacity: opacity * 0.8,
                            }}
                          />
                        </View>
                      ))}
                    </View>

                    {/* Checkmark wenn aktiv */}
                    {isActive && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: t.previewAccent,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Check size={13} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </View>

                  {/* Label */}
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                      color: isActive ? theme.primary : theme.subTextColor,
                    }}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & privacy</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.menuIconContainer}>
                <MapPin
                  size={22}
                  color={
                    appSettings.locationSharing
                      ? theme.primary
                      : theme.subTextColor
                  }
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Location</Text>
                <Text style={styles.menuValue}>
                  Map, GPS widget, and weather use your position
                </Text>
              </View>
              <Switch
                value={appSettings.locationSharing}
                onValueChange={(v) => togglePrivacy("locationSharing", v)}
                trackColor={{
                  false: theme.cardBgSecondary,
                  true: theme.primaryLight,
                }}
                thumbColor={
                  appSettings.locationSharing ? theme.primary : theme.white
                }
                ios_backgroundColor={
                  Platform.OS === "ios" ? theme.cardBgSecondary : undefined
                }
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.toggleRow}>
              <View style={styles.menuIconContainer}>
                <BarChart2
                  size={22}
                  color={
                    appSettings.analytics ? theme.primary : theme.subTextColor
                  }
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Analytics (Vexo)</Text>
                <Text style={styles.menuValue}>
                  Anonymous usage to improve the app
                </Text>
              </View>
              <Switch
                value={appSettings.analytics}
                onValueChange={(v) => togglePrivacy("analytics", v)}
                trackColor={{
                  false: theme.cardBgSecondary,
                  true: theme.primaryLight,
                }}
                thumbColor={appSettings.analytics ? theme.primary : theme.white}
                ios_backgroundColor={
                  Platform.OS === "ios" ? theme.cardBgSecondary : undefined
                }
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.toggleRow}>
              <View style={styles.menuIconContainer}>
                <Bug
                  size={22}
                  color={crashReportsOn ? theme.primary : theme.subTextColor}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Crash reports</Text>
                <Text style={styles.menuValue}>
                  Send error reports via Sentry
                </Text>
              </View>
              <Switch
                value={crashReportsOn}
                onValueChange={(v) => togglePrivacy("crashReports", v)}
                trackColor={{
                  false: theme.cardBgSecondary,
                  true: theme.primaryLight,
                }}
                thumbColor={crashReportsOn ? theme.primary : theme.white}
                ios_backgroundColor={
                  Platform.OS === "ios" ? theme.cardBgSecondary : undefined
                }
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.toggleRow}>
              <View style={styles.menuIconContainer}>
                <RefreshCw
                  size={22}
                  color={autoUpdateOn ? theme.primary : theme.subTextColor}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Automatic update check</Text>
                <Text style={styles.menuValue}>
                  Look for Expo OTA updates in the background
                </Text>
              </View>
              <Switch
                value={autoUpdateOn}
                onValueChange={(v) => togglePrivacy("autoUpdateCheck", v)}
                trackColor={{
                  false: theme.cardBgSecondary,
                  true: theme.primaryLight,
                }}
                thumbColor={autoUpdateOn ? theme.primary : theme.white}
                ios_backgroundColor={
                  Platform.OS === "ios" ? theme.cardBgSecondary : undefined
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>{version}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Build</Text>
              <Text style={styles.infoValue}>{buildNumber}</Text>
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
                      <Check size={20} color={theme.primary} strokeWidth={3} />
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

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    cardBgSecondary,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    primary,
    overlay,
    white,
  } = theme;

  // Adapt border radii for classic vs modern
  const defaultRadius = isModern ? 24 : 20;
  const innerRadius = isModern ? 16 : 10;

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
      borderRadius: defaultRadius,
      padding: 16,
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
      paddingVertical: isModern ? 4 : 0,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    menuIconContainer: {
      width: 44,
      height: 44,
      borderRadius: innerRadius,
      backgroundColor: isModern
        ? theme.iconBg
        : theme.isDark
          ? "rgba(255, 255, 255, 0.05)"
          : cardBgSecondary,
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
      backgroundColor: overlay,
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
      color: primary,
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
      color: primary,
      fontWeight: "700",
    },
    premiumBadge: {
      backgroundColor: primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    premiumBadgeText: {
      fontSize: 10,
      fontWeight: "900",
      color: white,
    },
  });
};

export default Settings;
