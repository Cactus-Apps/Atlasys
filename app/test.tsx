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
      <View style={styles.icon}>
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
            style={styles.menu}
            anchor={
              <TouchableOpacity onPress={openMenu}>
                <Text style={styles.test}> Language </Text>
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
  button: {
    backgroundColor: "#466483ff",
    borderRadius: 8,
    marginBottom: 12,
  },
  text: {
    fontSize: 22,
    padding: 14,
    paddingHorizontal: 90,
    color: "#ffffffff",
  },
  icon: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 52,
  },
  title: {
    fontSize: 35,
    marginLeft: 15,
  },
  test: {
    fontSize: 30,
    fontFamily: "Light",
  },
  menu: {
    backgroundColor: "#ff0000ff",
  },
  container: {},
});
