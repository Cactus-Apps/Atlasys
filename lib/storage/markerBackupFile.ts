import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
  readAsStringAsync,
} from "expo-file-system/legacy";
import * as Sentry from "@sentry/react-native";
import { serializeMarkers, parseMarkers, MARKER_BACKUP_EXT } from "@/lib/storage/markerBackup";
import type { CustomPlace } from "@/lib/storage/zustand";

/**
 * Exportiert die Marker als .atlys-Datei in den Cache und öffnet den
 * nativen Share-Sheet, damit du die Datei herunterladen/teilen kannst.
 */
export async function exportMarkersToFile(
  places: CustomPlace[],
): Promise<{ uri: string; fileName: string }> {
  const content = serializeMarkers(places);
  const fileName = `atlys-markers-${new Date().toISOString().replace(/[:.]/g, "-")}.${MARKER_BACKUP_EXT}`;
  const uri = (cacheDirectory ?? documentDirectory) + fileName;
  await writeAsStringAsync(uri, content, { encoding: "utf8" });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "text/csv",
      dialogTitle: fileName,
      UTI: "public.comma-separated-values-text",
    });
  }
  return { uri, fileName };
}

/**
 * Öffnet den Dokument-Picker, liest die gewählte .atlys-Datei und parst
 * die Marker daraus. Gibt die geparsten Marker plus die Anzahl fehlerhafter
 * Zeilen zurück.
 */
export async function importMarkersFromFile(): Promise<{
  places: Omit<CustomPlace, "id" | "addedAt">[];
  errors: number;
  canceled: boolean;
}> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]?.uri) {
    return { places: [], errors: 0, canceled: true };
  }
  try {
    const text = await readAsStringAsync(result.assets[0].uri, {
      encoding: "utf8",
    });
    const parsed = parseMarkers(text);
    return {
      places: parsed.items.map((it) => ({
        name: it.name,
        category:
          it.category === "custom"
            ? "custom"
            : PLACE_KEYS.includes(it.category)
              ? it.category
              : "",
        customCategory: it.customCategory,
        categoryIcon: it.categoryIcon,
        latitude: it.latitude,
        longitude: it.longitude,
      })),
      errors: parsed.errors,
      canceled: false,
    };
  } catch (e) {
    Sentry.captureException(e);
    throw e;
  }
}

const PLACE_KEYS = [
  "home",
  "work",
  "school",
  "gym",
  "cafe",
  "restaurant",
  "bar",
  "shop",
  "health",
  "nature",
];
