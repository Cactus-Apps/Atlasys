import { posthog } from "@/lib/config/posthog";

export function optInPing() {
  posthog.optIn();
}
