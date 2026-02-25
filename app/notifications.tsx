import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAuth } from "@/lib/auth/auth-context";
import { useAuthStore } from "@/lib/storage/zustand";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  CheckCircle2,
  Rocket,
  Zap,
  Shield,
  Crown,
} from "lucide-react-native";
import { purchasePremium } from "@/lib/auth/revenuecat";
import { useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import Reactfrom from "react";
import { Switch } from "react-native";
import * as Notifications from "expo-notifications";

const enableNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === "granted") {
    console.log("Notifications enabled");
  }
};

const disableNotifications = async () => {
  console.log("Notifications disabled");
};

export default function PaywallScreen() {
  const scheme = useColorScheme();
  const [enabled, setEnabled] = useState(false);
  const isDark = scheme === "dark";
  const styles = getStyles(isDark);

  const toggleSwitch = async () => {
    if (!enabled) {
      await enableNotifications();
      setEnabled(true);
    } else {
      await disableNotifications();
      setEnabled(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/profilescreen")}
          style={styles.backButton}
        >
          <ChevronRight
            size={24}
            color={isDark ? "#fff" : "#000"}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View>
            <Text>Push Notifications</Text>
            <Switch value={enabled} onValueChange={toggleSwitch} />
          </View>
        </View>

        <View style={styles.featureList}></View>

        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Monthly Pass</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceSymbol}>€</Text>
            <Text style={styles.priceValue}>4.99</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          <Text style={styles.priceDetail}>
            Cancel anytime. Secure checkout.
          </Text>
        </View>

        <TouchableOpacity style={styles.subscribeButton} activeOpacity={0.8}>
          <Text style={styles.subscribeButtonText}>Start Premium Trial</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          By subscribing, you agree to our Terms of Use and Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

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
      paddingBottom: 60,
    },
    heroSection: {
      alignItems: "center",
      marginBottom: 32,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDark ? "rgba(37, 99, 235, 0.1)" : "#EFF6FF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: "900",
      color: textColor,
      letterSpacing: -1,
    },
    heroSub: {
      fontSize: 16,
      color: subTextColor,
      textAlign: "center",
      marginTop: 8,
      fontWeight: "500",
    },
    featureList: {
      gap: 16,
      marginBottom: 32,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: cardBg,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: borderColor,
    },
    featureIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9",
      alignItems: "center",
      justifyContent: "center",
    },
    featureTextContainer: {
      flex: 1,
      marginLeft: 16,
    },
    featureText: {
      fontSize: 15,
      fontWeight: "700",
      color: textColor,
    },
    featureSub: {
      fontSize: 13,
      color: subTextColor,
      marginTop: 2,
    },
    pricingCard: {
      backgroundColor: isDark ? "rgba(37, 99, 235, 0.05)" : "#EEF2FF",
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? "rgba(37, 99, 235, 0.2)" : "rgba(37, 99, 235, 0.1)",
    },
    pricingTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: "#2563EB",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    priceSymbol: {
      fontSize: 24,
      fontWeight: "700",
      color: textColor,
      marginRight: 2,
    },
    priceValue: {
      fontSize: 48,
      fontWeight: "900",
      color: textColor,
    },
    pricePeriod: {
      fontSize: 16,
      color: subTextColor,
      fontWeight: "600",
      marginLeft: 4,
    },
    priceDetail: {
      fontSize: 13,
      color: subTextColor,
      marginTop: 12,
      fontWeight: "500",
    },
    subscribeButton: {
      backgroundColor: "#2563EB",
      paddingVertical: 18,
      borderRadius: 18,
      alignItems: "center",
      shadowColor: "#2563EB",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    subscribeButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "800",
    },
    footerNote: {
      fontSize: 12,
      color: "#94a3b8",
      textAlign: "center",
      marginTop: 20,
      lineHeight: 18,
    },
  });
};
