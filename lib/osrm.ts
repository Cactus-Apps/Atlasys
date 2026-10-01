export type OsrmProfile = "driving" | "cycling" | "walking";

/**
 * OSRM servers are public community instances and occasionally return
 * 400/500/Timeout. Therefore, there are two endpoints for each profile (primary +
 * fallback); each is retried once in case of failure before the
 * next server is attempted. Only if all fail is the result
 * `null` (Error #5).
 */
export const OSRM_ENDPOINTS: Record<
  OsrmProfile,
  { primary: string; fallback: string }
> = {
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
  waypoints: [number, number][] = [],
): Promise<any[] | null> {
  const servers = [
    OSRM_ENDPOINTS[profile].primary,
    OSRM_ENDPOINTS[profile].fallback,
  ];
  const coordinates = [from, ...waypoints, to]
    .map((c) => `${c[0]},${c[1]}`)
    .join(";");

  for (const server of servers) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const url =
        `${server}/route/v1/${profile}/` +
        `${coordinates}` +
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
      } catch (e) {}
    }
  }
  return null;
}
