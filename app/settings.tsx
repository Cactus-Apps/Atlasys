// Version 1.3.6 - © Cactus Apps 2025
import { useRouter } from "expo-router";
import { Bolt, ChevronLeft } from "lucide-react-native";
import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import "./i18n";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";

const settings = () => {
  const [ModalVisible, setModalVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.back}>
            <TouchableOpacity
              style={styles.backbutton}
              onPress={() => router.navigate("/(tabs)/profilescreen")}
            >
              <ChevronLeft
                size={30}
                strokeWidth={2}
                color={scheme === "dark" ? "#d8d8d8ff" : "#000"}
              />
            </TouchableOpacity>
          </View>
          <View style={{ alignSelf: "center", flexDirection: "row" }}>
            <Bolt size={40} strokeWidth={2} style={styles.icon} />
            <Text style={styles.title}>{t("Settings")}</Text>
          </View>
        </View>
        <View>
          <TouchableOpacity
            style={styles.button3}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.text2}>{t("Laguage")}</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={ModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalBox}>
              <Text style={styles.text9}>{t("Laguage")}</Text>
              <View>
                <View style={styles.containerScroll}>
                  <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("en")}
                    >
                      <Text style={styles.text2}>🇺🇸 English</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("ar")}
                    >
                      <Text style={styles.text2}>🇸🇦 العربية</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("de")}
                    >
                      <Text style={styles.text2}>🇩🇪 Deutsch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("es")}
                    >
                      <Text style={styles.text2}>🇪🇸 Spanish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("fr")}
                    >
                      <Text style={styles.text2}>🇫🇷 French</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("hi")}
                    >
                      <Text style={styles.text2}>🇮🇳 हिन्दी</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("it")}
                    >
                      <Text style={styles.text2}>🇮🇹 Italiano</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("ja")}
                    >
                      <Text style={styles.text2}>🇯🇵 日本語</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("ko")}
                    >
                      <Text style={styles.text2}>🇰🇷 한국어</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("pt")}
                    >
                      <Text style={styles.text2}>🇵🇹 Português</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("ru")}
                    >
                      <Text style={styles.text2}>🇷🇺 Русский</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button3}
                      onPress={() => changeLanguage("zh")}
                    >
                      <Text style={styles.text2}>🇨🇳 中文</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.button2}
                >
                  <Text style={styles.text2}>{t("OK")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

export default settings;

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    containerScroll: {
      height: 300,
      borderWidth: 1,
      borderColor: "transparent",
    },
    scrollView: {
      flex: 1,
    },
    modalBackground: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalBox: {
      width: "85%",
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 20,
    },
    button3: {
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginTop: 20,
      width: "100%",
      backgroundColor: "#466483ff",
    },
    button2: {
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginTop: 20,
      width: "100%",
      backgroundColor: "#858789ff",
    },
    text2: {
      color: "#ffffff",
      textAlign: "center",
      fontWeight: "600",
    },
    text9: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 16,
      textAlign: "center",
    },
    back: {
      marginRight: 55,
    },
    backbutton: {
      width: 30,
      height: 30,
      borderRadius: 35,
      backgroundColor: "#466583aa",
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      marginRight: 0,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 57,
      marginBottom: 30,
      paddingLeft: 10,
    },
    title: {
      marginLeft: 15,
      fontSize: 30,
      fontWeight: "600",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    menu: {
      fontSize: 25,
      fontFamily: "Light",
      color: "#d8d8d8ff",
      fontWeight: "600",
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 10,
      borderColor: "#466483ff",
      borderWidth: 2,
      paddingHorizontal: 60,
      paddingVertical: 8,
      backgroundColor: "#466483ff",
    },
  });
