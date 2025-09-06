import AntDesign from "@expo/vector-icons/AntDesign";
import { t } from "i18next";
import * as React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, } from "react-native-safe-area-context";

const bugreport = () => {
  const openLink = () => {
    Linking.openURL("https://github.com/Cactus-Apps/GPS/issues/new").catch(
      (err) => console.error("An error occurred", err)
    );
  };

  return (
    <SafeAreaView>
      <Text style={styles.title}>{t('bug_report')}</Text>
      <View style={styles.container}>
      <Text style={styles.text}>
        {t('please_report_on')}
      </Text>
        <AntDesign style={styles.icon} name="github" size={24} color="black" />
        <TouchableOpacity onPress={openLink}>
          <Text style={styles.link}>GitHub</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default bugreport;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 40,
  },
  link: {
    fontSize: 17,
    fontWeight: "600",
    textDecorationLine: 'underline',
  },
  title: {
    fontSize: 30,
    paddingTop: 15,
    alignSelf: "center",
    fontWeight: "600",

  },
  text: {
    marginHorizontal: 12,
    fontSize: 17,
    fontWeight: '500',
  },
  icon:{
    marginLeft: 10,
    marginRight: 3,
  },
});
