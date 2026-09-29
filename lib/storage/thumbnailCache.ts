import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const CACHE_DIR_NAME = "saved-city-thumbnails";

export const WIKI_IMAGE_HEADERS = { Referer: "https://en.wikipedia.org/" };

let cacheDir: Directory | null = null;

function ensureCacheDir(): Directory | null {
  if (Platform.OS === "web") return null;
  try {
    if (!cacheDir) {
      cacheDir = new Directory(Paths.cache, CACHE_DIR_NAME);
      if (!cacheDir.exists) {
        cacheDir.create({ idempotent: true, intermediates: true });
      }
    }
    return cacheDir;
  } catch {
    return null;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function extForUrl(url: string): string {
  const clean = url.split(/[?#]/)[0];
  const match = clean.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i);
  return match ? `.${match[1].toLowerCase()}` : ".jpg";
}

export function cachedThumbnailFileName(
  name: string,
  thumbnailUri: string,
): string {
  const slug = slugify(name) || "city";
  const hash = hashString(name.toLowerCase());
  return `${slug}-${hash}${extForUrl(thumbnailUri)}`;
}

export function cachedThumbnailFile(
  name: string,
  thumbnailUri: string,
): File | null {
  const dir = ensureCacheDir();
  if (!dir) return null;
  return new File(dir, cachedThumbnailFileName(name, thumbnailUri));
}

export function getCachedThumbnailUri(
  name: string,
  thumbnailUri: string,
): string | null {
  const file = cachedThumbnailFile(name, thumbnailUri);
  if (!file) return null;
  return file.exists ? file.uri : null;
}

export async function cacheThumbnail(
  name: string,
  thumbnailUri: string,
): Promise<string | null> {
  if (!thumbnailUri) return null;
  const existing = getCachedThumbnailUri(name, thumbnailUri);
  if (existing) return existing;
  const file = cachedThumbnailFile(name, thumbnailUri);
  if (!file) return null;
  try {
    await File.downloadFileAsync(thumbnailUri, file, {
      headers: WIKI_IMAGE_HEADERS,
      idempotent: true,
    });
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

export function deleteCachedThumbnail(
  name: string,
  thumbnailUri?: string,
): void {
  if (!thumbnailUri) return;
  const file = cachedThumbnailFile(name, thumbnailUri);
  if (!file) return;
  try {
    if (file.exists) file.delete();
  } catch {}
}

export function sweepThumbnailCache(
  keep: { name: string; thumbnail?: string | null }[],
): void {
  const dir = ensureCacheDir();
  if (!dir) return;
  const keepNames = new Set<string>();
  for (const place of keep) {
    if (!place.thumbnail) continue;
    keepNames.add(cachedThumbnailFileName(place.name, place.thumbnail));
  }
  try {
    for (const entry of dir.list()) {
      if (entry instanceof File && !keepNames.has(entry.name)) {
        try {
          if (entry.exists) entry.delete();
        } catch {}
      }
    }
  } catch {}
}
