import {
  deleteAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import * as Sentry from "@sentry/react-native";
import {
  deleteMBTiles,
  listMBTiles,
  MBTILES_DIR,
  MBTilesInfo,
} from "./mbtiles";
import { downloadRegion } from "./downloadTiles";
import {
  enrichPOIsWithImages,
  fetchCityPOIs,
  fetchTransitRoutes,
  type CityPOI,
  type TransitRoute,
} from "@/lib/geocoding/cityoverpass";
import {
  fetchPOIDetails,
  type OverpassPOIDetails,
} from "@/lib/geocoding/overpass";
import { rankCityPOIs } from "@/lib/geocoding/poiRanking";

export const CITY_POI_LIMIT = 6;
export const CITY_DOWNLOAD_RADIUS_KM = 5;
export const CITY_DEFAULT_MIN_ZOOM = 8;
export const CITY_DEFAULT_MAX_ZOOM = 14;

export type CityDownloadPhase =
  | "tiles"
  | "pois"
  | "transit"
  | "finalizing";

export type CityDownloadStatus =
  | "downloading"
  | "done"
  | "cancelled"
  | "error";

export type CityDownloadProgress = {
  status: CityDownloadStatus;
  percent: number;
  phase: CityDownloadPhase;
  downloaded: number;
  total: number;
  failed: number;
};

export type CityOfflinePackage = MBTilesInfo & {
  kind: "city";
  cityId: string;
  cityName: string;
  latitude: number;
  longitude: number;
  pois: CityPOI[];
  poiDetails: Record<string, OverpassPOIDetails | null>;
  transit: TransitRoute[];
  status: "done";
  downloadedAt: number;
};

export type CityDownloadParams = {
  cityId: string;
  cityName: string;
  latitude: number;
  longitude: number;
  minZoom?: number;
  maxZoom?: number;
  onProgress?: (progress: CityDownloadProgress) => void;
  cancelRef?: { cancelled: boolean };
};

export function cityKeyFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return slug || encodeURIComponent(name.toLowerCase());
}

export function cityDownloadId(cityId: string): string {
  const safe = cityId.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `city_${safe}`;
}

export function cityBounds(
  lat: number,
  lon: number,
  radiusKm = CITY_DOWNLOAD_RADIUS_KM,
): [number, number, number, number] {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return [lon - lonDelta, lat - latDelta, lon + lonDelta, lat + latDelta];
}

function report(
  onProgress: CityDownloadParams["onProgress"],
  progress: CityDownloadProgress,
) {
  onProgress?.(progress);
}

