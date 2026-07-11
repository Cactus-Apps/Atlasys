import * as Sentry from "@sentry/react-native";
import i18n from "@/app/i18n";

export type CityPOI = {
  osmId: number;
  osmType: string;
  name: string;
  lat: number;
  lon: number;
  category: string;
  subtype: string;
  image?: string;
  wikidata?: string;
  wikipedia?: string;
  description?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
  cuisine?: string;
  stars?: number;
};

export type CityTransitStop = {
  osmId: number;
  osmType: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  lines?: string[];
  color?: string;
};

export type TransitRoute = {
  id: string;
  ref: string;
  name: string;
  routeType: string;
  colour: string;
  geometry?: {
    type: "LineString" | "MultiLineString";
    coordinates: number[][] | number[][][];
  };
  stops?: CityTransitStop[];
};

export type TransitRouteGeometry = {
  coordinates: [number, number][];
  colour?: string;
  name?: string;
};

export type CityOSMData = {
  osmId: number;
  osmType: string;
  name: string;
  lat: number;
  lon: number;
  bounds?: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  };
};

function l10n(t: Record<string, any>, key: string): string | undefined {
  const lang = i18n.language?.split("-")[0] || "en";
  return t[`${key}:${lang}`] ?? t[key];
}

const HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": `Atlasys/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL || "atlasys@app"})`,
};

const PROXY_URL = process.env.EXPO_PUBLIC_OVERPASS_PROXY_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

async function overpassQuery(
  query: string,
  options?: {
    ttl?: number;
    cityName?: string;
    lat?: number;
    lon?: number;
    radius?: number;
  },
): Promise<any> {
  const DIRECT_URL = "https://overpass-api.de/api/interpreter";

  let finalQuery = query;
  if (options?.lat != null && options?.lon != null && options?.radius) {
    const bbox = buildBbox(options.lat, options.lon, options.radius / 1000);
    finalQuery = query.replace(/{bbox}/g, bbox);
  }

  if (PROXY_URL) {
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          query: finalQuery,
          ttl: options?.ttl ?? 86400,
          city_name: options?.cityName,
          lat: options?.lat,
          lon: options?.lon,
        }),
      });
      if (res.ok) {
        const proxyText = await res.text();
        try {
          return JSON.parse(proxyText);
        } catch {
          console.warn(
            "Proxy JSON parse error, response starts with:",
            proxyText.slice(0, 100),
          );
        }
      }
    } catch {}
  }

  try {
    const res = await fetch(DIRECT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": `Atlasys/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL || "atlasys@app"})`,
      },
      body: `data=${encodeURIComponent(finalQuery)}`,
    });
    if (!res.ok) return null;
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

function buildBbox(lat: number, lon: number, radiusKm: number): string {
  const latDeg = radiusKm / 111;
  const lonDeg = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  const minLat = lat - latDeg;
  const maxLat = lat + latDeg;
  const minLon = lon - lonDeg;
  const maxLon = lon + lonDeg;
  return `${minLat},${minLon},${maxLat},${maxLon}`;
}

export async function getCityOSMId(
  name: string,
  lat: number,
  lon: number,
): Promise<CityOSMData | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1&lat=${lat}&lon=${lon}&bounded=1&featureType=city`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": HEADERS["User-Agent"],
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.length) return null;

    const result = json[0];
    return {
      osmId: Math.abs(Number(result.osm_id)),
      osmType: result.osm_type,
      name: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      bounds: result.boundingbox
        ? {
            minLat: parseFloat(result.boundingbox[0]),
            maxLat: parseFloat(result.boundingbox[1]),
            minLon: parseFloat(result.boundingbox[2]),
            maxLon: parseFloat(result.boundingbox[3]),
          }
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function fetchCityPOIs(
  lat: number,
  lon: number,
  radiusKm: number = 3,
): Promise<CityPOI[]> {
  const bbox = buildBbox(lat, lon, radiusKm);

  const query = `
  [out:json][timeout:25][maxsize:67108864];
  (
    node["tourism"~"attraction|museum|viewpoint|gallery|monument"]
      (${bbox});
    way["tourism"~"attraction|museum|viewpoint|gallery|monument"]
      (${bbox});
    node["historic"~"monument|castle|ruins"]
      (${bbox});
  );
  out center tags 50;
