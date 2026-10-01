import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "../locales/de.json";
import en from "../locales/en.json";
import es from "../locales/es.json";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "userLanguage";

/**
 * Resolves when default i18n init and persisted language restore have finished.
 * Gate the root UI on this so the first paint does not show raw translation keys.
 */
// eslint-disable-next-line import/no-named-as-default-member
export const i18nReady = i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      es: { translation: es },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .then(() => loadLanguage());

/** @returns {Promise<void>} Resolves when bundled strings and persisted language are applied. */
export function ensureTranslationsLoaded() {
  return i18nReady;
}

const storeLanguage = async (lng: any) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (err) {}
};

const loadLanguage = async () => {
  try {
    const lng = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (lng) {
      // eslint-disable-next-line import/no-named-as-default-member
      await i18n.changeLanguage(lng);
    }
  } catch (err) {}
};

const changeLanguage = async (lng: any) => {
  // eslint-disable-next-line import/no-named-as-default-member
  await i18n.changeLanguage(lng);
  await storeLanguage(lng);
};

export { changeLanguage, loadLanguage, storeLanguage };
export default i18n;
