import type { LucideIcon } from "lucide-react-native";
import {
  Bike,
  Bus,
  CableCar,
  Car,
  Footprints,
  Plane,
  Ship,
  TrainFront,
  TramFront,
} from "lucide-react-native";
import type { TransitMode } from "./types";

export type TransitModeMeta = {
  icon: LucideIcon;
  color: string;
  labelKey: string;
};

const DEFAULT_META: TransitModeMeta = {
  icon: Bus,
  color: "#64748B",
  labelKey: "route_type_other",
};

const MODE_META: Record<string, TransitModeMeta> = {
  WALK: { icon: Footprints, color: "#6B7280", labelKey: "Route_transit_walk" },
  BIKE: { icon: Bike, color: "#10B981", labelKey: "Route_profile_cycling" },
  CAR: { icon: Car, color: "#3B82F6", labelKey: "Route_profile_driving" },
  BUS: { icon: Bus, color: "#EF4444", labelKey: "route_type_bus" },
  COACH: { icon: Bus, color: "#DC2626", labelKey: "route_type_bus" },
  TRAM: { icon: TramFront, color: "#10B981", labelKey: "route_type_tram" },
  SUBWAY: { icon: TrainFront, color: "#3B82F6", labelKey: "route_type_subway" },
  SUBURBAN: {
    icon: TrainFront,
    color: "#3B82F6",
    labelKey: "route_type_train",
  },
  METRO: { icon: TrainFront, color: "#3B82F6", labelKey: "route_type_subway" },
  RAIL: { icon: TrainFront, color: "#F59E0B", labelKey: "route_type_train" },
  HIGHSPEED_RAIL: {
    icon: TrainFront,
    color: "#F59E0B",
    labelKey: "route_type_train",
  },
  LONG_DISTANCE: {
    icon: TrainFront,
    color: "#F59E0B",
    labelKey: "route_type_train",
  },
  NIGHT_RAIL: {
    icon: TrainFront,
    color: "#F59E0B",
    labelKey: "route_type_train",
  },
  REGIONAL_RAIL: {
    icon: TrainFront,
    color: "#F59E0B",
    labelKey: "route_type_train",
  },
  REGIONAL_FAST_RAIL: {
    icon: TrainFront,
    color: "#F59E0B",
    labelKey: "route_type_train",
  },
  FERRY: { icon: Ship, color: "#06B6D4", labelKey: "route_type_ferry" },
  CABLE_CAR: {
    icon: CableCar,
    color: "#8B5CF6",
    labelKey: "route_type_other",
  },
  FUNICULAR: {
    icon: CableCar,
    color: "#8B5CF6",
    labelKey: "route_type_other",
  },
  AERIAL_LIFT: {
    icon: CableCar,
    color: "#8B5CF6",
    labelKey: "route_type_other",
  },
  PLANE: { icon: Plane, color: "#0EA5E9", labelKey: "route_type_other" },
};

export function getTransitModeMeta(mode: TransitMode): TransitModeMeta {
  return MODE_META[String(mode || "").toUpperCase()] ?? DEFAULT_META;
}

export function normalizeTransitColor(
  color: string | undefined,
  fallback: string,
): string {
  const value = color?.trim();
  if (!value) return fallback;

  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^[0-9a-f]{6}$/i.test(value)) return `#${value}`;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("")}`;
  }
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .split("")
      .map((c) => c + c)
      .join("")}`;
  }

  return fallback;
}

export function getContrastTextColor(hex: string): string {
  const normalized = normalizeTransitColor(hex, "#2563EB").slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111111" : "#FFFFFF";
}
