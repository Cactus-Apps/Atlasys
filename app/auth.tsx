import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  useColorScheme,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth/auth-context";
import { useTranslation } from "react-i18next";
import { Mail, Lock, ArrowRight, Github } from "lucide-react-native";
import { BlurView } from "expo-blur";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";

const { width } = Dimensions.get("window");

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const theme = useAppTheme();
  const isDark = theme.isDark;

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email || !password) {
      setError(t("Please_fill_in_all_fields"));
      return;
    }
    if (password.length < 6) {
      setError(t("at_least"));
      return;
    }

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isSignUp) {
        const err = await signUp(email, password);
        if (err) setError(err);
        else setIsSignUp(false);
      } else {
        const err = await signIn(email, password);
        if (err) setError(err);
        else router.replace("/");
      }
    } catch (e) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSignUp(!isSignUp);
    setError(null);
  };

  const getInputBorderColor = (name: string) => {
    if (focusedInput === name) return "#2563EB";
    return theme.borderColor;
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.bg },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <View style={styles.logoOuter}>
              <Image
                source={require("../assets/images/logo2.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text
              style={[styles.title, { color: theme.textColor }]}
            >
              {isSignUp ? t("Sign_up_to_GPS") : t("Sign_in_to_GPS")}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? "Join our global community today"
                : "Welcome back, explorer!"}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400)} style={styles.form}>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: getInputBorderColor("email") },
              ]}
            >
              <Mail
                size={20}
                color={focusedInput === "email" ? "#2563EB" : "#94A3B8"}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.textColor },
                ]}
                placeholder={t("E-Mail")}
                placeholderTextColor={theme.subTextColor}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View
              style={[
                styles.inputWrapper,
                { borderColor: getInputBorderColor("password") },
              ]}
            >
              <Lock
                size={20}
                color={focusedInput === "password" ? "#2563EB" : "#94A3B8"}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.textColor },
                ]}
                placeholder={t("Password")}
                placeholderTextColor={theme.subTextColor}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {error && (
              <Animated.View entering={FadeInDown} style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            <TouchableOpacity
              style={[styles.mainBtn, loading && { opacity: 0.7 }]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.mainBtnText}>
                {loading ? "..." : isSignUp ? t("Sign_up") : t("Login")}
              </Text>
              {!loading && (
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={3} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchBtn} onPress={toggleMode}>
              <Text style={styles.switchBtnText}>
                {isSignUp ? t("Already_account") : t("no_account")}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
            <Text style={styles.footerText}>Or continue with</Text>
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[
                  styles.socialBtn,
                  { 
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderColor,
                    borderRadius: theme.isModern ? 24 : 20,
                  },
                ]}
              >
                <Github size={24} color={theme.textColor} />
              </TouchableOpacity>
              {/* Add more social providers if needed */}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoOuter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 60,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  mainBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    borderRadius: 24,
    gap: 12,
    marginTop: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  switchBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  switchBtnText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 15,
  },
  footer: {
    marginTop: 48,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 24,
  },
  socialRow: {
    flexDirection: "row",
    gap: 16,
  },
  socialBtn: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
});
