import { useRouter } from "expo-router";
import {
  BarChart3,
  Bug,
  Check,
  ChevronLeft,
  ChevronRight,
  LanguagesIcon,
  RefreshCw,
  SettingsIcon,
} from "lucide-react-native";
import * as Application from "expo-application";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/lib/storage/zustand";
import { AppTheme, TabTheme, useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { TabBarPreview } from "@/components/tab-bars/TabBarPreview";

export default function Settings() {
  const [ModalVisible, setModalVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const appSettings = useAuthStore((s) => s.settings);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const currentTheme = useAuthStore((s) => s.settings.theme) ?? "light";
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const buildNumber = Application.nativeBuildVersion;
  const version = Application.nativeApplicationVersion;

  const languages = [
    { code: "en", label: t("English") },
    { code: "de", label: t("German") },
    { code: "es", label: t("Spanish") },
  ];

  const handleLanguagePress = (langCode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    i18n.changeLanguage(langCode);
    setModalVisible(false);
  };

  const currentLanguageLabel =
    languages.find((l) => l.code === i18n.language)?.label || "English";

  const crashReportsOn = appSettings.crashReports !== false;
  const autoUpdateOn = appSettings.autoUpdateCheck !== false;
  const pingOn = appSettings.ping === true;

  const togglePrivacy = (
    key: "crashReports" | "autoUpdateCheck" | "ping",
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
    labelKey: string;
    previewBg: string;
    previewCard: string;
    previewAccent: string;
    previewText: string;
    previewSub: string;
  }[] = [
    {
      value: "light",
      labelKey: "Theme_label_light",
      previewBg: "#F4F7FB",
      previewCard: "#FFFFFF",
      previewAccent: "#2563EB",
      previewText: "#2D4A6B",
      previewSub: "#B0BEC5",
    },
    {
      value: "dark",
      labelKey: "Theme_label_dark",
      previewBg: "#0F1B2A",
      previewCard: "#17263A",
      previewAccent: "#2563EB",
      previewText: "#F3F7FC",
      previewSub: "#4A6A8A",
    },
    {
      value: "modern",
      labelKey: "Theme_label_modern",
      previewBg: "#F8F8F8",
      previewCard: "#FFFFFF",
      previewAccent: "#007AFF",
      previewText: "#111111",
      previewSub: "#CCCCCC",
    },
    {
      value: "chill",
      labelKey: "Theme_label_chill",
      previewBg: "#1C1C1C",
      previewCard: "#2A2A2A",
      previewAccent: "#CFA06B",
      previewText: "#F5F0E8",
      previewSub: "#555555",
    },
    {
      value: "midnight",
      labelKey: "Theme_label_midnight",
      previewBg: "#000000",
      previewCard: "#0A0A0A",
      previewAccent: "#6C63FF",
      previewText: "#FFFFFF",
      previewSub: "#333333",
    },
    {
      value: "ocean",
      labelKey: "Theme_label_ocean",
      previewBg: "#0A1628",
      previewCard: "#0F2040",
      previewAccent: "#00B4D8",
      previewText: "#E0F0FF",
      previewSub: "#1A3A5A",
    },
    {
      value: "forest",
      labelKey: "Theme_label_forest",
      previewBg: "#F0F7EE",
      previewCard: "#FFFFFF",
      previewAccent: "#2E7D32",
      previewText: "#1B3A2D",
      previewSub: "#C8E6C9",
    },
  ];

  const TAB_THEME_OPTIONS: {
    value: TabTheme;
    labelKey: string;
    previewBg: string;
    previewCard: string;
    previewAccent: string;
    previewText: string;
    previewSub: string;
    beta: boolean;
  }[] = [
    {
      value: "modern",
      labelKey: "TabTheme_label_modern",
      previewBg: theme.bg,
      previewCard: theme.cardBg,
      previewAccent: theme.accentColor,
      previewText: theme.textColor,
      previewSub: theme.subTextColor,
      beta: false,
    },
    {
      value: "new",
      labelKey: "TabTheme_label_new",
      previewBg: theme.bg,
      previewCard: theme.cardBg,
      previewAccent: theme.accentColor,
      previewText: theme.textColor,
      previewSub: theme.subTextColor,
      beta: false,
    },
    {
      value: "native",
      labelKey: "TabTheme_label_native",
      previewBg: theme.bg,
      previewCard: theme.cardBg,
      previewAccent: theme.accentColor,
      previewText: theme.textColor,
      previewSub: theme.subTextColor,
      beta: true,
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
          <Text style={styles.sectionTitle}>
            {t("Settings_section_Preferences")}
          </Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.menuIconContainer}>
                <LanguagesIcon size={25} color={theme.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text style={styles.menuLabel}>
                    {t("Settings_label_language")}
                  </Text>
                </View>
                <Text style={styles.menuValue}>{currentLanguageLabel}</Text>
              </View>
              <ChevronRight size={20} color={styles.subTextColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("Settings_section_Design")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 12,
              paddingBottom: 8,
            }}
          >
            {THEME_OPTIONS.map((opt) => {
              const isActive = currentTheme === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    updateSettings({ theme: opt.value });
                  }}
                  activeOpacity={0.8}
                  style={{ alignItems: "center", width: 110 }}
                >
                  {/* Preview card */}
                  <View
                    style={[
                      {
                        width: 110,
                        height: 85,
                        borderRadius: 16,
                        backgroundColor: opt.previewBg,
                        padding: 10,
                        borderWidth: isActive ? 2.5 : 1,
                        borderColor: isActive
                          ? opt.previewAccent
                          : "rgba(128,128,128,0.2)",
                        overflow: "hidden",
                        position: "relative",
                      },
                    ]}
                  >
                    {/* Mini card */}
                    <View
                      style={{
                        backgroundColor: opt.previewCard,
                        borderRadius: 8,
                        padding: 6,
                        gap: 4,
                      }}
                    >
                      {/* Accent bar */}
                      <View
                        style={{
                          width: 36,
                          height: 7,
                          backgroundColor: opt.previewAccent,
                          borderRadius: 4,
                          alignSelf: "flex-end",
                        }}
                      />
                      {/* Placeholder text lines */}
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
                              backgroundColor: opt.previewAccent,
                              opacity,
                            }}
                          />
                          <View
                            style={{
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: opt.previewText,
                              flex: 1,
                              opacity: opacity * 0.8,
                            }}
                          />
                        </View>
                      ))}
                    </View>

                    {/* Active checkmark */}
                    {isActive && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: opt.previewAccent,
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
                      fontFamily: isActive ? fonts.bold : fonts.medium,
                      color: isActive ? theme.accentColor : theme.subTextColor,
                    }}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("TabBar Style")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 12,
              paddingBottom: 8,
            }}
          >
            {TAB_THEME_OPTIONS.map((opt) => {
              const isActive = appSettings.tabTheme === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    updateSettings({ tabTheme: opt.value });
                  }}
                  activeOpacity={0.8}
                  style={{ alignItems: "center", width: 110 }}
                >
                  <View
                    style={[
                      {
                        width: 110,
                        height: 55,
                        borderRadius: 16,
                        backgroundColor: opt.previewBg,
                        borderWidth: isActive ? 2.5 : 1,
                        borderColor: isActive
                          ? opt.previewAccent
                          : "rgba(128,128,128,0.2)",
                        overflow: "hidden",
                        position: "relative",
                      },
                    ]}
                  >
                    <TabBarPreview
                      type={opt.value}
                      isActive={isActive}
                      bg={opt.previewBg}
                      card={opt.previewCard}
                      accent={opt.previewAccent}
                      text={opt.previewText}
                      sub={opt.previewSub}
                    />

                    {opt.beta && (
                      <View
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          backgroundColor: opt.previewAccent,
                          paddingHorizontal: 5,
                          paddingVertical: 1.5,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 8,
                            fontFamily: fonts.bold,
                            color: "#fff",
                            letterSpacing: 0.5,
                          }}
                        >
                          BETA !
                        </Text>
                      </View>
                    )}

                    {isActive && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: opt.previewAccent,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </View>

                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      fontFamily: isActive ? fonts.bold : fonts.medium,
                      color: isActive ? theme.accentColor : theme.subTextColor,
                    }}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("Settings_section_Location_privacy")}
          </Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.menuIconContainer}>
                <SettingsIcon
                  size={22}
                  color={crashReportsOn ? theme.primary : theme.subTextColor}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <TouchableOpacity onPress={() => Linking.openSettings()}>
                  <Text style={styles.menuLabel}>Location-Settings</Text>
                  <Text style={styles.menuValue}>Edit in system-settings</Text>
                </TouchableOpacity>
              </View>
              <ChevronRight size={18} color={theme.chevronColor} />
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
                <Text style={styles.menuLabel}>
                  {t("Settings_crash_reports_label")}
                </Text>
                <Text style={styles.menuValue}>
                  {t("Settings_crash_reports_sub")}
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
                <Text style={styles.menuLabel}>
                  {t("Settings_auto_update_label")}
                </Text>
                <Text style={styles.menuValue}>
                  {t("Settings_auto_update_sub")}
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
            <View style={styles.separator} />
            <View style={styles.toggleRow}>
              <View style={styles.menuIconContainer}>
                <BarChart3
                  size={22}
                  color={pingOn ? theme.primary : theme.subTextColor}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>
                  {t("Settings_analytics_toggle")}
                </Text>
                <Text style={styles.menuValue}>
                  {t("Settings_analytics_toggle_sub")}
                </Text>
              </View>
              <Switch
                value={pingOn}
                onValueChange={(v) => togglePrivacy("ping", v)}
                trackColor={{
                  false: theme.cardBgSecondary,
                  true: theme.primaryLight,
                }}
                thumbColor={pingOn ? theme.primary : theme.white}
                ios_backgroundColor={
                  Platform.OS === "ios" ? theme.cardBgSecondary : undefined
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("Settings_section_App_Info")}
          </Text>
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>
                {t("Settings_label_version")}
              </Text>
              <Text style={styles.infoValue}>{version}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t("Settings_label_build")}</Text>
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
              <Text style={styles.modalTitle}>{t("Select_Language")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>{t("Cancel")}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
            >
              {languages.map((lang) => {
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
                        { color: styles.subTextColor },
                      ]}
                    >
                      {lang.label}
                    </Text>
                    {i18n.language === lang.code && (
                      <Check size={20} color={theme.primary} strokeWidth={3} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    textColor: textColor as any,
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
      fontFamily: fonts.bold,
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
      fontFamily: fonts.bold,
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
      fontFamily: fonts.bold,
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
      fontFamily: fonts.semibold,
      color: textColor,
    },
    infoValue: {
      fontSize: 15,
      color: subTextColor,
      fontFamily: fonts.medium,
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
      fontFamily: fonts.bold,
      color: textColor,
    },
    closeButtonText: {
      fontSize: 16,
      fontFamily: fonts.bold,
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
      fontFamily: fonts.semibold,
      color: textColor,
    },
    selectedLanguageLabel: {
      color: primary,
      fontFamily: fonts.bold,
    },
    premiumBadge: {
      backgroundColor: primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    premiumBadgeText: {
      fontSize: 10,
      fontFamily: fonts.bold,
      color: white,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: subTextColor,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 1,
      flexShrink: 0,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: primary,
    },
    sectionLabel: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
    },
  });
};
