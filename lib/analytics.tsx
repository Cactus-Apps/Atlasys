import { posthog } from "@/lib/config/posthog";

export type AnalyticsChoice = "full" | "anonymous" | "none";

export function applyAnalyticsChoice(choice: AnalyticsChoice, userId?: string) {
  switch (choice) {
    case "full":
      posthog.optIn();
      if (userId) posthog.identify(userId);
      break;

    case "anonymous":
      posthog.optIn();
      posthog.reset(); // keine User-ID
      break;

    case "none":
      posthog.optOut(); // keine Events mehr
      break;
  }
}
