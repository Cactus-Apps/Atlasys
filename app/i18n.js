import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "../locales/de.json";
import en from "../locales/en.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

const storeLanguage = async (lng) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (e) {}
};

const loadLanguage = async () => {
  try {
    const lng = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (lng) {
      i18n.changeLanguage(lng);
    }
  } catch (e) {}
};

const changeLanguage = async (lng) => {
  await i18n.changeLanguage(lng);
  await storeLanguage(lng);
};

export { changeLanguage, loadLanguage, storeLanguage };
export default i18n;
