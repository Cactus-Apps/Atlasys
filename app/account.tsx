import { Avatar } from "@kolking/react-native-avatar";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { CirclePlus, LogOut } from "lucide-react-native";
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
import { Account } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import { client } from "../lib/appwrite";
import { useAuth } from "../lib/auth-context";
import "./i18n.js";

const account = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const account = new Account(client);
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );
  const errormessage =
    "Error loading user: [AppwriteException: User (role: guests) missing scopes ([“account”])]";

  const report = () => {
    Linking.openURL("https://github.com/Cactus-Apps/GPS/issues/new").catch(
      (err) => console.error("An error occurred", err)
    );
  };

  const copy = async () => {
    await Clipboard.setStringAsync(errormessage);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await account.get();
        setEmail(user.email);
      } catch (err) {
        Alert.alert(
          "An error has occurred.",
          "Error loading user: Please report an issue with the following error code: Error loading user: [AppwriteException: User (role: guests) missing scopes ([“account”])]",
          [
            { text: "Report on GitHub", onPress: report, style: "cancel" },
            { text: "Copy Error Text", onPress: copy, style: "default" },
            { text: "Cancel" },
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);


  if (loading) {
    return (
      <View style={styles.all}>
        <ActivityIndicator size="large" color="#ffffffff" />
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
              source={require("../assets/images/banner.jpeg")}
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
          <View>
            <Text style={{ color: "red" }}>An error has occurred</Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={signOut} style={styles.signoutbutton}>
        <LogOut strokeWidth={3} style={styles.icon} />
        <Text style={styles.text}>Sign Out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signupbutton} onPress={() => router.replace("/auth")}>
        <CirclePlus strokeWidth={3} style={styles.icon}/>
        <Text style={styles.text} > Sign Up</Text>
       </TouchableOpacity>
       <View style={styles.placeholder}/>
       <View>
        <Text style={styles.textMini}>Sign up only works if you are not logged in</Text>
       </View>
    </SafeAreaView>
  );
};

export default account;

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    account: {
      marginTop: 70,
    },
    placeholder: {
      marginVertical: 140,
    },
    text: {
      fontSize: 21,
      fontWeight: "600",
      color: scheme === "dark" ? "#d8d8d8ff" : "#fff",
    },
    textMini: {
      fontSize: 14,
      fontWeight: "500",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
      alignSelf: 'center',
    },
    signoutbutton: {
      borderRadius: 8,
      backgroundColor: "#466483ff",
      color: "#d8d8d8ff" ,
      paddingHorizontal: 70,
      paddingVertical: 20,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      marginTop: 70,
    },
    signupbutton: {
      borderRadius: 8,
      backgroundColor: "#466483ff",
      color: scheme === "dark" ? "#d8d8d8ff" : "#fff",
      paddingHorizontal: 72,
      paddingVertical: 20,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      marginTop: 40,
    },
    container: {
      marginTop: 50,
      alignSelf: "center",
    },
    all: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      margin: 1,
      color: scheme === "dark" ? "#d8d8d8ff" : "#fff",
      marginRight: 16,
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