`;

  const data = await overpassQuery(query);
  if (!data?.elements) {
    throw new Error("No response from Overpass API");
  }

  const pois: CityPOI[] = [];

  for (const el of data.elements) {
    const t = el.tags || {};
    const name = l10n(t, "name") || t.short_name || "";
    if (!name) continue;

    const poiLat = el.lat ?? el.center?.lat ?? lat;
    const poiLon = el.lon ?? el.center?.lon ?? lon;

    const tourism = t.tourism || "";
    const historic = t.historic || "";
    const leisure = t.leisure || "";
    const amenity = t.amenity || "";

    const subtype = tourism || historic || leisure || amenity || "attraction";
    if (subtype === "memorial" || subtype === "artwork") continue;

    const category = tourism || historic || leisure || amenity || "attraction";

    pois.push({
      osmId: Math.abs(el.id),
      osmType: el.type,
      name,
      lat: poiLat,
      lon: poiLon,
      category,
      subtype,
      image: t.image,
      wikidata: t.wikidata,
      wikipedia: t.wikipedia,
      description: l10n(t, "description"),
      website: t.website || t["contact:website"],
      phone: t.phone || t["contact:phone"],
      openingHours: t.opening_hours,
      cuisine: t.cuisine?.replace(/;/g, ", "),
      stars: t.stars ? parseInt(t.stars, 10) : undefined,
    });
  }

  return pois;
}

export async function fetchCityTransit(
  lat: number,
  lon: number,
  radiusKm: number = 2,
): Promise<CityTransitStop[]> {
  const bbox = buildBbox(lat, lon, radiusKm);

  const query = `
    [out:json][timeout:25];
    (
      node
        ["railway"~"station|stop|tram_stop|halt|light_rail|subway_entrance"]
        (${bbox});
      node
        ["amenity"="bus_station"]
        (${bbox});
      node
        ["amenity"="ferry_terminal"]
        (${bbox});
      node
        ["public_transport"="stop_area"]
        (${bbox});
    );
    out center tags;
  `;

  try {
    const data = await overpassQuery(query);
    if (!data?.elements) return [];

    const stops: CityTransitStop[] = [];

    for (const el of data.elements) {
      const t = el.tags || {};
      const name = l10n(t, "name") || "";
      if (!name) continue;

      const stopLat = el.lat ?? el.center?.lat ?? lat;
      const stopLon = el.lon ?? el.center?.lon ?? lon;

      const railway = t.railway || "";
      const amenity = t.amenity || "";
      const transitType = railway || amenity || "stop";

      const linesRaw = t.lines || t.route_ref || "";
      const lines = linesRaw
        ? linesRaw
            .split(";")
            .map((l: string) => l.trim())
            .filter(Boolean)
        : undefined;

      stops.push({
        osmId: Math.abs(el.id),
        osmType: el.type,
        name,
        lat: stopLat,
        lon: stopLon,
        type: transitType,
        lines,
        color: t.colour || t.color,
      });
    }

    return stops;
  } catch {
    return [];
  }
}

export async function fetchTransitRoutes(
  lat: number,
  lon: number,
): Promise<TransitRoute[]> {
  const query = `
    [out:json][timeout:30];
    relation["route"~"train|subway|tram|bus|ferry|light_rail"]({bbox});
    out center tags;
  `;
  const data = await overpassQuery(query, { lat, lon, radius: 3000 });
  if (!data?.elements) {
    throw new Error("No response from Overpass API");
  }
  const rawRoutes: TransitRoute[] = data.elements
    .filter((el: any) => el.tags?.name || el.tags?.ref)
    .map((el: any) => {
      const t = el.tags || {};
      return {
        id: `r-${Math.abs(el.id)}`,
        ref: t.ref || l10n(t, "name") || "",
        name: l10n(t, "name") || t.ref || "",
        routeType: t.route || t.railway || "unknown",
        colour: t.colour || t.color || "#3B82F6",
      };
    });

  const groups = new Map<string, TransitRoute[]>();
  for (const r of rawRoutes) {
    const num = r.ref.match(/^(\d+)/);
    const key = num ? `${r.routeType}-${num[1]}` : `${r.routeType}-${r.ref}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const result: TransitRoute[] = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      group.sort(
        (a, b) =>
          a.ref.length - b.ref.length ||
          (a.ref || a.name).localeCompare(b.ref || b.name),
      );
      result.push(group[0]);
    }
  }
  return result;
}

