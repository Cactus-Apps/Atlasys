import { useRouter } from "expo-router";
import { t } from "i18next";
import { Users } from "lucide-react-native";
import * as React from "react";
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const invite = () => {
  const router = useRouter();
  const shareLink = async () => {
    try {
      const result = await Share.share({
        message: "https://github.com/Cactus-Apps/GPS",
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <Users size={40} strokeWidth={2} style={styles.icon} />
        <Text style={styles.title}>{t("invite")}</Text>
      </View>
      <TouchableOpacity style={styles.button}onPress={shareLink}>
        <Text style={styles.share}> {t("share")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default invite;

const styles = StyleSheet.create({
  share: {
    fontSize: 21,
    fontWeight: "600",
    borderRadius: 8,
    backgroundColor: "#466483ff",
    color: "#ffffffff",
    paddingHorizontal: 40,
    paddingVertical: 12,
    alignSelf: "center",
  },
  title: {
    marginLeft: 5,
    fontSize: 30,
    fontWeight: "600",
  },
  icon: {
    marginRight: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingLeft: 40,
  },
  button: {
    marginTop: 40,
  },
});
