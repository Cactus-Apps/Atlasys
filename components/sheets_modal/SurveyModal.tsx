import { useMemo, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ClipboardList, X, ChevronRight, ChevronLeft, Check } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";
import {
  Survey,
  submitSurveyResponses,
  markSurveyCompleted,
} from "@/lib/hooks/surveys";
import { useAuthStore } from "@/lib/storage/zustand";
import PrivacyNotice from "./PrivacyNotice";

interface Props {
  visible: boolean;
  survey: Survey | null;
  onClose: () => void;
}

export default function SurveyModal({ visible, survey, onClose }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.userId);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { answer: string; freeText?: string }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const questions = survey?.questions ?? [];
  const currentQ = questions[step];
  const isLast = step === questions.length - 1;
  const currentAnswer = currentQ ? answers[currentQ.id]?.answer : undefined;
  const currentFreeText = currentQ ? answers[currentQ.id]?.freeText ?? "" : "";

  const handleClose = useCallback(() => {
    setStep(0);
    setAnswers({});
    setSubmitted(false);
    setSubmitting(false);
    onClose();
  }, [onClose]);

  const handleSelect = useCallback(
    (questionId: string, option: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          answer: option,
          freeText: option === "other" ? prev[questionId]?.freeText ?? "" : undefined,
        },
      }));
    },
    [],
  );

  const handleFreeText = useCallback(
    (questionId: string, text: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          answer: "other",
          freeText: text,
        },
      }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!survey || !userId) {
      handleClose();
      return;
    }

    setSubmitting(true);
    try {
      const responses = questions.map((q) => {
        const a = answers[q.id];
        return {
          questionId: q.id,
          answer: a?.answer ?? "",
          freeText: a?.freeText,
        };
      });
      const result = await submitSurveyResponses(survey.id, userId, responses);
      await markSurveyCompleted(survey.id);
      setSubmitted(true);
      if (result.alreadyCompleted) {
        await markSurveyCompleted(survey.id);
      }
    } catch (err) {
      console.warn("Survey submit failed:", err);
      await markSurveyCompleted(survey.id);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [survey, userId, questions, answers, handleClose]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLast, handleSubmit]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

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
          maxHeight: "85%",
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
        progressRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          gap: 6,
        },
        progressDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.borderColor,
        },
        progressDotActive: {
          backgroundColor: theme.primary,
        },
        progressDotDone: {
          backgroundColor: theme.success,
        },
        questionText: {
          fontSize: 16,
          fontFamily: fonts.semibold,
          color: theme.textColor,
          textAlign: "center",
          marginBottom: 20,
          lineHeight: 24,
        },
        optionBtn: {
          borderWidth: 1.5,
          borderColor: theme.borderColor,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 18,
          marginBottom: 10,
          backgroundColor: theme.cardBgSecondary,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        optionBtnSelected: {
          borderColor: theme.primary,
          backgroundColor: theme.primaryLight,
        },
        optionRadio: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: theme.borderColor,
          alignItems: "center",
          justifyContent: "center",
        },
        optionRadioSelected: {
          borderColor: theme.primary,
          backgroundColor: theme.primary,
        },
        optionRadioInner: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.white,
        },
        optionText: {
          fontSize: 14,
          fontFamily: fonts.medium,
          color: theme.textColor,
          flex: 1,
        },
        freeTextInput: {
          borderWidth: 1.5,
          borderColor: theme.borderColor,
          borderRadius: 14,
          padding: 14,
          fontSize: 14,
          fontFamily: fonts.regular,
          color: theme.textColor,
          backgroundColor: theme.inputBg,
          marginTop: 6,
          minHeight: 60,
          textAlignVertical: "top",
        },
        freeTextInputFocus: {
          borderColor: theme.primary,
        },
        navRow: {
          flexDirection: "row",
          gap: 12,
          marginTop: 20,
        },
        navBtn: {
          flex: 1,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          gap: 8,
          justifyContent: "center",
        },
        navBtnPrimary: {
          backgroundColor: theme.primary,
        },
        navBtnSecondary: {
          backgroundColor: theme.cardBgSecondary,
        },
        navBtnDisabled: {
          opacity: 0.4,
        },
        navBtnText: {
          fontFamily: fonts.bold,
          fontSize: 15,
          color: theme.subTextColor,
        },
        navBtnTextPrimary: {
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
        closeBtn: {
          backgroundColor: theme.cardBgSecondary,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          marginTop: 20,
        },
        closeBtnText: {
          fontFamily: fonts.bold,
          fontSize: 15,
          color: theme.subTextColor,
        },
      }),
    [theme],
  );

  if (!survey || !questions.length) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.overlay}>
          <View style={s.card}>
            {submitted ? (
              <>
                <View style={s.thankYouWrap}>
                  <View style={s.thankYouIcon}>
                    <Check size={28} color={theme.success} />
                  </View>
                  <Text style={s.thankYouTitle}>{t("Survey_thanks_title")}</Text>
                  <Text style={s.thankYouBody}>{t("Survey_thanks_body")}</Text>
                </View>
                <TouchableOpacity
                  style={s.closeBtn}
                  activeOpacity={0.7}
                  onPress={handleClose}
                >
                  <Text style={s.closeBtnText}>{t("Close")}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.iconWrap}>
                  <ClipboardList size={28} color={theme.primary} />
                </View>
                <Text style={s.title}>{survey.title}</Text>

                <View style={s.progressRow}>
                  {questions.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.progressDot,
                        i === step && s.progressDotActive,
                        i < step && s.progressDotDone,
                      ]}
                    />
                  ))}
                </View>

                {currentQ && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={s.questionText}>{currentQ.question}</Text>

                    {currentQ.options.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          s.optionBtn,
                          currentAnswer === opt && s.optionBtnSelected,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSelect(currentQ.id, opt)}
                      >
                        <View
                          style={[
                            s.optionRadio,
                            currentAnswer === opt && s.optionRadioSelected,
                          ]}
                        >
                          {currentAnswer === opt && (
                            <View style={s.optionRadioInner} />
                          )}
                        </View>
                        <Text style={s.optionText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={[
                        s.optionBtn,
                        currentAnswer === "other" && s.optionBtnSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleSelect(currentQ.id, "other")}
                    >
                      <View
                        style={[
                          s.optionRadio,
                          currentAnswer === "other" && s.optionRadioSelected,
                        ]}
                      >
                        {currentAnswer === "other" && (
                          <View style={s.optionRadioInner} />
                        )}
                      </View>
                      <Text style={s.optionText}>{t("Survey_other")}</Text>
                    </TouchableOpacity>

                    {currentAnswer === "other" && (
                      <TextInput
                        style={s.freeTextInput}
                        multiline
                        placeholder={t("Survey_free_text_placeholder")}
                        placeholderTextColor={theme.subTextColor}
                        value={currentFreeText}
                        onChangeText={(text) =>
                          handleFreeText(currentQ.id, text)
                        }
                      />
                    )}

                    <PrivacyNotice text={t("Survey_privacy")} />
                  </ScrollView>
                )}

                <View style={s.navRow}>
                  {step > 0 && (
                    <TouchableOpacity
                      style={[s.navBtn, s.navBtnSecondary]}
                      activeOpacity={0.7}
                      onPress={handleBack}
                    >
                      <ChevronLeft size={18} color={theme.subTextColor} />
                      <Text style={s.navBtnText}>{t("Back")}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      s.navBtn,
                      s.navBtnPrimary,
                      !currentAnswer && s.navBtnDisabled,
                    ]}
                    activeOpacity={0.7}
                    onPress={handleNext}
                    disabled={!currentAnswer || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color={theme.white} size="small" />
                    ) : (
                      <>
                        <Text style={[s.navBtnText, s.navBtnTextPrimary]}>
                          {isLast ? t("Survey_submit") : t("Next")}
                        </Text>
                        {!isLast && (
                          <ChevronRight size={18} color={theme.white} />
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