function orderWaySegments(segments: number[][][]): number[][] {
  if (segments.length === 0) return [];
  if (segments.length === 1) return segments[0];

  const ptsKey = (pt: number[]) => `${pt[0].toFixed(5)},${pt[1].toFixed(5)}`;

  const adj = new Map<string, number[]>();
  for (let i = 0; i < segments.length; i++) {
    const fk = ptsKey(segments[i][0]);
    const lk = ptsKey(segments[i][segments[i].length - 1]);
    if (!adj.has(fk)) adj.set(fk, []);
    if (!adj.has(lk)) adj.set(lk, []);
    if (fk !== lk) {
      adj.get(fk)!.push(i);
      adj.get(lk)!.push(i);
    } else {
      adj.get(fk)!.push(i);
    }
  }

  const leaves: string[] = [];
  for (const [key, conns] of adj) {
    if (conns.length === 1) leaves.push(key);
  }

  if (leaves.length >= 2) {
    const segArray = segments;
    let bestPath: number[][] = [];

    for (const leafKey of leaves) {
      const visited = new Set<number>();
      let currentKey = leafKey;
      let path: number[][] = [];

      while (true) {
        const neighbors = adj.get(currentKey) || [];
        let found = false;
        for (const segIdx of neighbors) {
          if (visited.has(segIdx)) continue;
          visited.add(segIdx);
          const seg = segArray[segIdx];
          const fwd = ptsKey(seg[0]) === currentKey;
          const segCoords = fwd ? seg : [...seg].reverse();
          path =
            path.length === 0
              ? segCoords
              : [...path, ...segCoords.slice(1)];
          currentKey = ptsKey(segCoords[segCoords.length - 1]);
          found = true;
          break;
        }
        if (!found) break;
      }

      if (path.length > bestPath.length) {
        bestPath = path;
      }
    }

    if (bestPath.length > 0) return bestPath;
  }

  const remaining = segments.map((seg) => ({ seg }));
  const ordered: number[][] = [...remaining[0].seg];
  remaining.splice(0, 1);

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    let bestReversed = false;

    for (let i = 0; i < remaining.length; i++) {
      const seg = remaining[i].seg;
      const first = seg[0];
      const lastPt = seg[seg.length - 1];

      const dFirst = Math.hypot(last[0] - first[0], last[1] - first[1]);
      const dLast = Math.hypot(last[0] - lastPt[0], last[1] - lastPt[1]);
      const minDist = dFirst < dLast ? dFirst : dLast;

      if (minDist < bestDist) {
        bestDist = minDist;
        bestIdx = i;
        bestReversed = dLast < dFirst;
      }
    }

    const best = remaining[bestIdx].seg;
    if (bestReversed) {
      ordered.push(...[...best].reverse().slice(1));
    } else {
      ordered.push(...best.slice(1));
    }
    remaining.splice(bestIdx, 1);
  }

  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const endToStart = Math.hypot(
    last[0] - first[0],
    last[1] - first[1],
  );

  if (endToStart < 0.005 && ordered.length > 20) {
    let maxDistSq = 0;
    let maxIdx = 0;
    for (let i = 0; i < ordered.length; i++) {
      const dx = ordered[i][0] - first[0];
      const dy = ordered[i][1] - first[1];
      const d = dx * dx + dy * dy;
      if (d > maxDistSq) {
        maxDistSq = d;
        maxIdx = i;
      }
    }
    return ordered.slice(0, maxIdx + 1);
  }

  return ordered;
}

