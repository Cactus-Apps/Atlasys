import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ConfirmHcaptcha from "@hcaptcha/react-native-hcaptcha";
import { useAuth } from "@/lib/auth/auth-context";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Lock,
  ArrowRight,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react-native";
import * as Sentry from "@sentry/react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import { OAuthProviderButtons } from "@/components/auth/OAuthProviderButtons";

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const isDark = theme.isDark;
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(
    undefined,
  );
  const pendingAuthRef = useRef(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const captcha = useRef<any>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const onMessage = (event: any) => {
    const data = event?.nativeEvent?.data;

    if (!data) return;

    if (data === "open" || data === "cancel") return;

    if (data === "error") {
      setError(t("Auth_captcha_failed"));
      return;
    }

    if (typeof data === "string" && data.startsWith("P1_")) {
      setCaptchaToken(data);
      captcha.current?.hide();
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError(t("Please_fill_in_all_fields"));
      return;
    }
    if (password.length < 6) {
      setError(t("at_least"));
      return;
    }

    if (!captchaToken) {
      pendingAuthRef.current = true;
      captcha.current?.show();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const err = isSignUp
        ? await signUp(email, password, { captchaToken })
        : await signIn(email, password, { captchaToken });

      setCaptchaToken(undefined);

      if (err) setError(err);
      else router.replace("/");
    } catch (err) {
      Sentry.captureException(err);
      setError(t("Auth_error_unexpected"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (captchaToken && pendingAuthRef.current) {
      pendingAuthRef.current = false;
      handleAuth();
    }
  }, [captchaToken]);

  const toggleMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSignUp(!isSignUp);
    setError(null);
    setCaptchaToken(undefined);
  };

  const handleGoogleAuth = async () => {
    setOauthLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const err = await signInWithGoogle();
      if (err) setError(err);
      else router.replace("/");
    } catch (err) {
      Sentry.captureException(err);
      setError(t("Auth_error_unexpected"));
    } finally {
      setOauthLoading(false);
    }
  };

  const getInputBorderColor = (name: string) => {
    if (focusedInput === name) return theme.primary;
    return theme.borderColor;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <View style={styles.logoOuter}>
              <Image
                source={require("../assets/images/icons/adaptive-icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: theme.textColor }]}>
              {isSignUp ? t("Sign_up_to_GPS") : t("Sign_in_to_GPS")}
            </Text>
            <Text style={[styles.subtitle, { color: theme.subTextColor }]}>
              {isSignUp ? t("Auth_subtitle_signup") : t("Auth_subtitle_signin")}
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
                color={
                  focusedInput === "email" ? theme.primary : theme.subTextColor
                }
              />
              <TextInput
                style={[styles.input, { color: theme.textColor }]}
                placeholder={t("Poi_label_email")}
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
                color={
                  focusedInput === "password"
                    ? theme.primary
                    : theme.subTextColor
                }
              />
              <TextInput
                style={[styles.input, { color: theme.textColor }]}
                placeholder={t("Password")}
                placeholderTextColor={theme.subTextColor}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setSecureTextEntry((prev) => !prev)}
              >
                {secureTextEntry ? (
                  <EyeIcon size={20} color={theme.subTextColor} />
                ) : (
                  <EyeOffIcon size={20} color={theme.subTextColor} />
                )}
              </TouchableOpacity>
            </View>

            {error && (
              <Animated.View entering={FadeInDown} style={styles.errorBox}>
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {error}
                </Text>
              </Animated.View>
            )}

            <TouchableOpacity
              style={[
                styles.mainBtn,
                {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                },
                (loading || oauthLoading) && { opacity: 0.7 },
              ]}
              onPress={handleAuth}
              disabled={loading || oauthLoading}
            >
              <Text style={styles.mainBtnText}>
                {loading
                  ? t("Auth_loading_ellipsis")
                  : isSignUp
                    ? t("Sign_up")
                    : t("Login")}
              </Text>
              {!loading && (
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={3} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchBtn} onPress={toggleMode}>
              <Text style={[styles.switchBtnText, { color: theme.primary }]}>
                {isSignUp ? t("Already_account") : t("no_account")}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <ConfirmHcaptcha
              ref={captcha}
              siteKey="ebf833d4-fe80-42aa-8c4e-f1e0dc30910a"
              baseUrl="http://localhost"
              size="compact"
              onMessage={onMessage}
            />
          </View>

          <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.subTextColor }]}>
              Or continue with
            </Text>
            <OAuthProviderButtons
              isDark={isDark}
              onGooglePress={handleGoogleAuth}
              googleLoading={oauthLoading}
              disabled={loading}
            />
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
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    borderRadius: 24,
    gap: 12,
    marginTop: 8,
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
    fontWeight: "700",
    fontSize: 15,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
    width: "100%",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
});
