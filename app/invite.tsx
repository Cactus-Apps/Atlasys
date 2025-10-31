import { useRouter } from "expo-router";
import { t } from "i18next";
import { ChevronLeft, Users } from "lucide-react-native";
import * as React from "react";
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const invite = () => {
  const router = useRouter();
  const scheme = useColorScheme(); 
  const styles = getStyles(scheme === "light" || scheme === "dark" ? scheme : null);
  

  const shareLink = async () => {
    try {
       await Share.share({
        message: "https://github.com/Cactus-Apps/GPS",
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.back}>
        <TouchableOpacity style={styles.backbutton} onPress={router.back}>
        <ChevronLeft size={30} strokeWidth={2} color={scheme === "dark" ? "#d8d8d8ff" : "#000"} />
        </TouchableOpacity>
        </View>
        <Users size={40} strokeWidth={2} color={ scheme === "dark" ? "#d8d8d8ff" : "#000000ff" } style={styles.icon}/>
        <Text style={styles.title}>{t("invite")}</Text>
      </View>
      <TouchableOpacity style={styles.button}onPress={shareLink}>
        <Text style={styles.share}> {t("share")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default invite;

const getStyles = (scheme: "light" | "dark" | null) =>
 StyleSheet.create({
  container: {
    color: scheme === "dark" ? "#2c2a2aff" : "#fff",
    flex: 1,
  },
  share: {
    fontSize: 21,
    fontWeight: "600",
    borderRadius: 8,
    backgroundColor: "#466483ff",
    color: scheme === "dark" ? "#d8d8d8ff" : "#fff",
    paddingHorizontal: 35,
    paddingVertical: 12,
    alignSelf: "center",
  },
  icon: {
    marginLeft: 40,
  },
  title: {
    marginLeft: 20,
    fontSize: 30,
    fontWeight: "600",
    color: scheme === "dark" ? "#d8d8d8ff" : "#000",
  },
  back: {
    paddingLeft: 20,
  },
  backbutton: {
    width: 30,
    height: 30,
    borderRadius: 35,
    backgroundColor: "#466583aa", 
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  button: {
    marginTop: 40,
  },
});