export async function fetchTransitRouteDetails(osmId: number): Promise<{
  geometry: TransitRoute["geometry"];
  stops: CityTransitStop[];
} | null> {
  const query = `
    [out:json][timeout:30];
    (
      relation(${osmId});
      >>;
    );
      out geom;
  `;
  try {
    const data = await overpassQuery(query);
    if (!data?.elements?.length) {
      Sentry.captureMessage("fetchTransitRouteDetails: empty response", {
        extra: { osmId },
      });
      return null;
    }

    const relation = data.elements.find((el: any) => el.type === "relation");
    if (!relation) {
      Sentry.captureMessage("fetchTransitRouteDetails: no relation found", {
        extra: { osmId, elementCount: data.elements.length },
      });
      return null;
    }

    const elementsIndex = new Map(
      data.elements.map((el: any) => [Math.abs(el.id), el]),
    );

    const trackRoles = new Set(["", "forward", "backward"]);

    const waySegments: number[][][] = [];
    const visited = new Set<number>();

    function traverseMember(member: any): void {
      const el = elementsIndex.get(Math.abs(member.ref)) as any;
      if (!el || visited.has(el.id)) return;
      visited.add(el.id);

      if (el.type === "way" && el.geometry) {
        const role = member.role || "";
        if (!trackRoles.has(role)) return;
        const pts = el.geometry.map((pt: any) => [pt.lon, pt.lat]);
        if (role === "backward") pts.reverse();
        waySegments.push(pts);
      }
    }

    for (const member of relation.members || []) {
      traverseMember(member);
    }

    console.warn(
      `[fetchTransitRouteDetails] osmId=${osmId}, elements=${data.elements.length}, ways=${waySegments.length}`,
    );

    const orderedCoords: number[][] = orderWaySegments(waySegments);

    console.warn(
      `[fetchTransitRouteDetails] orderedCoords=${orderedCoords.length}`,
    );

    let geometry: TransitRoute["geometry"] | undefined;
    if (orderedCoords.length > 0) {
      geometry = { type: "LineString", coordinates: orderedCoords };
    }

    const stops: CityTransitStop[] = [];
    const stopNodes = data.elements.filter(
      (el: any) =>
        el.type === "node" &&
        el.tags?.name &&
        (el.tags?.railway === "station" ||
          el.tags?.railway === "stop" ||
          el.tags?.railway === "tram_stop" ||
          el.tags?.railway === "halt" ||
          el.tags?.railway === "light_rail" ||
          el.tags?.public_transport === "stop_position" ||
          el.tags?.amenity === "bus_station" ||
          el.tags?.amenity === "ferry_terminal"),
    );

    for (const node of stopNodes) {
      stops.push({
        osmId: Math.abs(node.id),
        osmType: node.type,
        name: node.tags.name,
        lat: node.lat,
        lon: node.lon,
        type: node.tags.railway || node.tags.amenity || "stop",
        color: node.tags.colour || node.tags.color,
      });
    }

    if (orderedCoords.length > 0 && stops.length > 1) {
      const mapped = stops.map((s) => {
        let minDist = Infinity;
        let bestIdx = 0;
        for (let i = 0; i < orderedCoords.length; i++) {
          const dx = s.lon - orderedCoords[i][0];
          const dy = s.lat - orderedCoords[i][1];
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            bestIdx = i;
          }
        }
        return { stop: s, idx: bestIdx };
      });
      mapped.sort((a, b) => a.idx - b.idx);
      stops.splice(0, stops.length, ...mapped.map((p) => p.stop));
    }

    return {
      geometry: geometry || { type: "LineString", coordinates: [] },
      stops,
    };
  } catch (e) {
    Sentry.captureException(e);
    return null;
  }
}

export async function fetchPOIWikiImage(
  wikidata?: string,
  wikipedia?: string,
): Promise<string | null> {
  if (!wikidata && !wikipedia) return null;

  try {
    let qid = wikidata;

    if (!qid && wikipedia) {
      const parts = wikipedia.split(":");
      if (parts.length === 2) {
        const lang = parts[0];
        const title = parts[1];
        const res = await fetch(
          `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(title)}&format=json&origin=*`,
          { headers: { "User-Agent": HEADERS["User-Agent"] } },
        );
        const data = await res.json();
        const pages = data.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          qid = pages[pageId]?.pageprops?.wikibase_item;
        }
      }
    }

    if (!qid) return null;

    const wdRes = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
    );
    const wdData = await wdRes.json();
    const entity = wdData.entities?.[qid];
    const imageClaim = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!imageClaim) return null;

    const imageName = imageClaim.replace(/ /g, "_");
    const infoRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(imageName)}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=50&format=json&origin=*`,
      { headers: { "User-Agent": HEADERS["User-Agent"] } },
    );
    const infoData = await infoRes.json();
    const pages = infoData.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const info = pages[pageId]?.imageinfo?.[0];
      return info?.thumburl || info?.url || null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function enrichPOIsWithImages(
  pois: CityPOI[],
): Promise<CityPOI[]> {
  const results: CityPOI[] = [];
  const toEnrich = pois.slice(0, 20);
  const rest = pois.slice(20);

  for (const poi of toEnrich) {
    if (!poi.wikidata && !poi.wikipedia) {
      results.push(poi);
      continue;
    }
    const imageUrl = await fetchPOIWikiImage(poi.wikidata, poi.wikipedia);
    results.push(imageUrl ? { ...poi, image: imageUrl } : poi);
  }

  return [...results, ...rest];
}

export async function fetchLocalizedName(
  wikipedia: string | undefined,
): Promise<string | null> {
  const lang = i18n.language?.split("-")[0] || "en";
  if (!wikipedia) return null;

  const [wikiLang, title] = wikipedia.split(":", 2);
  if (!title || wikiLang === lang) return null;

  try {
    const res = await fetch(
      `https://${wikiLang}.wikipedia.org/w/api.php?action=query&prop=langlinks&titles=${encodeURIComponent(title)}&lllang=${lang}&format=json&origin=*`,
      { headers: HEADERS },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const langlinks = pages[pageId]?.langlinks;
      if (langlinks?.[0]) return langlinks[0]["*"] as string;
    }
  } catch {}

  return null;
}

