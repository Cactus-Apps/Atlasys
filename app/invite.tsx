import { useRouter } from "expo-router";
import { t } from "i18next";
import * as React from "react";
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
      <View style={styles.placeholder}/>
      <TouchableOpacity onPress={shareLink}>
        <Text style={styles.share}> {t("share")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default invite;

const styles = StyleSheet.create({
  icon: {
    backgroundColor: 'rgba(45, 124, 160, 0.2)',
    borderRadius: 20,
  },
  share: {
    fontSize: 21,
    fontWeight: "600",
    borderRadius: 8,
    backgroundColor: '#466483ff',
    color: '#ffffffff',
    paddingHorizontal: 40,
    paddingVertical: 12,
    alignSelf: 'center',
  },
  placeholder: {
    marginTop: 23,
  },
});
