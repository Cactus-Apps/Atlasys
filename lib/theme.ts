import { useColorScheme } from "react-native";
import { useAuthStore } from "@/lib/storage/zustand";

export function useAppTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const designStyle = useAuthStore((s) => s.settings.designStyle) || "classic";

  const isModern = designStyle === "modern";

  // Base colors that change heavily between modern and classic styles
  const bg = isDark ? (isModern ? "#0F172A" : "#0D1117") : (isModern ? "#F4F4F5" : "#F8FAFC");
  const cardBg = isDark ? (isModern ? "#1E293B" : "#161B22") : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : (isModern ? "#09090B" : "#1E293B");
  const subTextColor = isDark 
    ? (isModern ? "#94A3B8" : "#94a3b8") 
    : (isModern ? "#71717A" : "#64748b");
  const borderColor = isDark 
    ? (isModern ? "#334155" : "rgba(255, 255, 255, 0.1)") 
    : (isModern ? "#E4E4E7" : "rgba(0, 0, 0, 0.05)");

  // Modern uses specific icon backgrounds
  const iconBg = isDark ? (isModern ? "#1E3A5F" : "rgba(255,255,255,0.05)") : (isModern ? "#EFF6FF" : "#EFF6FF");

  return {
    isDark,
    isModern,
    bg,
    cardBg,
    textColor,
    subTextColor,
    borderColor,
    iconBg,
  };
}
