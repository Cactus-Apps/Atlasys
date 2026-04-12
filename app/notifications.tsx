import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
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

import { useAuthStore } from "@/lib/storage/zustand";
import { useAppTheme } from "@/lib/theme";

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
  label: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  {
    key: "userAccount",
    label: "User & account",
    description: "Security, login, and profile alerts",
    Icon: UserRound,
  },
  {
    key: "coolPlaces",
    label: "Cool places",
    description: "Tips and highlights near you",
    Icon: MapPin,
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    description: "Billing, renewals, and plan changes",
    Icon: CreditCard,
  },
  {
    key: "offlineMaps",
    label: "Offline maps",
    description: "Download and sync status",
    Icon: Download,
  },
  {
    key: "updates",
    label: "Updates",
    description: "New features and release notes",
    Icon: Rocket,
  },
];

export default function NotificationsScreen() {
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
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionHint}>
            Choose which updates we may send you. You can change this anytime.
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
                      <Text style={styles.menuLabel}>{row.label}</Text>
                      <Text style={styles.menuValue}>{row.description}</Text>
                    </View>
                    <Switch
                      value={enabled}
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
              System notification permission is managed in your device settings.
            </Text>
          </View>
        </View>
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
    isModern,
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
  });
};