export async function downloadCityPackage(
  params: CityDownloadParams,
): Promise<CityOfflinePackage | null> {
  const {
    cityId,
    cityName,
    latitude,
    longitude,
    minZoom = CITY_DEFAULT_MIN_ZOOM,
    maxZoom = CITY_DEFAULT_MAX_ZOOM,
    onProgress,
    cancelRef = { cancelled: false },
  } = params;

  const id = cityDownloadId(cityId);
  const bounds = cityBounds(latitude, longitude);

  await deleteAsync(`${MBTILES_DIR}${id}.json`, { idempotent: true });

  report(onProgress, {
    status: "downloading",
    percent: 0,
    phase: "tiles",
    downloaded: 0,
    total: 0,
    failed: 0,
  });

  let regionInfo: MBTilesInfo | null = null;
  try {
    regionInfo = await downloadRegion(
      id,
      cityName,
      bounds,
      minZoom,
      maxZoom,
      (p) => {
        report(onProgress, {
          status:
            p.status === "done"
              ? "downloading"
              : p.status === "cancelled"
                ? "cancelled"
                : p.status === "error"
                  ? "error"
                  : "downloading",
          percent: Math.round(p.percent * 0.8),
          phase: "tiles",
          downloaded: p.downloaded,
          total: p.total,
          failed: p.failed,
        });
      },
      cancelRef,
    );
  } catch (err) {
    Sentry.captureException(err);
  }

  if (!regionInfo || cancelRef.cancelled) {
    await deleteMBTiles(id);
    report(onProgress, {
      status: cancelRef.cancelled ? "cancelled" : "error",
      percent: 0,
      phase: "tiles",
      downloaded: 0,
      total: 0,
      failed: 0,
    });
    return null;
  }

  let pois: CityPOI[] = [];
  let poiDetails: Record<string, OverpassPOIDetails | null> = {};

  try {
    report(onProgress, {
      status: "downloading",
      percent: 80,
      phase: "pois",
      downloaded: 0,
      total: CITY_POI_LIMIT,
      failed: 0,
    });

    const raw = await fetchCityPOIs(latitude, longitude);
    const enriched = await enrichPOIsWithImages(raw);
    pois = rankCityPOIs(enriched).slice(0, CITY_POI_LIMIT);

    for (let i = 0; i < pois.length; i++) {
      if (cancelRef.cancelled) break;
      const poi = pois[i];
      try {
        poiDetails[String(poi.osmId)] = await fetchPOIDetails(
          poi.osmId,
          poi.osmType,
          2,
          poi.name,
          poi.lat,
          poi.lon,
        );
      } catch (err) {
        Sentry.captureException(err);
        poiDetails[String(poi.osmId)] = null;
      }
      report(onProgress, {
        status: "downloading",
        percent: Math.round(80 + ((i + 1) / Math.max(pois.length, 1)) * 10),
        phase: "pois",
        downloaded: i + 1,
        total: pois.length,
        failed: 0,
      });
    }
  } catch (err) {
    Sentry.captureException(err);
  }

  if (cancelRef.cancelled) {
    await deleteMBTiles(id);
    report(onProgress, {
      status: "cancelled",
      percent: 0,
      phase: "pois",
      downloaded: 0,
      total: 0,
      failed: 0,
    });
    return null;
  }

  let transit: TransitRoute[] = [];
  try {
    report(onProgress, {
      status: "downloading",
      percent: 92,
      phase: "transit",
      downloaded: 0,
      total: 0,
      failed: 0,
    });
    transit = await fetchTransitRoutes(latitude, longitude);
  } catch (err) {
    Sentry.captureException(err);
  }

  if (cancelRef.cancelled) {
    await deleteMBTiles(id);
    report(onProgress, {
      status: "cancelled",
      percent: 0,
      phase: "transit",
      downloaded: 0,
      total: 0,
      failed: 0,
    });
    return null;
  }

  report(onProgress, {
    status: "downloading",
    percent: 98,
    phase: "finalizing",
    downloaded: 0,
    total: 0,
    failed: 0,
  });

  const pkg: CityOfflinePackage = {
    ...regionInfo,
    kind: "city",
    cityId,
    cityName,
    latitude,
    longitude,
    pois,
    poiDetails,
    transit,
    status: "done",
    downloadedAt: Date.now(),
  };

  try {
    await writeAsStringAsync(
      `${MBTILES_DIR}${id}.json`,
      JSON.stringify(pkg),
    );
  } catch (err) {
    Sentry.captureException(err);
    report(onProgress, {
      status: "error",
      percent: 0,
      phase: "finalizing",
      downloaded: 0,
      total: 0,
      failed: 0,
    });
    return null;
  }

  report(onProgress, {
    status: "done",
    percent: 100,
    phase: "finalizing",
    downloaded: pkg.tileCount,
    total: pkg.tileCount,
    failed: 0,
  });

  return pkg;
}

export async function listCityPackages(): Promise<CityOfflinePackage[]> {
  const all = await listMBTiles();
  return all.filter(
    (item) => (item as Partial<CityOfflinePackage>).kind === "city",
  ) as CityOfflinePackage[];
}

export async function deleteCityPackage(cityId: string): Promise<void> {
  await deleteMBTiles(cityDownloadId(cityId));
}

export async function readCityPackage(
  cityId: string,
): Promise<CityOfflinePackage | null> {
  try {
    const raw = await readAsStringAsync(
      `${MBTILES_DIR}${cityDownloadId(cityId)}.json`,
    );
    const parsed = JSON.parse(raw) as Partial<CityOfflinePackage>;
    return parsed.kind === "city"
      ? (parsed as CityOfflinePackage)
      : null;
  } catch {
    return null;
  }
}
