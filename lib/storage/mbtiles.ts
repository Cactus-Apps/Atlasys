import * as SQLite from "expo-sqlite";
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
} from "expo-file-system/legacy";

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

// Sicherstellen dass Ordner existiert
export async function ensureDir() {
  const info = await getInfoAsync(MBTILES_DIR);
  if (!info.exists)
    await makeDirectoryAsync(MBTILES_DIR, { intermediates: true });
}

// Alle gespeicherten MBTiles laden
export async function listMBTiles(): Promise<MBTilesInfo[]> {
  await ensureDir();
  const files = await readDirectoryAsync(MBTILES_DIR);
  const results: MBTilesInfo[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await readAsStringAsync(MBTILES_DIR + file);
    results.push(JSON.parse(raw));
  }
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

// MBTiles löschen
export async function deleteMBTiles(id: string) {
  await deleteAsync(MBTILES_DIR + id + ".mbtiles", { idempotent: true });
  await deleteAsync(MBTILES_DIR + id + ".json", { idempotent: true });
}

// Tile-Koordinaten für Bounding Box berechnen
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

// Größenschätzung in MB
export function estimateSizeMB(tileCount: number): number {
  // Durchschnittlich ~15KB pro PBF Tile
  return Math.round((tileCount * 15) / 1024);
}
