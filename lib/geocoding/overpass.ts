import i18n from "@/app/i18n";

export type OverpassPOIDetails = {
  name?: string;
  phone?: string;
  website?: string;
  email?: string;
  openingHours?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  postcode?: string;
  wheelchair?: "yes" | "no" | "limited";
  cuisine?: string;
  takeaway?: string;
  delivery?: string;
  stars?: string;
  fee?: string;
  wikidata?: string;
  wikipedia?: string;
  description?: string;
};

export type OpenStatus = {
  isOpen: boolean;
  label: string;
  color: string;
};

export async function getOsmIdFromNominatim(
  name: string,
  lat: number,
  lon: number,
): Promise<{ osm_id: number; osm_type: string } | null> {
  try {
    const query = `${name}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&lat=${lat}&lon=${lon}&bounded=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.length) return null;
    const result = json[0];
    const osm_id = Number(result.osm_id);
    if (!osm_id) return null;
    const osm_type = result.osm_type; // 'node', 'way', 'relation'
    // For ways and relations, osm_id is positive, but we need to make it negative for ways if needed, but since we use abs, no need
    return { osm_id, osm_type };
  } catch {
    return null;
  }
}

export async function fetchPOIDetails(
  osmId: number,
  osmType?: string,
  retries = 2,
): Promise<OverpassPOIDetails | null> {
  if (!osmId) return null;

  const absId = Math.abs(osmId);
  const validTypes = ["node", "way", "relation"];
  const elementType = validTypes.includes(osmType || "") ? osmType : "node";
  const query = `[out:json][timeout:10];${elementType}(${absId});out body;`;

  const UA = `Atlasys/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL || "atlasys@app"})`;
  const url = "https://overpass-api.de/api/interpreter";
  const body = `data=${encodeURIComponent(query)}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": UA,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { continue; }
      const element = json.elements?.[0];
      if (!element?.tags) continue;

      const t = element.tags;
      return {
        name: t.name,
        phone: t.phone ?? t["contact:phone"],
        website: t.website ?? t["contact:website"] ?? t.url,
        email: t.email ?? t["contact:email"],
        openingHours: t.opening_hours,
        street: t["addr:street"],
        housenumber: t["addr:housenumber"],
        city: t["addr:city"],
        postcode: t["addr:postcode"],
        wheelchair: t.wheelchair,
        cuisine: t.cuisine?.replace(/;/g, ", "),
        takeaway: t.takeaway,
        delivery: t.delivery,
        stars: t.stars ?? t["tourism:stars"],
        fee: t.fee,
        wikidata: t.wikidata,
        wikipedia: t.wikipedia,
        description: t.description,
      };
    } catch (e) {
      if (attempt === retries) return null;
    }
  }
  return null;
}

export function parseOpeningHours(raw: string): OpenStatus {
  if (!raw)
    return {
      isOpen: false,
      label: i18n.t("Opening_hours_unknown"),
      color: "#94A3B8",
    };
  if (raw.toLowerCase() === "24/7") {
    return {
      isOpen: true,
      label: i18n.t("Opening_hours_always_open"),
      color: "#22C55E",
    };
  }

  try {
    const now = new Date();
    const dayIndex = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const dayMap: Record<string, number> = {
      Mo: 1,
      Tu: 2,
      We: 3,
      Th: 4,
      Fr: 5,
      Sa: 6,
      Su: 0,
    };

    const parts = raw.split(";").map((s) => s.trim());

    for (const part of parts) {
      const match = part.match(
        /^([A-Za-z,\-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/,
      );
      if (!match) continue;

      const [, daysPart, openStr, closeStr] = match;
      const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const openMin = toMin(openStr);
      const closeMin = toMin(closeStr);

      const applicableDays: number[] = [];
      const dayGroups = daysPart.split(",");
      for (const group of dayGroups) {
        if (group.includes("-")) {
          const [start, end] = group.split("-");
          const startIdx = dayMap[start];
          const endIdx = dayMap[end];
          if (startIdx !== undefined && endIdx !== undefined) {
            let i = startIdx;
            while (i !== endIdx) {
              applicableDays.push(i);
              i = i === 6 ? 0 : i + 1;
            }
            applicableDays.push(endIdx);
          }
        } else {
          const idx = dayMap[group.trim()];
          if (idx !== undefined) applicableDays.push(idx);
        }
      }

      if (!applicableDays.includes(dayIndex)) continue;

      const isOpen = currentMinutes >= openMin && currentMinutes < closeMin;

      if (isOpen) {
        const closingSoon = closeMin - currentMinutes <= 60;
        return {
          isOpen: true,
          label: closingSoon
            ? i18n.t("Opening_hours_closes_soon", { time: closeStr })
            : i18n.t("Opening_hours_open_until", { time: closeStr }),
          color: closingSoon ? "#F59E0B" : "#22C55E",
        };
      } else if (currentMinutes < openMin) {
        return {
          isOpen: false,
          label: i18n.t("Opening_hours_closed_opens", { time: openStr }),
          color: "#EF4444",
        };
      } else {
        return {
          isOpen: false,
          label: i18n.t("Opening_hours_closed_opens_tomorrow", {
            time: openStr,
          }),
          color: "#EF4444",
        };
      }
    }

    return {
      isOpen: false,
      label: i18n.t("Opening_hours_closed_today"),
      color: "#EF4444",
    };
  } catch {
    return { isOpen: false, label: raw, color: "#94A3B8" };
  }
}

export type DayHours = {
  day: string;
  hours: string;
};

export function parseOpeningHoursTable(raw: string): DayHours[] {
  if (!raw) return [];
  if (raw.toLowerCase() === "24/7") {
    return [
      { day: "Mo", hours: "00:00-24:00" },
      { day: "Tu", hours: "00:00-24:00" },
      { day: "We", hours: "00:00-24:00" },
      { day: "Th", hours: "00:00-24:00" },
      { day: "Fr", hours: "00:00-24:00" },
      { day: "Sa", hours: "00:00-24:00" },
      { day: "Su", hours: "00:00-24:00" },
    ];
  }

  const DAY: Record<string, string> = {
    Mo: "Mo", Tu: "Tu", We: "We", Th: "Th", Fr: "Fr", Sa: "Sa", Su: "Su",
  };
  const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const result: DayHours[] = DAYS.map((d) => ({ day: d, hours: "Closed" }));

  const parts = raw.split(";").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^([A-Za-z,\-\s]+)\s+(.+)$/);
    if (!m) continue;
    const daysPart = m[1].trim();
    const hoursPart = m[2].trim().replace(/,/g, ", ");
    const display = hoursPart.toLowerCase() === "off" || hoursPart.toLowerCase() === "closed" ? "Closed" : hoursPart;

    for (const group of daysPart.split(",").map((s) => s.trim())) {
      if (group.includes("-")) {
        const [start, end] = group.split("-").map((s) => s.trim());
        const si = DAYS.indexOf(start);
        const ei = DAYS.indexOf(end);
        if (si !== -1 && ei !== -1) {
          if (si <= ei) {
            for (let i = si; i <= ei; i++) result[i].hours = display;
          } else {
            for (let i = si; i < 7; i++) result[i].hours = display;
            for (let i = 0; i <= ei; i++) result[i].hours = display;
          }
        }
      } else {
        const idx = DAYS.indexOf(group);
        if (idx !== -1) result[idx].hours = display;
      }
    }
  }

  return result;
}
