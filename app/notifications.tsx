import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  AlertTriangleIcon,
  Bell,
  ChevronLeft,
  CreditCard,
  Download,
  MapPin,
  Rocket,
  UserRound,
} from "lucide-react-native";
import * as React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

import { useAuthStore } from "@/lib/storage/zustand";
import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";

type TopicKey =
  | "userAccount"
  | "coolPlaces"
  | "subscriptions"
  | "offlineMaps"
  | "updates";

function resolveTopics(settings: {
  notifications: boolean;
  notificationTopics?: Partial<Record<TopicKey, boolean>>;
}): Record<TopicKey, boolean> {
  const fb = settings.notifications;
  const t = settings.notificationTopics;
  return {
    userAccount: t?.userAccount ?? fb,
    coolPlaces: t?.coolPlaces ?? fb,
    subscriptions: t?.subscriptions ?? fb,
    offlineMaps: t?.offlineMaps ?? fb,
    updates: t?.updates ?? fb,
  };
}

const TOPIC_ROWS: {
  key: TopicKey;
  labelKey: string;
  descriptionKey: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  {
    key: "userAccount",
    labelKey: "Notifications_topic_user",
    descriptionKey: "Notifications_topic_user_sub",
    Icon: UserRound,
  },
  {
    key: "coolPlaces",
    labelKey: "Notifications_topic_places",
    descriptionKey: "Notifications_topic_places_sub",
    Icon: MapPin,
  },
  {
    key: "subscriptions",
    labelKey: "Notifications_topic_subscriptions",
    descriptionKey: "Notifications_topic_subscriptions_sub",
    Icon: CreditCard,
  },
  {
    key: "offlineMaps",
    labelKey: "Notifications_topic_offline",
    descriptionKey: "Notifications_topic_offline_sub",
    Icon: Download,
  },
  {
    key: "updates",
    labelKey: "Notifications_topic_updates",
    descriptionKey: "Notifications_topic_updates_sub",
    Icon: Rocket,
  },
];

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const settings = useAuthStore((s) => s.settings);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const topics = resolveTopics(settings);

  const setTopic = (key: TopicKey, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const merged = resolveTopics(settings);
    updateSettings({
      notificationTopics: { ...merged, [key]: value },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profilescreen")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t("Accessibility_back")}
        >
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Notifications")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <View>
        <View style={styles.section}>
          <View style={styles.introBanner}>
            <View style={styles.introIconWrap}>
              <AlertTriangleIcon size={28} color={theme.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>
                {t("Notifications_beta_title")}
              </Text>
              <Text style={styles.introSub}>
                {t("Notifications_beta_sub")}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("Notifications_section_categories")}
            </Text>
            <Text style={styles.sectionHint}>
              {t("Notifications_section_hint")}
            </Text>
            <View style={styles.card}>
              {TOPIC_ROWS.map((row, index) => {
                const enabled = topics[row.key];
                const Icon = row.Icon;
                return (
                  <View key={row.key}>
                    {index > 0 ? <View style={styles.separator} /> : null}
                    <View style={styles.row}>
                      <View style={styles.menuIconContainer}>
                        <Icon
                          size={22}
                          color={enabled ? theme.primary : theme.subTextColor}
                        />
                      </View>
                      <View style={styles.menuTextContainer}>
                        <Text style={styles.menuLabel}>
                          {t(row.labelKey)}
                        </Text>
                        <Text style={styles.menuValue}>
                          {t(row.descriptionKey)}
                        </Text>
                      </View>
                      <Switch
                        value={enabled}
                        disabled={true}
                        onValueChange={(v) => setTopic(row.key, v)}
                        trackColor={{
                          false: theme.cardBgSecondary,
                          true: theme.primaryLight,
                        }}
                        thumbColor={enabled ? theme.primary : theme.white}
                        ios_backgroundColor={
                          Platform.OS === "ios"
                            ? theme.cardBgSecondary
                            : undefined
                        }
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.footerNote}>
              <Bell size={18} color={theme.subTextColor} />
              <Text style={styles.footerNoteText}>
                System notification permission is managed in your device
                settings.
              </Text>
            </View>
          </View>
        </ScrollView>
        <BlurView style={styles.disabledOverlay} intensity={35} tint="dark" />
      </View>
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
    danger,
    dangerDark,
    dangerLight,
  } = theme;

  const defaultRadius = isModern ? 24 : 20;
  const innerRadius = isModern ? 16 : 10;

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
    disabledOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    sectionHint: {
      fontSize: 14,
      lineHeight: 20,
      color: subTextColor,
      marginBottom: 12,
      marginLeft: 4,
      marginRight: 4,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: defaultRadius,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: borderColor,
      overflow: "hidden",
      shadowColor: theme.black,
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.06) : 0,
      shadowRadius: isModern ? 12 : 0,
      elevation: isModern ? 4 : 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
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
      marginLeft: 14,
      marginRight: 12,
    },
    menuLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
    },
    menuValue: {
      fontSize: 13,
      color: subTextColor,
      marginTop: 2,
    },
    separator: {
      height: 1,
      backgroundColor: borderColor,
    },
    footerNote: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 16,
      backgroundColor: cardBgSecondary,
      borderRadius: innerRadius,
      borderWidth: 1,
      borderColor: borderColor,
    },
    footerNoteText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: subTextColor,
    },
    introBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: dangerLight,
      borderWidth: 1,
      borderColor: dangerDark,
      borderRadius: isModern ? 18 : 12,
      padding: 16,
      marginBottom: 24,
    },
    introIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: dangerLight,
      justifyContent: "center",
      alignItems: "center",
    },
    introTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: textColor,
      marginBottom: 3,
    },
    introSub: {
      fontSize: 13,
      color: subTextColor,
      lineHeight: 18,
    },
  });
};
