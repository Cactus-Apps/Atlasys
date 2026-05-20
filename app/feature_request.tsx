import { FeedbackWidget } from "@sentry/react-native";
import { router } from "expo-router";
import * as Sentry from "@sentry/react-native";
import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";

export default function FeatureRequest() {
  const theme = useAppTheme();
  const { t } = useTranslation();

  return (
    <FeedbackWidget
      submitButtonLabel={t("Feedback_submit")}
      formTitle={t("Feedback_title")}
      isEmailRequired={true}
      shouldValidateEmail={true}
      messagePlaceholder={t("Feedback_placeholder")}
      onFormClose={() => router.push("/help_feedback")}
      onFormSubmitted={() => router.push("/help_feedback")}
      onSubmitError={(error: any) =>
        Sentry.captureException(
          error instanceof Error
            ? error
            : new Error("Failed to submit feature request feedback"),
        )
      }
      styles={{
        container: {
          padding: 15,
          paddingTop: 50,
          backgroundColor: theme.bg,
          borderWidth: 0,
          shadowColor: "transparent",
          elevation: 0,
          flex: 1,
        },
        title: {
          color: theme.textColor,
          fontSize: 32,
          fontWeight: "bold",
          paddingRight: 34,
        },
        label: {
          color: theme.textColor,
          fontSize: 16,
          paddingVertical: 8,
        },
        input: {
          color: theme.textColor,
          backgroundColor: theme.inputBg,
          borderColor: theme.borderColor,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 16,
        },
        textArea: {
          color: theme.textColor,
          backgroundColor: theme.inputBg,
          borderColor: theme.borderColor,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 16,
          minHeight: 100,
        },
        submitButton: {
          backgroundColor: theme.success,
          borderRadius: 10,
          paddingHorizontal: 34,
          paddingVertical: 13,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 20,
        },
        submitText: {
          color: theme.white,
          fontSize: 16,
          fontWeight: "600",
        },
        cancelButton: {
          borderRadius: 10,
          paddingHorizontal: 34,
          paddingVertical: 13,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: theme.subTextColor,
          backgroundColor: theme.cardBgSecondary,
          marginTop: 8,
        },
        cancelText: {
          color: theme.subTextColor,
          fontSize: 16,
          fontWeight: "600",
        },
        sentryLogo: {
          tintColor: theme.textColor,
          width: 50,
          height: 50,
        },
      }}
    />
  );
}
