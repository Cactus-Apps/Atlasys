import type { AppThemeReturn } from "@/lib/theme";

export type WidgetTheme = {
  surface: string;
  raised: string;
  sunken: string;
  hairline: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  onAccent: string;
  positive: string;
  neutral: string;
};

type Rgba = { r: number; g: number; b: number; a: number };

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function parseColor(value: string): Rgba | null {
  const input = value.trim();

  if (input.startsWith("#")) {
    const hex = input.slice(1);
    const short = hex.length === 3 || hex.length === 4;
    if (!short && hex.length !== 6 && hex.length !== 8) return null;
    if (!/^[0-9a-f]+$/i.test(hex)) return null;

    const read = (index: number) =>
      parseInt(
        short ? hex[index] + hex[index] : hex.slice(index * 2, index * 2 + 2),
        16,
      );
    const rawAlpha = short
      ? hex.length === 4
        ? read(3)
        : 15
      : hex.length === 8
        ? read(3)
        : 255;

    return {
      r: read(0),
      g: read(1),
      b: read(2),
      a: short ? rawAlpha / 15 : rawAlpha / 255,
    };
  }

  const match = input.match(/^rgba?\(([^)]*)\)$/i);
  if (!match) return null;

  const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;

  return {
    r: parts[0],
    g: parts[1],
    b: parts[2],
    a: parts.length > 3 && !Number.isNaN(parts[3]) ? clamp01(parts[3]) : 1,
  };
}

function toHex(channels: [number, number, number]) {
  return `#${channels
    .map((channel) =>
      Math.round(clamp01(channel / 255) * 255)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase(),
    )
    .join("")}`;
}

export function flattenColor(value: string, base: string) {
  const top = parseColor(value);
  const bottom = parseColor(base);
  if (!top || !bottom) return base;
  if (top.a >= 1) return toHex([top.r, top.g, top.b]);

  const over = (topChannel: number, baseChannel: number) =>
    topChannel * top.a + baseChannel * (1 - top.a);

  return toHex([
    over(top.r, bottom.r),
    over(top.g, bottom.g),
    over(top.b, bottom.b),
  ]);
}

export function mix(from: string, to: string, amount: number) {
  const a = parseColor(flattenColor(from, to));
  const b = parseColor(to);
  if (!a || !b) return from;

  const t = clamp01(amount);
  return toHex([
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  ]);
}

function luminance(color: string) {
  const parsed = parseColor(color) ?? { r: 0, g: 0, b: 0, a: 1 };
  const channel = (raw: number) => {
    const value = clamp01(raw / 255);
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * channel(parsed.r) +
    0.7152 * channel(parsed.g) +
    0.0722 * channel(parsed.b)
  );
}

function contrastRatio(a: number, b: number) {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function inkFor(background: string) {
  const light = "#FFFFFF";
  const dark = "#0B1220";

  return contrastRatio(luminance(background), luminance(dark)) >=
    contrastRatio(luminance(background), luminance(light))
    ? dark
    : light;
}

export function buildWidgetTheme(app: AppThemeReturn): WidgetTheme {
  const surface = app.bg;
  const muted = app.subTextColor;
  const accent = app.accentColor;

  return {
    surface,
    raised: flattenColor(app.cardBg, surface),
    sunken: flattenColor(app.cardBgSecondary, surface),
    hairline: mix(surface, app.textColor, 0.12),
    text: app.textColor,
    muted,
    faint: mix(surface, muted, 0.5),
    accent,
    onAccent: inkFor(accent),
    positive: app.success,
    neutral: mix(surface, muted, 0.25),
  };
}
