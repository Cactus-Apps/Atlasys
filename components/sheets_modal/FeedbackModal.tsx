import { useMemo, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MessageSquareHeart, Send, Check, X } from "lucide-react-native";
import * as Sentry from "@sentry/react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";
import PrivacyNotice from "./PrivacyNotice";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ visible, onClose }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    setMessage("");
    setSubmitted(false);
    setSubmitting(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      Sentry.captureMessage(`[UserFeedback] ${trimmed}`, {
        level: "info",
        tags: { type: "user_feedback" },
      });
      setSubmitted(true);
    } catch (err) {
      console.warn("Feedback submit failed:", err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [message]);

  const canSubmit = message.trim().length > 0 && !submitting;

  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: theme.overlay,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        },
        card: {
          width: "100%",
          borderRadius: 24,
          padding: 28,
          backgroundColor: theme.cardBg,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 12,
        },
        closeBtn: {
          position: "absolute",
          top: 16,
          right: 16,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.cardBgSecondary,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        },
        iconWrap: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
          marginBottom: 20,
        },
        title: {
          fontSize: 20,
          fontFamily: fonts.bold,
          color: theme.textColor,
          textAlign: "center",
          marginBottom: 8,
        },
        body: {
          fontSize: 14,
          fontFamily: fonts.regular,
          color: theme.subTextColor,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 20,
        },
        input: {
          borderWidth: 1.5,
          borderColor: theme.borderColor,
          borderRadius: 14,
          padding: 14,
          fontSize: 14,
          fontFamily: fonts.regular,
          color: theme.textColor,
          backgroundColor: theme.inputBg,
          minHeight: 120,
          textAlignVertical: "top",
          lineHeight: 20,
        },
        inputFocused: {
          borderColor: theme.primary,
        },
        submitBtn: {
          backgroundColor: theme.primary,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          gap: 10,
          justifyContent: "center",
          marginTop: 16,
        },
        submitBtnDisabled: {
          opacity: 0.4,
        },
        submitBtnText: {
          fontFamily: fonts.bold,
          fontSize: 15,
          color: theme.white,
        },
        thankYouWrap: {
          alignItems: "center",
          paddingVertical: 20,
        },
        thankYouIcon: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.successLight,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        },
        thankYouTitle: {
          fontSize: 20,
          fontFamily: fonts.bold,
          color: theme.textColor,
          textAlign: "center",
          marginBottom: 8,
        },
        thankYouBody: {
          fontSize: 14,
          fontFamily: fonts.regular,
          color: theme.subTextColor,
          textAlign: "center",
          lineHeight: 22,
        },
        closeDoneBtn: {
          backgroundColor: theme.cardBgSecondary,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          marginTop: 20,
        },
        closeDoneBtnText: {
          fontFamily: fonts.bold,
          fontSize: 15,
          color: theme.subTextColor,
        },
      }),
    [theme],
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.overlay}>
          <View style={s.card}>
            <TouchableOpacity
              style={s.closeBtn}
              activeOpacity={0.7}
              onPress={handleClose}
            >
              <X size={16} color={theme.subTextColor} />
            </TouchableOpacity>

            {submitted ? (
              <>
                <View style={s.thankYouWrap}>
                  <View style={s.thankYouIcon}>
                    <Check size={28} color={theme.success} />
                  </View>
                  <Text style={s.thankYouTitle}>{t("Feedback_thanks_title")}</Text>
                  <Text style={s.thankYouBody}>{t("Feedback_thanks_body")}</Text>
                </View>
                <TouchableOpacity
                  style={s.closeDoneBtn}
                  activeOpacity={0.7}
                  onPress={handleClose}
                >
                  <Text style={s.closeDoneBtnText}>{t("Close")}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.iconWrap}>
                  <MessageSquareHeart size={28} color={theme.primary} />
                </View>
                <Text style={s.title}>{t("Feedback_title")}</Text>
                <Text style={s.body}>{t("Feedback_body")}</Text>

                <TextInput
                  style={s.input}
                  multiline
                  placeholder={t("Feedback_placeholder")}
                  placeholderTextColor={theme.subTextColor}
                  value={message}
                  onChangeText={setMessage}
                />

                <PrivacyNotice text={t("Feedback_privacy")} />

                <TouchableOpacity
                  style={[
                    s.submitBtn,
                    !canSubmit && s.submitBtnDisabled,
                  ]}
                  activeOpacity={0.7}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator color={theme.white} size="small" />
                  ) : (
                    <>
                      <Send size={16} color={theme.white} />
                      <Text style={s.submitBtnText}>{t("Feedback_submit")}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
