import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  StorageAccessFramework,
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
  readAsStringAsync,
} from "expo-file-system/legacy";
import { Platform } from "react-native";
import * as Sentry from "@sentry/react-native";
import {
  serializeMarkers,
  parseMarkers,
  MARKER_BACKUP_EXT,
  MARKER_BACKUP_HEADER,
} from "@/lib/storage/markerBackup";
import type { CustomPlace } from "@/lib/storage/zustand";

const MAX_BACKUP_SIZE = 25 * 1024 * 1024;

export class BackupTooLargeError extends Error {
  constructor() {
    super("backup-too-large");
    this.name = "BackupTooLargeError";
  }
}

export async function exportMarkersToFile(
  places: CustomPlace[],
): Promise<{ uri: string; fileName: string }> {
  const content = serializeMarkers(places);
  const fileName = `atlys-markers-${new Date().toISOString().replace(/[:.]/g, "-")}.${MARKER_BACKUP_EXT}`;

  if (Platform.OS === "android") {
    const perms =
      await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (perms.granted && perms.directoryUri) {
      const fileUri = await StorageAccessFramework.createFileAsync(
        perms.directoryUri,
        fileName,
        "application/octet-stream",
      );
      await StorageAccessFramework.writeAsStringAsync(fileUri, content, {
        encoding: "utf8",
      });
      return { uri: fileUri, fileName };
    }
  }

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
  const asset = result.assets[0];
  const isAtlys =
    asset.name != null && asset.name.toLowerCase().endsWith(MARKER_BACKUP_EXT);
  if (!isAtlys) {
    return { places: [], errors: 0, canceled: true };
  }
  if (asset.size != null && asset.size > MAX_BACKUP_SIZE) {
    throw new BackupTooLargeError();
  }
  try {
    const text = await readAsStringAsync(asset.uri, {
      encoding: "utf8",
    });
    if (!text.includes(MARKER_BACKUP_HEADER)) {
      return { places: [], errors: 0, canceled: true };
    }
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
