import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@kolking/react-native-avatar";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scheme = useColorScheme();

  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const report = () => {
    Linking.openURL("https://github.com/Cactus-Apps/GPS/issues/new").catch(
      (err) => console.error("An error occurred", err)
    );
  };

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert(
      "Kopiert",
      "Fehlermeldung wurde in die Zwischenablage kopiert."
    );
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (user) {
          setEmail(user.email ?? null);
        } else {
          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;
          setEmail(data.user?.email ?? null);
        }
      } catch (err: any) {
        console.error("❌ Fehler beim Laden des Benutzers:", err);
        Alert.alert(
          "Fehler beim Laden des Kontos",
          `Bitte melde dich neu an.\n\n${err.message || err}`,
          [
            { text: "Neu anmelden", onPress: () => router.replace("/auth") },
            {
              text: "Fehler kopieren",
              onPress: () => copy(err.message || "Unknown error"),
            },
            { text: "Abbrechen", style: "cancel" },
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.all}>
        <ActivityIndicator size="large" color="#466483ff" />
      </View>
    );
  }

  return (
    <SafeAreaView>
      <View>
        <ImageBackground
          source={require("../assets/images/account.png")}
          style={styles.image}
          imageStyle={styles.imageStyle}
        >
          <View style={styles.account}>
            <Avatar
              size={80}
              name={email ?? undefined}
              email={email ?? undefined}
              colorize={true}
              radius={100}
              badgeColor="#146275ff"
              defaultSource={require("../assets/images/banner.jpeg")}
            />
          </View>
        </ImageBackground>
      </View>

      <View style={styles.container}>
        {email ? (
          <Text style={styles.email}>Hello {email}</Text>
        ) : (
          <Text style={{ color: "red" }}>An error has occurred</Text>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.deleteAccount}
          onPress={() => router.replace("/requestdelete")}
        >
          <Text style={styles.text}>Delete Account</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.placeholder} />
      <TouchableOpacity onPress={signOut} style={styles.signoutbutton}>
        <LogOut strokeWidth={3} color={"#d84646ff"} style={styles.icon} />
        <Text style={styles.text}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    account: {
      marginTop: 70,
    },
    placeholder: {
      marginVertical: 210,
    },
    buttons: {
      alignItems: "flex-start",
      flexDirection: "column",
      marginLeft: 35,
    },
    text: {
      fontSize: 15,
      fontWeight: "600",
      color: "#d84646ff",
    },
    textMini: {
      fontSize: 14,
      fontWeight: "500",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
      alignSelf: "center",
    },
    signoutbutton: {
      flexDirection: "row",
      padding: 3,
      alignSelf: "center",
    },
    deleteAccount: {
      flexDirection: "row",
      padding: 3,
      marginVertical: 20,
    },
    container: {
      marginTop: 50,
      alignSelf: "center",
      marginVertical: 20,
    },
    all: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      marginRight: 16,
      color: scheme === "dark" ? "#d8d8d8ff" : "#fff",
    },
    email: {
      fontSize: 25,
      fontWeight: "bold",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    imageStyle: {
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    image: {
      width: 340,
      height: 110,
      alignSelf: "center",
      marginTop: 20,
    },
  });
