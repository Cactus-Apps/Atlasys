import { Bolt, ChevronDown } from "lucide-react-native";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Divider, Menu, PaperProvider } from "react-native-paper";
import "./i18n";

const settings = () => {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = React.useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const changeLanguage = (lng: any) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <View style={styles.header}>
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
                <Text style={styles.test}> {t('language')} </Text>
                <ChevronDown size={28} color="#ffffffff" strokeWidth={2} />
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
    </>
  );
};

export default settings;

const styles = StyleSheet.create({
  icon: {
    marginRight: 28,
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
  },
  test: {
    fontSize: 25,
    fontFamily: "Light",
    color: "#ffffffff",
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
