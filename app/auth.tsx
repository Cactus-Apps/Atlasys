import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";


export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const router = useRouter();
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Bitte fülle alle Felder aus.");
      return;
    }
    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
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

  const backgroundImage = require("../assets/images/auth.png");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ImageBackground source={backgroundImage} style={{ flex: 1 }}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} variant="headlineMedium">
            {isSignUp ? "Konto erstellen" : "Willkommen zurück"}
          </Text>

          <TextInput
            label="E-Mail"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="example@gmail.com"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            outlineColor="#466483ff"
            selectionColor="#466483ff"
            activeOutlineColor="#466483ff"
          />
          <TextInput
            label="Passwort"
            autoCapitalize="none"
            secureTextEntry
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            outlineColor="#466483ff"
            selectionColor="#466483ff"
            activeOutlineColor="#466483ff"
          />
          {error ? (
            <Text style={{ color: theme.colors.error, textAlign: "center" }}>
              {error}
            </Text>
          ) : null}

          <Button mode="contained" style={styles.button} onPress={handleAuth}>
            {isSignUp ? "Registrieren" : "Einloggen"}
          </Button>

          <Button
            mode="text"
            style={styles.switchModeButton}
            onPress={handleSwitchMode}
            textColor="#466483ff"
          >
            {isSignUp
              ? "Schon ein Konto? Jetzt einloggen"
              : "Noch kein Konto? Jetzt registrieren"}
          </Button>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: scheme === "dark" ? "#000" : "#fff",
    },
    logoContainer: {
      alignItems: "center",
      marginTop: 80,
    },
    image: {
      width: 120,
      height: 120,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: "center",
    },
    title: {
      textAlign: "center",
      marginBottom: 24,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    input: {
      marginBottom: 16,
    },
    button: {
      marginTop: 8,
      backgroundColor: "#466483ff",
    },
    switchModeButton: {
      marginTop: 16,
    },
  });
