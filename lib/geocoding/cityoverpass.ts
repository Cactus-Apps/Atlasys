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
};

export type CityTransitStop = {
  osmId: number;
  osmType: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  lines?: string[];
  colour?: string;
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

const OVERPASS_URL = "https://overpass.private.coffee/api/interpreter";

const HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": `Atlasys/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL || "atlasys@app"})`,
};

async function overpassQuery(query: string): Promise<any> {
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: HEADERS,
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) return null;
  return res.json();
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
    [out:json][timeout:30];
    (
      node
        ["tourism"~"attraction|museum|viewpoint|gallery|monument|artwork"]
        (${bbox});
      node
        ["historic"~"memorial|monument|castle|ruins|church|building|tower|fort"]
        (${bbox});
      node
        ["leisure"~"park|garden|playground"]
        (${bbox});
      node
        ["amenity"~"theatre|cinema|library|townhall"]
        (${bbox});
      way
        ["tourism"~"attraction|museum|viewpoint|gallery|monument|artwork"]
        (${bbox});
      way
        ["historic"~"memorial|monument|castle|ruins|church|building|tower|fort"]
        (${bbox});
      way
        ["leisure"~"park|garden"]
        (${bbox});
      way
        ["amenity"~"theatre|cinema|library|townhall"]
        (${bbox});
    );
    out center tags;
  `;

  try {
    const data = await overpassQuery(query);
    if (!data?.elements) return [];

    const pois: CityPOI[] = [];

    for (const el of data.elements) {
      const t = el.tags || {};
      const name = t.name || t.name_en || t["name:en"] || t.short_name || "";
      if (!name) continue;

      const poiLat = el.lat ?? el.center?.lat ?? lat;
      const poiLon = el.lon ?? el.center?.lon ?? lon;

      const tourism = t.tourism || "";
      const historic = t.historic || "";
      const leisure = t.leisure || "";
      const amenity = t.amenity || "";

      const category =
        tourism ||
        historic ||
        leisure ||
        amenity ||
        "attraction";
      const subtype = tourism || historic || leisure || amenity || "attraction";

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
        description: t.description || t["description:en"],
        website: t.website || t["contact:website"],
        phone: t.phone || t["contact:phone"],
        openingHours: t.opening_hours,
        cuisine: t.cuisine?.replace(/;/g, ", "),
      });
    }

    return pois;
  } catch {
    return [];
  }
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
      const name = t.name || "";
      if (!name) continue;

      const stopLat = el.lat ?? el.center?.lat ?? lat;
      const stopLon = el.lon ?? el.center?.lon ?? lon;

      const railway = t.railway || "";
      const amenity = t.amenity || "";
      const transitType = railway || amenity || "stop";

      const linesRaw = t.lines || t.route_ref || "";
      const lines = linesRaw
        ? linesRaw.split(";").map((l: string) => l.trim()).filter(Boolean)
        : undefined;

      stops.push({
        osmId: Math.abs(el.id),
        osmType: el.type,
        name,
        lat: stopLat,
        lon: stopLon,
        type: transitType,
        lines,
        colour: t.colour || t.color,
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
  const bbox = buildBbox(lat, lon, 2);
  const query = `
    [out:json][timeout:25];
    (
      relation["route"~"train|subway|tram|bus|ferry|light_rail"](around:2000, ${lat}, ${lon});
    );
    out center tags;
  `;
  try {
    const data = await overpassQuery(query);
    if (!data?.elements) return [];
    return data.elements
      .filter((el: any) => el.tags?.name || el.tags?.ref)
      .map((el: any) => {
        const t = el.tags || {};
        return {
          id: `r-${Math.abs(el.id)}`,
          ref: t.ref || t.name || "",
          name: t.name || t.ref || "",
          routeType: t.route || t.railway || "unknown",
          colour: t.colour || t.color || "#3B82F6",
        };
      });
  } catch {
    return [];
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
      `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(imageName)}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=400&format=json&origin=*`,
      { headers: { "User-Agent": HEADERS["User-Agent"] } },
    );
    const infoData = await infoRes.json();
    const pages = infoData.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      return pages[pageId]?.imageinfo?.[0]?.thumburl || null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function enrichPOIsWithImages(pois: CityPOI[]): Promise<CityPOI[]> {
  const enriched = await Promise.all(
    pois.map(async (poi) => {
      if (!poi.image && (poi.wikidata || poi.wikipedia)) {
        const imageUrl = await fetchPOIWikiImage(poi.wikidata, poi.wikipedia);
        if (imageUrl) {
          return { ...poi, image: imageUrl };
        }
      }
      return poi;
    }),
  );
  return enriched.filter((p) => p.image);
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
        "locator_map", "location_map", "relief_map", "topographic",
        "_map.", "karte.", "flag_of", "flagge_", "coat_of_arms",
        "wappen_", "klimadiagramm", "icon", "logo", ".svg",
        "blank_", "placeholder", "no_image", "transparent",
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
