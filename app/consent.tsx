import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Sentry from "@sentry/react-native";
import { ShieldAlert, Check, ChevronRight } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useAuth } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/auth/supabase";
import {
  CONSENT_VERSION,
  APP_VERSION,
  saveConsentLocally,
  syncConsentToServer,
} from "@/lib/consent";

export default function ConsentUpdateScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const s = useMemo(() => getStyles(theme), [theme]);
  const changes = useMemo(() => t("Consent_update_changes").split("\n"), [t]);

  const handleAccept = useCallback(async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      setConsentError(true);
      return;
    }
    try {
      await saveConsentLocally();
      if (user) {
        await syncConsentToServer(user.id, supabase);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
    router.replace(user ? "/(tabs)/mapscreen" : "/auth");
  }, [acceptedTerms, acceptedPrivacy, user, router]);

  const openTerms = () =>
    router.push({
      pathname: "/(legal)/Terms_of_Use",
      params: { from: "reconsent" },
    });

  const openPrivacy = () =>
    router.push({
      pathname: "/(legal)/Privacy_Policy",
      params: { from: "reconsent" },
    });

  const toggle = (setter: (v: boolean) => void) => (v: boolean) => {
    setter(v);
    setConsentError(false);
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.bg }]}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)} style={s.iconWrap}>
          <View style={s.iconBg}>
            <ShieldAlert size={40} color="#00C4B4" />
          </View>
        </Animated.View>

        <Text style={s.headline}>{t("Consent_update_headline")}</Text>
        <Text style={s.sub}>{t("Consent_update_sub")}</Text>

        <View style={s.changesCard}>
          <View style={s.changesHeader}>
            <Text style={s.changesTitle}>
              {t("Consent_update_changes_title")}
            </Text>
          </View>
          {changes.map((line, i) => (
            <View key={i} style={s.changeRow}>
              <View style={s.changeBullet} />
              <Text style={s.changeText}>{line}</Text>
            </View>
          ))}
        </View>

        <Text style={s.docsLabel}>{t("Consent_update_docs_label")}</Text>

        <TouchableOpacity
          style={s.docRow}
          onPress={openTerms}
          activeOpacity={0.7}
        >
          <Text style={s.docRowText}>{t("Onboarding_terms_link")}</Text>
          <ChevronRight size={18} color={theme.subTextColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.docRow}
          onPress={openPrivacy}
          activeOpacity={0.7}
        >
          <Text style={s.docRowText}>{t("Onboarding_privacy_link")}</Text>
          <ChevronRight size={18} color={theme.subTextColor} />
        </TouchableOpacity>

        <View style={s.checkboxArea}>
          <TouchableOpacity
            style={[
              s.checkboxRow,
              consentError && !acceptedTerms && s.checkboxRowError,
            ]}
            onPress={() => toggle(setAcceptedTerms)(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, acceptedTerms && s.checkboxChecked]}>
              {acceptedTerms && (
                <Check size={13} color="#fff" strokeWidth={3} />
              )}
            </View>
            <Text style={s.checkboxText}>
              {t("Onboarding_accept_terms_prefix")}{" "}
              <Text style={s.checkboxLink} onPress={openTerms}>
                {t("Onboarding_terms_link")}
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.checkboxRow,
              consentError && !acceptedPrivacy && s.checkboxRowError,
            ]}
            onPress={() => toggle(setAcceptedPrivacy)(!acceptedPrivacy)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, acceptedPrivacy && s.checkboxChecked]}>
              {acceptedPrivacy && (
                <Check size={13} color="#fff" strokeWidth={3} />
              )}
            </View>
            <Text style={s.checkboxText}>
              {t("Onboarding_accept_privacy_prefix")}{" "}
              <Text style={s.checkboxLink} onPress={openPrivacy}>
                {t("Onboarding_privacy_link")}
              </Text>{" "}
              {t("Onboarding_accept_privacy_suffix")}
            </Text>
          </TouchableOpacity>
        </View>

        {consentError && (
          <Animated.View entering={FadeIn.duration(200)} style={s.errorBox}>
            <Text style={s.errorText}>{t("Onboarding_consent_error")}</Text>
          </Animated.View>
        )}

        <Text style={s.versionNote}>
          {t("Onboarding_version_note", {
            version: CONSENT_VERSION,
            version2: APP_VERSION,
          })}
        </Text>

        <TouchableOpacity
          onPress={handleAccept}
          activeOpacity={0.85}
          style={[
            s.nextBtn,
            {
              backgroundColor:
                acceptedTerms && acceptedPrivacy
                  ? "#00C4B4"
                  : "rgba(0,196,180,0.18)",
            },
          ]}
        >
          <Text
            style={[
              s.nextBtnText,
              {
                color:
                  acceptedTerms && acceptedPrivacy
                    ? "#fff"
                    : theme.subTextColor,
              },
            ]}
          >
            {t("Consent_update_accept")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { cardBg, textColor, subTextColor, borderColor, danger, dangerLight } =
    theme;

  return StyleSheet.create({
    root: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    iconWrap: {
      alignItems: "center",
      marginBottom: 20,
    },
    iconBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(0,196,180,0.15)",
      borderWidth: 1,
      borderColor: "rgba(0,196,180,0.4)",
      justifyContent: "center",
      alignItems: "center",
    },
    headline: {
      fontSize: 26,
      fontFamily: fonts.bold,
      color: textColor,
      textAlign: "center",
      letterSpacing: -0.5,
      lineHeight: 32,
      marginBottom: 10,
    },
    sub: {
      fontSize: 15,
      color: subTextColor,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 22,
    },
    changesCard: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      gap: 10,
    },
    changesHeader: {
      marginBottom: 2,
    },
    changesTitle: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: textColor,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    changeRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    changeBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#00C4B4",
      marginTop: 6,
    },
    changeText: {
      flex: 1,
      fontSize: 14,
      color: subTextColor,
      lineHeight: 21,
    },
    legalNote: {
      fontSize: 12,
      color: subTextColor,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    docsLabel: {
      fontSize: 11,
      fontFamily: fonts.bold,
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
    },
    docRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    docRowText: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: textColor,
    },
    checkboxArea: {
      gap: 12,
      marginTop: 12,
      marginBottom: 8,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 14,
      padding: 14,
    },
    checkboxRowError: {
      borderColor: danger,
      backgroundColor: dangerLight,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: borderColor,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
      marginTop: 1,
    },
    checkboxChecked: {
      backgroundColor: "#00C4B4",
      borderColor: "#00C4B4",
    },
    checkboxText: {
      flex: 1,
      fontSize: 14,
      color: textColor,
      lineHeight: 20,
    },
    checkboxLink: {
      color: "#00C4B4",
      fontFamily: fonts.semibold,
      textDecorationLine: "underline",
    },
    errorBox: {
      backgroundColor: dangerLight,
      borderWidth: 1,
      borderColor: danger,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
    },
    errorText: {
      color: danger,
      fontSize: 13,
      textAlign: "center",
    },
    versionNote: {
      fontSize: 11,
      color: subTextColor,
      textAlign: "center",
      marginBottom: 16,
    },
    nextBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 17,
      borderRadius: 18,
    },
    nextBtnText: {
      fontSize: 16,
      fontFamily: fonts.bold,
      letterSpacing: 0.2,
    },
  });
};
