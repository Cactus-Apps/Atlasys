import type { WidgetTheme } from "@/lib/widgets/theme";

export type RouteInfoWidgetSnapshot = {
  version: 1;
  locale: string;
  theme: WidgetTheme;
  hasRoute: boolean;
  labelText: string;
  emptyText: string;
  promptText: string;
  destinationText: string;
  instructionText: string;
  streetText: string;
  distanceLabelText: string;
  distanceText: string;
  durationLabelText: string;
  durationText: string;
  profileText: string;
  stepText: string;
  updatedAtText: string;
  segmentCount: number;
  activeSegment: number;
};

type RouteInfoSnapshotInput = {
  hasRoute: boolean;
  destinationName?: string | null;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  profile?: string | null;
  stepCount?: number;
  stepIndex?: number;
  instruction?: string | null;
  streetName?: string | null;
  updatedAt?: number | null;
  locale: string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export const ROUTE_SEGMENTS = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function formatDistance(meters: number | null | undefined) {
  const value = Number.isFinite(meters) ? Math.max(0, meters as number) : 0;
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${Math.round(value)} m`;
}

function formatDuration(seconds: number | null | undefined) {
  const total = Number.isFinite(seconds) ? Math.max(0, seconds as number) : 0;
  const minutes = Math.max(1, Math.round(total / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function formatTimeOfDay(timestamp: number | null | undefined) {
  if (!timestamp) return "--:--";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildRouteInfoWidgetSnapshot(
  input: RouteInfoSnapshotInput,
  theme: WidgetTheme,
): RouteInfoWidgetSnapshot {
  const stepCount = Math.max(0, input.stepCount ?? 0);
  const stepIndex = clamp(input.stepIndex ?? 0, 0, Math.max(0, stepCount - 1));
  const hasRoute =
    input.hasRoute &&
    (stepCount > 0 ||
      (Number.isFinite(input.distanceMeters) &&
        (input.distanceMeters as number) > 0));
  const profileKey = input.profile
    ? `Route_profile_${input.profile}`
    : "Route_profile_driving";

  return {
    version: 1,
    locale: input.locale,
    theme,
    hasRoute,
    labelText: input.t("Widget_route_label"),
    emptyText: input.t("Widget_route_empty"),
    promptText: input.t("Widget_route_unknown"),
    destinationText: truncate(
      input.destinationName || input.t("Widget_route_unknown"),
      30,
    ),
    instructionText:
      input.instruction || input.t("Widget_route_continue"),
    streetText: truncate(input.streetName || "", 32),
    distanceLabelText: input.t("Widget_route_distance"),
    distanceText: hasRoute ? formatDistance(input.distanceMeters) : "--",
    durationLabelText: input.t("Widget_route_duration"),
    durationText: hasRoute ? formatDuration(input.durationSeconds) : "--",
    profileText: input.t(profileKey).toUpperCase(),
    stepText:
      hasRoute && stepCount > 0 ? `${stepIndex + 1}/${stepCount}` : "",
    updatedAtText: input.t("Widget_route_updated", {
      time: formatTimeOfDay(input.updatedAt),
    }),
    segmentCount: hasRoute ? ROUTE_SEGMENTS : 0,
    activeSegment: hasRoute
      ? clamp(
          Math.round(
            (stepIndex / Math.max(1, stepCount)) * ROUTE_SEGMENTS,
          ),
          0,
          ROUTE_SEGMENTS - 1,
        )
      : 0,
  };
}
