type Translate = (key: string, options?: any) => string;

export function formatClock(
  iso: string | undefined,
  locale: string,
  timeZone?: string,
): string {
  if (!iso) return "--:--";
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timeZone || undefined,
    }).format(new Date(iso));
  } catch {
    return "--:--";
  }
}

export function formatTransitDuration(
  seconds: number,
  t: Translate,
): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0
    ? t("Route_duration_hours_mins", { h, m })
    : t("Route_duration_mins", { m });
}

export function formatTransitDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

export function formatShortDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}