export async function fetchWikipediaArticle(
  title: string,
  lang: string = "de",
): Promise<{
  title: string;
  extract: string;
  thumbnail: string | null;
  images: { previewUrl: string; fullUrl: string }[];
} | null> {
  const headers = {
    "User-Agent": HEADERS["User-Agent"],
    Accept: "application/json",
  };

  try {
    const searchRes = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(title)}&limit=1&format=json&origin=*`,
      { headers },
    );
    const searchData = await searchRes.json();
    if (!searchData[1]?.length) return null;
    const pageTitle = searchData[1][0];

    const extractRes = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageprops&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`,
      { headers },
    );
    const extractData = await extractRes.json();
    const pages = extractData.query.pages;
    const pageId = Object.keys(pages)[0];
    const extract = pages[pageId].extract || "";

    let imageTitles: string[] = [];
    const qid = pages[pageId]?.pageprops?.wikibase_item;

    if (qid) {
      try {
        const wdRes = await fetch(
          `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
        );
        const wdData = await wdRes.json();
        const cat = wdData.entities?.[qid]?.sitelinks?.commonswiki?.title;
        if (cat) {
          const cmRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(cat)}&cmtype=file&cmlimit=50&format=json&origin=*`,
            { headers },
          );
          const cmData = await cmRes.json();
          imageTitles =
            cmData.query?.categorymembers?.map((cm: any) => cm.title) || [];
        }
      } catch {}
    }

    if (!imageTitles.length) {
      const imagesRes = await fetch(
        `https://${lang}.wikipedia.org/w/api.php?action=query&prop=images&titles=${encodeURIComponent(pageTitle)}&imlimit=50&format=json&origin=*`,
        { headers },
      );
      const imagesData = await imagesRes.json();
      imageTitles =
        imagesData.query?.pages[pageId]?.images?.map((img: any) => img.title) ||
        [];
    }

    const isJunk = (url: string) => {
      const lower = url.toLowerCase();
      return [
        "locator_map",
        "location_map",
        "relief_map",
        "topographic",
        "_map.",
        "karte.",
        "flag_of",
        "flagge_",
        "coat_of_arms",
        "wappen_",
        "klimadiagramm",
        "icon",
        "logo",
        ".svg",
        "blank_",
        "placeholder",
        "no_image",
        "transparent",
      ].some((w) => lower.includes(w));
    };

    const titlesQuery = imageTitles
      .map((t: string) => encodeURIComponent(t))
      .join("|");

    if (!titlesQuery) {
      return { title: pageTitle, extract, thumbnail: null, images: [] };
    }

    const infoRes = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${titlesQuery}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=600&format=json&origin=*`,
      { headers },
    );
    const infoData = await infoRes.json();

    const images: { previewUrl: string; fullUrl: string }[] = [];
    let thumbnail: string | null = null;

    if (infoData.query?.pages) {
      Object.values(infoData.query.pages).forEach((p: any) => {
        const info = p.imageinfo?.[0];
        if (info?.url && !isJunk(info.url)) {
          const entry = {
            previewUrl: info.thumburl || info.url,
            fullUrl: info.url,
          };
          images.push(entry);
          if (!thumbnail) thumbnail = entry.previewUrl;
        }
      });
    }

    return { title: pageTitle, extract, thumbnail, images };
  } catch {
    return null;
  }
}

export async function fetchRouteGeometry(
  lat: number,
  lon: number,
): Promise<TransitRouteGeometry | null> {
  const query = `
    [out:json][timeout:15];
    (
      relation(around:15, ${lat}, ${lon})[route~"train|subway|tram|bus|ferry|light_rail"];
    );
    out geom;
  `;

  try {
    const data = await overpassQuery(query);
    if (!data?.elements?.length) return null;

    const route = data.elements[0];
    const coords: [number, number][] = [];

    if (route.geometry) {
      for (const pt of route.geometry) {
        coords.push([pt.lon, pt.lat]);
      }
    }

    if (!coords.length) return null;

    return {
      coordinates: coords,
      colour: route.tags?.colour || route.tags?.color,
      name: route.tags?.name || route.tags?.ref,
    };
  } catch {
    return null;
  }
}
