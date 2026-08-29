import type { CustomPlace } from "@/lib/storage/zustand";

/**
 * Backup-/Import-Format für Marker (Custom Places) im Atlasys-eigenen
 * CSV-Textformat mit der Dateiendung `.atlys`.
 *
 * Aufbau (RFC-4180-konformes CSV, Trennzeichen `,`, gequotete Felder):
 *   # atlys v1
 *   name,latitude,longitude,category,customCategory,categoryIcon
 *   ...
 *
 * Spalten:
 *   - name           : Name des Markers (gequotet)
 *   - latitude       : Breitengrad (Zahl)
 *   - longitude      : Längengrad (Zahl)
 *   - category       : Standard-Key (z.B. "home") ODER "custom"
 *   - customCategory : eigener Kategoriename (nur bei category=custom)
 *   - categoryIcon   : Key des gewählten Icons (nur bei category=custom)
 */

export const MARKER_BACKUP_HEADER = "# atlys v1";
export const MARKER_BACKUP_EXT = "atlys";

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

/** Serialisiert Marker in den .atlys-Text. */
export function serializeMarkers(places: CustomPlace[]): string {
  const lines = [MARKER_BACKUP_HEADER, "name,latitude,longitude,category,customCategory,categoryIcon"];
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

/**
 * Parst .atlys-Text zurück in Marker. Fehlerhafte/ungültige Zeilen werden
 * übersprungen. Gibt die gültigen Marker und die Anzahl übersprungener Fehler zurück.
 */
export function parseMarkers(text: string): {
  items: MarkerBackupItem[];
  errors: number;
} {
  const items: MarkerBackupItem[] = [];
  let errors = 0;

  const rows = parseCsv(text);
  if (rows.length < 2) return { items, errors };

  const header = rows[0];
  const idxName = header.indexOf("name");
  const idxLat = header.indexOf("latitude");
  const idxLon = header.indexOf("longitude");
  const idxCat = header.indexOf("category");
  const idxCustomCat = header.indexOf("customCategory");
  const idxIcon = header.indexOf("categoryIcon");
  if (idxLat < 0 || idxLon < 0 || idxName < 0 || idxCat < 0) {
    return { items, errors };
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0) continue;
    const lat = Number((row[idxLat] ?? "").trim());
    const lon = Number((row[idxLon] ?? "").trim());
    if (!isFinite(lat) || !isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      errors++;
      continue;
    }
    const category = (row[idxCat] ?? "").trim();
    const customCategory = idxCustomCat >= 0 ? (row[idxCustomCat] ?? "").trim() : "";
    const categoryIcon = idxIcon >= 0 ? (row[idxIcon] ?? "").trim() : "";
    items.push({
      name: (row[idxName] ?? "").trim(),
      latitude: lat,
      longitude: lon,
      category,
      customCategory: category === "custom" ? customCategory : undefined,
      categoryIcon: category === "custom" && categoryIcon ? categoryIcon : undefined,
    });
  }

  return { items, errors };
}

/** Minimaler RFC-4180-CSV-Parser (unterstützt gequotete Felder und Escaping). */
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

  // Kommentar-/Header-Zeilen, die mit "#" beginnen, herausfiltern.
  return rows.filter((r) => !(r.length === 1 && r[0].startsWith("#")));
}
