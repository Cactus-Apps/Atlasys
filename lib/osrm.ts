import * as Sentry from "@sentry/react-native";

export type OsrmProfile = "driving" | "cycling" | "walking";

/**
 * OSRM-Server sind öffentliche Community-Instanzen und liefern gelegentlich
 * 400/500/Timeout. Für jedes Profil gibt es daher zwei Endpoints (primär +
 * Fallback); jeder wird bei einem Fehlschlag einmal wiederholt, bevor der
 * nächste Server versucht wird. Erst wenn alle fehlschlagen, ist das Ergebnis
 * `null` (Fehler #5).
 */
export const OSRM_ENDPOINTS: Record<OsrmProfile, { primary: string; fallback: string }> = {
  driving: {
    primary: "https://routing.openstreetmap.de/routed-car",
    fallback: "https://router.project-osrm.org",
  },
  cycling: {
    primary: "https://routing.openstreetmap.de/routed-bike",
    fallback: "https://router.project-osrm.org",
  },
  walking: {
    primary: "https://routing.openstreetmap.de/routed-foot",
    fallback: "https://router.project-osrm.org",
  },
};

export async function fetchOsrmRoutes(
  from: [number, number],
  to: [number, number],
  profile: OsrmProfile,
): Promise<any[] | null> {
  const servers = [OSRM_ENDPOINTS[profile].primary, OSRM_ENDPOINTS[profile].fallback];

  for (const server of servers) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const url =
        `${server}/route/v1/${profile}/` +
        `${from[0]},${from[1]};${to[0]},${to[1]}` +
        `?overview=full&alternatives=true&geometries=geojson&steps=true`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 429) await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        const text = await res.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          continue;
        }
        if (json?.routes?.length) return json.routes;
      } catch (e) {
        sentryLogOnce(e);
      }
    }
  }
  return null;
}

let loggedSentry = false;
function sentryLogOnce(e: any): void {
  if (loggedSentry) return;
  loggedSentry = true;
  Sentry.captureException(e);
}
