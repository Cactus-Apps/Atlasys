// Version 1.3.6 - © Cactus Apps 2026
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "../locales/ar.json";
import de from "../locales/de.json";
import en from "../locales/en.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import hi from "../locales/hi.json";
import it from "../locales/it.json";
import ja from "../locales/ja.json";
import ko from "../locales/ko.json";
import pt from "../locales/pt.json";
import ru from "../locales/ru.json";
import zh from "../locales/zh.json";
import * as Sentry from "@sentry/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "userLanguage";

/**
 * Resolves when default i18n init and persisted language restore have finished.
 * Gate the root UI on this so the first paint does not show raw translation keys.
 */
export const i18nReady = i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      de: { translation: de },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      hi: { translation: hi },
      it: { translation: it },
      ja: { translation: ja },
      ko: { translation: ko },
      pt: { translation: pt },
      ru: { translation: ru },
      zh: { translation: zh },
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

const storeLanguage = async (lng) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (err) {
    Sentry.captureException(err);
  }
};

const loadLanguage = async () => {
  try {
    const lng = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (lng) {
      await i18n.changeLanguage(lng);
    }
  } catch (err) {
    Sentry.captureException(err);
  }
};

const changeLanguage = async (lng) => {
  await i18n.changeLanguage(lng);
  await storeLanguage(lng);
};

export { changeLanguage, loadLanguage, storeLanguage };
export default i18n;
