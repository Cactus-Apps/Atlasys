import BottomSheet from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { Bolt, ChevronDown, ChevronLeft } from "lucide-react-native";
import * as React from "react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Divider, Menu, PaperProvider } from "react-native-paper";
import "./i18n";

const settings = () => {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = React.useState(false);
  const router = useRouter();
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const bottomSheetRef = useRef<BottomSheet>(null);

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  }

  const openBottomSheet = () => {
    bottomSheetRef.current?.close();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.back}>
          <TouchableOpacity style={styles.backbutton} onPress={router.back}>
            <ChevronLeft
              size={30}
              strokeWidth={2}
              color={scheme === "dark" ? "#d8d8d8ff" : "#000"}
            />
          </TouchableOpacity>
        </View>
        <Bolt size={40} strokeWidth={2} style={styles.icon} />
        <Text style={styles.title}>{t("settings")}</Text>
      </View>

      <PaperProvider>
        <View
          style={{
            paddingTop: 50,
            flexDirection: "row",
            justifyContent: "center",
          }}
          >
          <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
              <TouchableOpacity style={styles.button} onPress={openMenu}>
                <Text style={styles.menu}> {t("language")} </Text>
                <ChevronDown size={28} color="#d8d8d8ff" strokeWidth={2} />
              </TouchableOpacity>
            }
            >
            <Menu.Item
              leadingIcon="web"
              onPress={() => changeLanguage("de")}
              title="German"
              />
            <Menu.Item
              leadingIcon="web"
              onPress={() => changeLanguage("en")}
              title="English"
              />
            <Divider />
            <Menu.Item
              disabled={true}
              leadingIcon="web"
              onPress={() => {}}
              title="French"
              />
          </Menu>
        </View>
      </PaperProvider>
    </View>
  );
};

export default settings;

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
    icon: {
      marginRight: 28,
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 52,
      paddingLeft: 40,
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
