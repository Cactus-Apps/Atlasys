import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/storage/zustand";
import {
  Bell,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Star,
  Zap,
  CheckCircle2,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const settings = useAuthStore((s) => s.settings);

  const [step, setStep] = useState(0);
  const [localSettings, setLocalSettings] = useState({
    notifications: false,
    locationSharing: false,
    analytics: false,
  });

  const isStepValid = () => {
    if (step === 0) return true;
    if (step === 1)
      return (
        localSettings.notifications ||
        localSettings.locationSharing ||
        localSettings.analytics
      );
    return true;
  };

  const handleNext = () => {
    if (!isStepValid()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 2) {
      setStep(step + 1);
    } else {
      updateSettings(localSettings);
      setOnboardingCompleted(true);
      router.replace("/(tabs)/mapscreen");
    }
  };

  const toggleSetting = (key: keyof typeof localSettings) => {
    Haptics.selectionAsync();
    setLocalSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View
            entering={FadeInDown.duration(800)}
            style={styles.content}
          >
            <View style={styles.iconCircle}>
              <Zap size={48} color="#2563EB" />
            </View>
            <Text style={styles.title}>Welcome to GPS Pro</Text>
            <Text style={styles.subtitle}>
              Your companion for world exploration and navigation. Discover
              hidden gems and save them for later.
            </Text>
          </Animated.View>
        );
      case 1:
        return (
          <Animated.View entering={SlideInRight} style={styles.content}>
            <Text style={styles.title}>Personalize Your Experience</Text>
            <Text style={styles.subtitle}>
              Enable at least one feature to continue. This helps us provide a
              better service.
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  localSettings.notifications && styles.optionCardActive,
                ]}
                onPress={() => toggleSetting("notifications")}
              >
                <Bell
                  size={24}
                  color={localSettings.notifications ? "#2563EB" : "#64748b"}
                />
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionTitle,
                      localSettings.notifications && styles.optionTitleActive,
                    ]}
                  >
                    Notifications
                  </Text>
                  <Text style={styles.optionSub}>Stay updated with alerts</Text>
                </View>
                <Switch
                  value={localSettings.notifications}
                  onValueChange={() => toggleSetting("notifications")}
                  trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
                  thumbColor={
                    localSettings.notifications ? "#2563EB" : "#f4f3f4"
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  localSettings.locationSharing && styles.optionCardActive,
                ]}
                onPress={() => toggleSetting("locationSharing")}
              >
                <MapPin
                  size={24}
                  color={localSettings.locationSharing ? "#2563EB" : "#64748b"}
                />
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionTitle,
                      localSettings.locationSharing && styles.optionTitleActive,
                    ]}
                  >
                    Live Tracking
                  </Text>
                  <Text style={styles.optionSub}>
                    Improve navigation accuracy
                  </Text>
                </View>
                <Switch
                  value={localSettings.locationSharing}
                  onValueChange={() => toggleSetting("locationSharing")}
                  trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
                  thumbColor={
                    localSettings.locationSharing ? "#2563EB" : "#f4f3f4"
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  localSettings.analytics && styles.optionCardActive,
                ]}
                onPress={() => toggleSetting("analytics")}
              >
                <ShieldCheck
                  size={24}
                  color={localSettings.analytics ? "#2563EB" : "#64748b"}
                />
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionTitle,
                      localSettings.analytics && styles.optionTitleActive,
                    ]}
                  >
                    Analytics
                  </Text>
                  <Text style={styles.optionSub}>
                    Help us improve anonymously
                  </Text>
                </View>
                <Switch
                  value={localSettings.analytics}
                  onValueChange={() => toggleSetting("analytics")}
                  trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
                  thumbColor={localSettings.analytics ? "#2563EB" : "#f4f3f4"}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View entering={FadeInUp} style={styles.content}>
            <View style={[styles.iconCircle, { backgroundColor: "#FEF3C7" }]}>
              <Star size={48} color="#D97706" />
            </View>
            <Text style={styles.title}>Unlock Premium</Text>
            <Text style={styles.subtitle}>
              Get the most out of GPS Pro with our premium subscription plans.
            </Text>

            <View style={styles.premiumList}>
              <View style={styles.premiumItem}>
                <CheckCircle2 size={20} color="#059669" />
                <Text style={styles.premiumText}>Ad-free experience</Text>
              </View>
              <View style={styles.premiumItem}>
                <CheckCircle2 size={20} color="#059669" />
                <Text style={styles.premiumText}>Offline maps access</Text>
              </View>
              <View style={styles.premiumItem}>
                <CheckCircle2 size={20} color="#059669" />
                <Text style={styles.premiumText}>Unlimited saved places</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.premiumBtn}
              onPress={() => router.push("/paywall")}
            >
              <Text style={styles.premiumBtnText}>View Plans</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressBar,
              i <= step && styles.progressBarActive,
              { width: (width - 80) / 3 },
            ]}
          />
        ))}
      </View>

      <View style={styles.main}>{renderStep()}</View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !isStepValid() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!isStepValid()}
        >
          <Text style={styles.nextBtnText}>
            {step === 2 ? "Get Started" : "Continue"}
          </Text>
          <ChevronRight size={20} color="#FFFFFF" strokeWidth={3} />
        </TouchableOpacity>

        {step === 0 && (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/account")}
          >
            <Text style={styles.loginBtnText}>
              Already have an account? Log in
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 32,
    marginTop: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
  },
  progressBarActive: {
    backgroundColor: "#2563EB",
  },
  main: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 32,
    alignItems: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  optionsContainer: {
    width: "100%",
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionCardActive: {
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  optionTitleActive: {
    color: "#2563EB",
  },
  optionSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  premiumList: {
    width: "100%",
    gap: 16,
    marginBottom: 40,
  },
  premiumItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  premiumBtn: {
    width: "100%",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#F59E0B",
    alignItems: "center",
  },
  premiumBtnText: {
    color: "#D97706",
    fontSize: 16,
    fontWeight: "800",
  },
  footer: {
    padding: 32,
    paddingBottom: Platform.OS === "ios" ? 0 : 32,
  },
  nextBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 24,
    gap: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nextBtnDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  loginBtn: {
    marginTop: 24,
    alignItems: "center",
  },
  loginBtnText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
});
