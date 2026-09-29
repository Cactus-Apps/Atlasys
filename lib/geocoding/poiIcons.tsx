import {
  Church,
  Compass,
  Landmark,
  MapPin,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react-native";

export const POI_COLORS: Record<string, string> = {
  museum: "#8B4513",
  monument: "#DAA520",
  artwork: "#8B5CF6",
  attraction: "#E8751A",
  historic: "#B91C1C",
  viewpoint: "#059669",
  worship: "#C94B32",
  food: "#E8751A",
  nightlife: "#7C3AED",
};

export const POI_BG_COLORS: Record<string, string> = {
  museum: "#F5E6D3",
  monument: "#FFF8E1",
  artwork: "#F3E8FF",
  attraction: "#FFF3E0",
  historic: "#FFEBEE",
  viewpoint: "#ECFDF5",
  worship: "#FFF0EB",
  food: "#FFF3E0",
  nightlife: "#F3E8FF",
};

export function getPOIIcon(category: string): LucideIcon {
  switch ((category || "").toLowerCase()) {
    case "museum":
    case "historic":
      return Landmark;
    case "monument":
    case "attraction":
    case "nightlife":
      return Star;
    case "artwork":
    case "viewpoint":
      return Compass;
    case "worship":
      return Church;
    case "food":
      return UtensilsCrossed;
    default:
      return MapPin;
  }
}

export function poiColor(category: string): string {
  return POI_COLORS[(category || "").toLowerCase()] || "#64748B";
}

export function poiBgColor(category: string): string {
  return POI_BG_COLORS[(category || "").toLowerCase()] || "#F1F5F9";
}