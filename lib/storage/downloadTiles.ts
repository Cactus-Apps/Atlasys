import * as SQLite from "expo-sqlite";
import {
  cacheDirectory,
  downloadAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  getInfoAsync,
  EncodingType,
} from "expo-file-system/legacy";
import { tilesForBounds, ensureDir, MBTILES_DIR, MBTilesInfo } from "./mbtiles";

const TILE_URL = "https://tiles.openfreemap.org/planet/v3";
const CONCURRENT_DOWNLOADS = 3;

export type DownloadProgress = {
  total: number;
  downloaded: number;
  failed: number;
  percent: number;
  status: "idle" | "downloading" | "done" | "cancelled" | "error";
};

async function downloadSingleTile(
  z: number, x: number, y: number
): Promise<string | null> {
  const url = `${TILE_URL}/${z}/${x}/${y}.pbf`;
  const localUri = `${cacheDirectory}tile_${z}_${x}_${y}_${Date.now()}.pbf`;

  try {
    const result = await downloadAsync(url, localUri, {
      headers: { "Accept-Encoding": "gzip" },
    });

    if (result.status !== 200) {
      await deleteAsync(localUri, { idempotent: true });
      return null;
    }

    const base64 = await readAsStringAsync(result.uri, {
      encoding: EncodingType.Base64,
    });

    await deleteAsync(result.uri, { idempotent: true });
    return base64;
  } catch {
    await deleteAsync(localUri, { idempotent: true });
    return null;
  }
}

export async function downloadRegion(
  id: string,
  name: string,
  bounds: [number, number, number, number],
  minZoom: number,
  maxZoom: number,
  onProgress: (p: DownloadProgress) => void,
  cancelRef: { cancelled: boolean }
): Promise<MBTilesInfo | null> {
  await ensureDir();

  const [west, south, east, north] = bounds;
  const tiles = tilesForBounds(west, south, east, north, minZoom, maxZoom);
  const total = tiles.length;

  if (total === 0) {
    onProgress({ total: 0, downloaded: 0, failed: 0, percent: 0, status: "error" });
    return null;
  }

  // Progress sofort melden damit UI reagiert
  onProgress({ total, downloaded: 0, failed: 0, percent: 0, status: "downloading" });

  const dbPath = `${MBTILES_DIR}${id}.mbtiles`;

  // Alte DB löschen falls vorhanden
  await deleteAsync(dbPath, { idempotent: true });

  const db = await SQLite.openDatabaseAsync(`${MBTILES_DIR}${id}.mbtiles`);

  try {
    // Schema erstellen
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS metadata (
        name TEXT NOT NULL,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS tiles (
        zoom_level INTEGER NOT NULL,
        tile_column INTEGER NOT NULL,
        tile_row INTEGER NOT NULL,
        tile_data BLOB NOT NULL,
        PRIMARY KEY (zoom_level, tile_column, tile_row)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS tiles_idx
        ON tiles (zoom_level, tile_column, tile_row);
    `);

    // Metadata
    await db.runAsync("INSERT INTO metadata VALUES (?, ?)", ["name", name]);
    await db.runAsync("INSERT INTO metadata VALUES (?, ?)", ["format", "pbf"]);
    await db.runAsync("INSERT INTO metadata VALUES (?, ?)", ["minzoom", String(minZoom)]);
    await db.runAsync("INSERT INTO metadata VALUES (?, ?)", ["maxzoom", String(maxZoom)]);
    await db.runAsync("INSERT INTO metadata VALUES (?, ?)", ["bounds", `${west},${south},${east},${north}`]);
    await db.runAsync("INSERT INTO metadata VALUES (?, ?)", ["type", "overlay"]);
    await db.runAsync("INSERT INTO metadata VALUES (?, ?)", ["version", "1"]);

    let downloaded = 0;
    let failed = 0;
    let processed = 0;

    // Tiles in Batches verarbeiten
    for (let i = 0; i < tiles.length; i += CONCURRENT_DOWNLOADS) {
      if (cancelRef.cancelled) {
        await db.closeAsync();
        await deleteAsync(dbPath, { idempotent: true });
        onProgress({ total, downloaded, failed, percent: 0, status: "cancelled" });
        return null;
      }

      const batch = tiles.slice(i, i + CONCURRENT_DOWNLOADS);

      // Parallel downloaden
      const results = await Promise.all(
        batch.map(async ({ z, x, y }) => {
          const base64 = await downloadSingleTile(z, x, y);
          return { z, x, y, base64 };
        })
      );

      // Sequenziell in DB schreiben (verhindert DB-Lock)
      for (const { z, x, y, base64 } of results) {
        if (cancelRef.cancelled) break;

        if (base64) {
          try {
            // MBTiles TMS: y-Koordinate invertieren
            const tmsY = Math.pow(2, z) - 1 - y;
            await db.runAsync(
              `INSERT OR REPLACE INTO tiles
               (zoom_level, tile_column, tile_row, tile_data)
               VALUES (?, ?, ?, ?)`,
              [z, x, tmsY, base64]
            );
            downloaded++;
          } catch {
            failed++;
          }
        } else {
          failed++;
        }
        processed++;
      }

      // Progress aktualisieren
      const percent = Math.round((processed / total) * 100);
      onProgress({
        total,
        downloaded,
        failed,
        percent,
        status: "downloading",
      });
    }

    await db.closeAsync();

    // Dateigröße
    const fileInfo = await getInfoAsync(dbPath);
    const size = fileInfo.exists ? (fileInfo as any).size ?? 0 : 0;

    const info: MBTilesInfo = {
      id,
      name,
      path: dbPath,
      size,
      createdAt: Date.now(),
      minZoom,
      maxZoom,
      bounds,
      tileCount: downloaded,
    };

    // Metadata JSON speichern
    await writeAsStringAsync(
      `${MBTILES_DIR}${id}.json`,
      JSON.stringify(info)
    );

    onProgress({ total, downloaded, failed, percent: 100, status: "done" });
    return info;

  } catch (err) {
    await db.closeAsync().catch(() => {});
    await deleteAsync(dbPath, { idempotent: true });
    onProgress({ total, downloaded: 0, failed: total, percent: 0, status: "error" });
    return null;
  }
}