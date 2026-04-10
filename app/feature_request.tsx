import { FeedbackForm } from "@sentry/react-native";
import { router } from "expo-router";
import * as Sentry from "@sentry/react-native";

export default function FeatureRequest() {
  return (
    <FeedbackForm
      submitButtonLabel="Send"
      formTitle="Give Feedback"
      isEmailRequired={true}
      shouldValidateEmail={true}
      messagePlaceholder="Describe the requested feature"
      onFormClose={() => router.push("/help_feedback")}
      onFormSubmitted={() => router.push("/help_feedback")}
      onSubmitError={(error) =>
        Sentry.captureException(
          error instanceof Error
            ? error
            : new Error("Failed to submit feature request feedback"),
        )
      }
      styles={{
        container: {
          margin: 15,
          marginTop: 30,
          backgroundColor: "transparent",
          borderWidth: 0,
          shadowColor: "transparent",
          elevation: 0,
        },
        submitButton: {
          backgroundColor: "#16A34A",
          borderRadius: 10,
        },
        cancelButton: {
          borderRadius: 10,
        },
      }}
    />
  );
}
