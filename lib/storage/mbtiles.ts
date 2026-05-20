import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
  readAsStringAsync,
  deleteAsync,
} from "expo-file-system/legacy";
import * as Sentry from "@sentry/react-native";

export const MBTILES_DIR = documentDirectory + "mbtiles/";

export type MBTilesInfo = {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: number;
  minZoom: number;
  maxZoom: number;
  bounds: [number, number, number, number]; // west, south, east, north
  tileCount: number;
};

// Ensure the MBTiles directory exists
export async function ensureDir() {
  const info = await getInfoAsync(MBTILES_DIR);
  if (!info.exists)
    await makeDirectoryAsync(MBTILES_DIR, { intermediates: true });
}

// Load all stored MBTiles metadata from disk
export async function listMBTiles(): Promise<MBTilesInfo[]> {
  await ensureDir();

  try {
    const files = await readDirectoryAsync(MBTILES_DIR);
    const results: MBTilesInfo[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await readAsStringAsync(MBTILES_DIR + file);
        results.push(JSON.parse(raw));
      } catch {}
    }
    return results.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error: any) {
    if (error?.message?.includes("doesn't exist")) return [];
    Sentry.captureException(error);
    return [];
  }
}

// Delete MBTiles files for an offline region id
export async function deleteMBTiles(id: string) {
  await deleteAsync(MBTILES_DIR + id + ".mbtiles", { idempotent: true });
  await deleteAsync(MBTILES_DIR + id + ".json", { idempotent: true });
}

// Compute tile x/y indices covering a geographic bounding box
export function tilesForBounds(
  west: number,
  south: number,
  east: number,
  north: number,
  minZoom: number,
  maxZoom: number,
): { z: number; x: number; y: number }[] {
  const tiles: { z: number; x: number; y: number }[] = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lon2tile(west, z);
    const xMax = lon2tile(east, z);
    const yMin = lat2tile(north, z);
    const yMax = lat2tile(south, z);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        tiles.push({ z, x, y });
      }
    }
  }

  return tiles;
}

function lon2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom),
  );
}

// Rough size estimate in MB (~15 KB per vector tile on average)
export function estimateSizeMB(tileCount: number): number {
  // Average ~15 KB per PBF tile
  return Math.round((tileCount * 15) / 1024);
}
