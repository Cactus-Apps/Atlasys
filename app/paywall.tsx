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
  ChevronLeft,
} from "lucide-react-native";
import { purchasePremium } from "@/lib/auth/revenuecat";
import { useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";

export default function PaywallScreen() {
  const { user } = useAuth();
  const setSubscribed = useAuthStore((s) => s.setSubscribed);
  const isSubscribed = useAuthStore((s) => s.isSubscribed);
  const theme = useAppTheme();
  const isDark = theme.isDark;
  const styles = getStyles(theme);
  const [loading, setLoading] = useState(false); // Added loading state

  const handleSubscribe = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      const success = await purchasePremium();
      if (success) {
        setSubscribed(true);
        router.navigate("/onboarding");
      }
    } catch (e: any) {
      console.warn("Purchase error:", e.message);
      // For development/mock purposes:
      if (
        e.message?.includes("placeholder") ||
        e.message?.includes("configure")
      ) {
        setSubscribed(true);
        router.navigate("/onboarding");
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Zap,
      text: "Unlimited City Searches",
      sub: "Search any location worldwide",
    },
    {
      icon: Shield,
      text: "Ad-Free Experience",
      sub: "Zero interruptions while exploring",
    },
    {
      icon: Rocket,
      text: "Real-time Weather Data",
      sub: "Precise updates for every city",
    },
    { icon: Crown, text: "Priority Support", sub: "24/7 dedicated assistance" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/profilescreen")}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Crown size={60} color="#2563EB" strokeWidth={2.5} />
          </View>
          <Text style={styles.heroTitle}>Go Premium</Text>
          <Text style={styles.heroSub}>
            Unlock the full potential of GPS Explore
          </Text>
        </View>

        <View style={styles.featureList}>
          {features.map((item, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <item.icon size={24} color="#2563EB" strokeWidth={2.5} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureText}>{item.text}</Text>
                <Text style={styles.featureSub}>{item.sub}</Text>
              </View>
              <CheckCircle2 size={20} color="#22C55E" />
            </View>
          ))}
        </View>

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

        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleSubscribe}
          activeOpacity={0.8}
        >
          <Text style={styles.subscribeButtonText}>Start Premium Trial</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          By subscribing, you agree to our Terms of Use and Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { bg, cardBg, textColor, subTextColor, borderColor, isModern } = theme;

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
      borderRadius: isModern ? 60 : 60,
      backgroundColor: isModern 
        ? theme.iconBg 
        : (theme.isDark ? "rgba(37, 99, 235, 0.1)" : "#EFF6FF"),
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
      borderRadius: isModern ? 24 : 20,
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: "#000",
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.06) : 0,
      shadowRadius: isModern ? 12 : 0,
      elevation: isModern ? 4 : 0,
    },
    featureIconContainer: {
      width: 48,
      height: 48,
      borderRadius: isModern ? 16 : 14,
      backgroundColor: isModern 
        ? theme.iconBg 
        : (theme.isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9"),
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
      backgroundColor: theme.isDark ? "rgba(37, 99, 235, 0.05)" : "#EEF2FF",
      borderRadius: isModern ? 32 : 24,
      padding: 24,
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(37, 99, 235, 0.2)" : "rgba(37, 99, 235, 0.1)",
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
