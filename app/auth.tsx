// Version 1.3.6 - © Cactus Apps 2025
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { t } from "i18next";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const [isFocused, setisFocused] = useState(false);
  const [isFocused2, setisFocused2] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError(t("Please_fill_in_all_fields"));
      return;
    }
    if (password.length < 6) {
      setError(t("at_least"));
      return;
    }

    setError(null);

    if (isSignUp) {
      const err = await signUp(email, password);
      if (err) {
        setError(err);
        return;
      }
      setIsSignUp(false);
    } else {
      const err = await signIn(email, password);
      if (err) {
        setError(err);
        return;
      }
      router.replace("/");
    }
  };

  const handleSwitchMode = () => {
    setIsSignUp((prev) => !prev);
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo2.png")}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.text}>
            {" "}
            {isSignUp ? t("Sign_up_to_GPS") : t("Sign_in_to_GPS")}
          </Text>
        </View>
        <Text style={styles.info}>{t('E-Mail')}</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          inputMode="email"
          value={email}
          onChangeText={setEmail}
          style={[
            styles.input,
            { borderColor: isFocused ? "#466583aa" : "#3D444D" },
            { borderWidth: isFocused ? 2 : 1 },
          ]}
          selectionColor="#466483ff"
          autoComplete="email"
          onFocus={() => setisFocused(true)}
          onBlur={() => setisFocused(false)}
        />
        <Text style={styles.info}>{t('Password')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
          style={[
            styles.input,
            { borderColor: isFocused2 ? "#466583aa" : "#3D444D" },
            { borderWidth: isFocused2 ? 2 : 1 },
          ]}
          selectionColor="#466483ff"
          onFocus={() => setisFocused2(true)}
          onBlur={() => setisFocused2(false)}
        />
        {error ? (
          <Text style={{ color: theme.colors.error, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        <Button mode="contained" style={styles.button} onPress={handleAuth}>
          {isSignUp ? t("Sign_up") : t("Login")}
        </Button>

        <Button
          mode="text"
          style={styles.switchModeButton}
          onPress={handleSwitchMode}
          textColor="#466483ff"
        >
          {isSignUp
            ? t("Already_account")
            : t("no_account")}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: scheme === "dark" ? "#0D1117" : "#fff",
    },
    logoContainer: {
      alignItems: "center",
      marginTop: 0,
    },
    info: {
      fontSize: 17,
      fontWeight: "bold",
      color: "#FEFFFE",
      paddingVertical: 8,
    },
    text: {
      fontSize: 25,
      paddingBottom: 40,
      fontWeight: "bold",
      color: "#FEFFFE",
    },
    image: {
      width: 100,
      height: 100,
    },
    content: {
      flex: 1,
      padding: 22,
      justifyContent: "center",
    },
    title: {
      textAlign: "center",
      marginBottom: 24,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    input: {
      marginBottom: 16,
      borderRadius: 6,
      color: "#fff",
    },
    button: {
      marginTop: 8,
      backgroundColor: "#238636",
      color: "#FEFFFE",
      borderRadius: 6,
    },
    switchModeButton: {
      marginTop: 16,
    },
  });
