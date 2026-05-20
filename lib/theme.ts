import { useColorScheme } from "react-native";
import { useAuthStore } from "@/lib/storage/zustand";

type ThemeTokens = {
  isDark: boolean;
  isModern: boolean;
  bg: string;
  cardBg: string;
  cardBgSecondary: string;
  textColor: string;
  subTextColor: string;
  borderColor: string;
  iconBg: string;
  inputBg: string;
  accentColor: string;
  startbg: string;
  startPrimary: string;
};

export type AppTheme =
  | "light"
  | "dark"
  | "modern"
  | "chill"
  | "midnight"
  | "ocean"
  | "forest";

const THEMES: Record<AppTheme, ThemeTokens> = {
  light: {
    isDark: false,
    isModern: false,
    bg: "#F4F7FB",
    cardBg: "#FAFAFA",
    cardBgSecondary: "#F1F5F9",
    textColor: "#2D4A6B",
    subTextColor: "#7A8FA8",
    borderColor: "rgba(45, 74, 107, 0.09)",
    iconBg: "rgba(0, 196, 180, 0.12)",
    inputBg: "#FFFFFF",
    accentColor: "#2563EB",
    startbg: "#DDDDDD",
    startPrimary: "#333333",
  },

  dark: {
    isDark: true,
    isModern: false,
    bg: "#0F1B2A",
    cardBg: "#17263A",
    cardBgSecondary: "#1A2A3A",
    textColor: "#F3F7FC",
    subTextColor: "#8DA1BA",
    borderColor: "rgba(151, 180, 211, 0.18)",
    iconBg: "rgba(45, 74, 107, 0.28)",
    inputBg: "#24262E",
    accentColor: "#2563EB",
    startbg: "#333333",
    startPrimary: "#DDDDDD",
  },

  modern: {
    isDark: false,
    isModern: true,
    bg: "#F8F8F8",
    cardBg: "#FFFFFF",
    cardBgSecondary: "#F4F4F5",
    textColor: "#111111",
    subTextColor: "#888888",
    borderColor: "rgba(0,0,0,0.08)",
    iconBg: "rgba(0,0,0,0.05)",
    inputBg: "#F4F4F5",
    accentColor: "#007AFF",
    startbg: "#DDDDDD",
    startPrimary: "#333333",
  },

  chill: {
    isDark: true,
    isModern: true,
    bg: "#1C1C1C",
    cardBg: "#2A2A2A",
    cardBgSecondary: "#333333",
    textColor: "#F5F0E8",
    subTextColor: "#9E9689",
    borderColor: "rgba(245, 240, 232, 0.1)",
    iconBg: "rgba(207, 160, 107, 0.15)",
    inputBg: "#2A2A2A",
    accentColor: "#CFA06B",
    startbg: "#333333",
    startPrimary: "#DDDDDD",
  },

  midnight: {
    isDark: true,
    isModern: false,
    bg: "#000000",
    cardBg: "#0A0A0A",
    cardBgSecondary: "#111111",
    textColor: "#FFFFFF",
    subTextColor: "#666666",
    borderColor: "rgba(255,255,255,0.08)",
    iconBg: "rgba(255,255,255,0.06)",
    inputBg: "#111111",
    accentColor: "#6C63FF",
    startbg: "#333333",
    startPrimary: "#DDDDDD",
  },

  ocean: {
    isDark: true,
    isModern: true,
    bg: "#0A1628",
    cardBg: "#0F2040",
    cardBgSecondary: "#132848",
    textColor: "#E0F0FF",
    subTextColor: "#6BA3C8",
    borderColor: "rgba(107, 163, 200, 0.2)",
    iconBg: "rgba(0, 180, 216, 0.2)",
    inputBg: "#0F2040",
    accentColor: "#00B4D8",
    startbg: "#333333",
    startPrimary: "#DDDDDD",
  },

  forest: {
    isDark: false,
    isModern: true,
    bg: "#F0F7EE",
    cardBg: "#FFFFFF",
    cardBgSecondary: "#E8F5E4",
    textColor: "#1B3A2D",
    subTextColor: "#5A8A6A",
    borderColor: "rgba(27, 58, 45, 0.1)",
    iconBg: "rgba(34, 139, 34, 0.1)",
    inputBg: "#F0F7EE",
    accentColor: "#2E7D32",
    startbg: "#DDDDDD",
    startPrimary: "#333333",
  },
};

// ── Semantic colors (not tied to a single theme) ────────────────────────────────
const SEMANTIC = {
  danger: "#EF4444",
  dangerDark: "#B91C1C",
  success: "#22C55E",
  successDark: "#15803D",
  warning: "#F59E0B",
  warningDark: "#D97706",
  info: "#3B82F6",
  purple: "#8B5CF6",
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayDark: "rgba(0, 0, 0, 0.95)",
  white: "#FFFFFF",
  black: "#000000",
  tabIndicator: "#007AFF",
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAppTheme() {
  const systemScheme = useColorScheme();
  const theme = useAuthStore((s) => s.settings.theme) ?? "light";

  const resolvedTheme: AppTheme =
    theme === ("system" as any)
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : theme;

  const tokens = THEMES[resolvedTheme] ?? THEMES.light;
  const { isDark } = tokens;

  const primaryLight = isDark ? "rgba(37, 99, 235, 0.2)" : "#EFF6FF";
  const dangerLight = isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2";
  const successLight = isDark ? "rgba(34, 197, 94, 0.1)" : "#F0FDF4";
  const warningLight = isDark ? "rgba(245, 158, 11, 0.1)" : "#FFFBEB";
  const infoLight = isDark ? "rgba(59, 130, 246, 0.1)" : "#EFF6FF";
  const purpleLight = isDark ? "rgba(139, 92, 246, 0.1)" : "#F5F3FF";
  const chevronColor = isDark ? "#4b5563" : "#94a3b8";

  return {
    theme: resolvedTheme,

    ...tokens,

    ...SEMANTIC,
    primaryLight,
    dangerLight,
    successLight,
    warningLight,
    infoLight,
    purpleLight,
    chevronColor,
  };
}

export type AppThemeReturn = ReturnType<typeof useAppTheme>;
