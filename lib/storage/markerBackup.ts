import type { CustomPlace } from "@/lib/storage/zustand";

/**
 * Backup/import format for markers (Custom Places) in Atlasys's proprietary
 * CSV text format with the file extension `.atlys`.
 *
 * Structure (RFC-4180-compliant CSV, comma-separated `,`, quoted fields):
 *   # atlys v1
 *   name,latitude,longitude,category,customCategory,categoryIcon
 *   ...
 *
 * Columns:
 *   - name           : Name of the marker (quoted)
 *   - latitude       : Latitude (number)
 *   - longitude      : Longitude (number)
 *   - category       : Default key (e.g., “home”) OR “custom”
 *   - customCategory : Custom category name (only if category=custom)
 *   - categoryIcon   : Key of the selected icon (only if category=custom)
 */

export const MARKER_BACKUP_HEADER = "# atlys v1";
export const MARKER_BACKUP_EXT = "atlys";

export const MAX_NAME_LENGTH = 120;
export const MAX_CATEGORY_LENGTH = 60;
export const MAX_ICON_LENGTH = 40;
export const MAX_MARKERS = 5000;

const UNSAFE_CHARS =
  /[\u0000-\u001F\u007F-\u009F\u00AD\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g;

function sanitizeLabel(value: string, max: number): string {
  return value.slice(0, max).replace(UNSAFE_CHARS, "").trim();
}

export type MarkerBackupItem = {
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  customCategory?: string;
  categoryIcon?: string;
};

function csvCell(value: string): string {
  if (
    value.indexOf(",") !== -1 ||
    value.indexOf('"') !== -1 ||
    value.indexOf("\n") !== -1 ||
    value.indexOf("\r") !== -1
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeMarkers(places: CustomPlace[]): string {
  const lines = [
    MARKER_BACKUP_HEADER,
    "name,latitude,longitude,category,customCategory,categoryIcon",
  ];
  for (const p of places) {
    lines.push(
      [
        csvCell(p.name),
        csvCell(String(p.latitude)),
        csvCell(String(p.longitude)),
        csvCell(p.category),
        csvCell(p.customCategory ?? ""),
        csvCell(p.categoryIcon ?? ""),
      ].join(","),
    );
  }
  return lines.join("\n") + "\n";
}

export function parseMarkers(text: string): {
  items: MarkerBackupItem[];
  errors: number;
  truncatedAt: number | null;
} {
  const items: MarkerBackupItem[] = [];
  let errors = 0;
  let truncatedAt: number | null = null;

  const rows = parseCsv(text);
  if (rows.length < 2) return { items, errors, truncatedAt };

  const header = rows[0];
  const idxName = header.indexOf("name");
  const idxLat = header.indexOf("latitude");
  const idxLon = header.indexOf("longitude");
  const idxCat = header.indexOf("category");
  const idxCustomCat = header.indexOf("customCategory");
  const idxIcon = header.indexOf("categoryIcon");
  if (idxLat < 0 || idxLon < 0 || idxName < 0 || idxCat < 0) {
    return { items, errors, truncatedAt };
  }

  for (let i = 1; i < rows.length; i++) {
    if (items.length >= MAX_MARKERS) {
      for (let j = i; j < rows.length; j++) {
        if (rows[j].length > 0) errors++;
      }
      truncatedAt = items.length;
      break;
    }
    const row = rows[i];
    if (row.length === 0) continue;
    const lat = Number((row[idxLat] ?? "").trim());
    const lon = Number((row[idxLon] ?? "").trim());
    if (
      !isFinite(lat) ||
      !isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      errors++;
      continue;
    }
    const name = sanitizeLabel(row[idxName] ?? "", MAX_NAME_LENGTH);
    if (!name) {
      errors++;
      continue;
    }
    const category = (row[idxCat] ?? "").trim();
    const customCategory =
      idxCustomCat >= 0
        ? sanitizeLabel(row[idxCustomCat] ?? "", MAX_CATEGORY_LENGTH)
        : "";
    const categoryIcon =
      idxIcon >= 0 ? sanitizeLabel(row[idxIcon] ?? "", MAX_ICON_LENGTH) : "";
    items.push({
      name,
      latitude: lat,
      longitude: lon,
      category,
      customCategory: category === "custom" ? customCategory : undefined,
      categoryIcon:
        category === "custom" && categoryIcon ? categoryIcon : undefined,
    });
  }

  return { items, errors, truncatedAt };
}

/** Minimal RFC-4180-CSV-Parser  */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      pushField();
      i++;
      continue;
    }
    if (ch === "\n") {
      if (field.length > 0 || row.length > 0) pushRow();
      i++;
      continue;
    }
    if (ch === "\r") {
      if (text[i + 1] === "\n") {
        if (field.length > 0 || row.length > 0) pushRow();
        i += 2;
        continue;
      }
      if (field.length > 0 || row.length > 0) pushRow();
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (inQuotes || field.length > 0 || row.length > 0) {
    pushRow();
  }

  // Filter out comment and header lines that begin with “#”.
  return rows.filter((r) => !(r.length === 1 && r[0].startsWith("#")));
}
