import * as Sentry from "@sentry/react-native";
import { safeFetchJson } from "@/lib/fetchJson";
import { TRANSIT_API_BASE, TRANSIT_USER_AGENT } from "./config";
import { decodeMotisPolyline } from "./polyline";
import {
  getContrastTextColor,
  getTransitModeMeta,
  normalizeTransitColor,
} from "./modeMeta";
import type {
  MotisItinerary,
  MotisLeg,
  MotisPlace,
  MotisPlanResponse,
  TransitItinerary,
  TransitLeg,
  TransitStop,
} from "./types";

const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 60_000;
const VIA_LAYOVER_MS = 60_000;

type CacheEntry = { at: number; value: TransitItinerary[] };

const segmentCache = new Map<string, CacheEntry>();

function placeToStop(place: MotisPlace | undefined): TransitStop {
  return {
    name: place?.name || "",
    coordinate: [place?.lon ?? 0, place?.lat ?? 0],
    arrival: place?.arrival,
    departure: place?.departure,
    scheduledArrival: place?.scheduledArrival,
    scheduledDeparture: place?.scheduledDeparture,
    track: place?.track,
    platform: place?.platform,
  };
}

function normalizeLeg(
  leg: MotisLeg,
  index: number,
  fallbackTime: string,
): TransitLeg | null {
  if (!leg?.from || !leg?.to) return null;

  const mode = String(leg.mode || "").toUpperCase();
  const meta = getTransitModeMeta(mode);
  const from = placeToStop(leg.from);
  const to = placeToStop(leg.to);
  const startTime = leg.startTime || fallbackTime;
  const endTime = leg.endTime || startTime;
  const geometry = decodeMotisPolyline(leg.legGeometry);
  const color = normalizeTransitColor(leg.routeColor, meta.color);
  const textColor = leg.routeTextColor
    ? normalizeTransitColor(leg.routeTextColor, getContrastTextColor(color))
    : getContrastTextColor(color);

  if (geometry.length < 2) {
    geometry.push(from.coordinate, to.coordinate);
  }

  const duration =
    leg.duration ??
    Math.max(0, (Date.parse(endTime) - Date.parse(startTime)) / 1000);

  return {
    id: `${leg.tripId || mode || "leg"}-${index}-${startTime}`,
    mode,
    isWalking: mode === "WALK",
    from,
    to,
    startTime,
    endTime,
    scheduledStartTime: leg.scheduledStartTime,
    scheduledEndTime: leg.scheduledEndTime,
    duration,
    distance: leg.distance ?? 0,
    line: leg.routeShortName || leg.routeDisplayName || undefined,
    headsign: leg.headsign || undefined,
    agency: leg.agencyName || undefined,
    color,
    textColor,
    geometry,
    intermediateStops: (leg.intermediateStops || []).map(placeToStop),
    realTime: Boolean(leg.realTime),
  };
}

function normalizeItinerary(
  itinerary: MotisItinerary,
  index: number,
): TransitItinerary | null {
  if (!itinerary?.legs?.length) return null;

  const legs = itinerary.legs
    .map((leg, legIndex) =>
      normalizeLeg(leg, legIndex, itinerary.startTime || ""),
    )
    .filter((leg): leg is TransitLeg => Boolean(leg));

  if (!legs.length) return null;

  const startTime = itinerary.startTime || legs[0].startTime;
  const endTime = itinerary.endTime || legs[legs.length - 1].endTime;
  const duration =
    itinerary.duration ??
    Math.max(0, (Date.parse(endTime) - Date.parse(startTime)) / 1000);
  const transitLegs = legs.filter((leg) => !leg.isWalking).length;

  return {
    id: `transit-${startTime}-${index}-${legs.length}`,
    startTime,
    endTime,
    duration,
    transfers:
      typeof itinerary.transfers === "number"
        ? itinerary.transfers
        : Math.max(0, transitLegs - 1),
    distance: legs.reduce((sum, leg) => sum + leg.distance, 0),
    legs,
    timeZone: itinerary.legs.find((leg) => leg.from?.tz)?.from.tz,
  };
}

function normalizeItineraries(
  itineraries: MotisItinerary[] | undefined,
): TransitItinerary[] {
  return (itineraries || [])
    .map(normalizeItinerary)
    .filter((itinerary): itinerary is TransitItinerary => Boolean(itinerary));
}

function formatPlace(coordinate: [number, number]): string {
  return `${coordinate[1]},${coordinate[0]}`;
}

async function fetchSegment(
  from: [number, number],
  to: [number, number],
  departure: Date,
  numItineraries: number,
): Promise<TransitItinerary[] | null> {
  const rounded = new Date(Math.floor(departure.getTime() / 60_000) * 60_000);
  const time = rounded.toISOString();
  const key = `${formatPlace(from)}|${formatPlace(to)}|${time}|${numItineraries}`;
  const cached = segmentCache.get(key);

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  const params = [
    `fromPlace=${encodeURIComponent(formatPlace(from))}`,
    `toPlace=${encodeURIComponent(formatPlace(to))}`,
    `time=${encodeURIComponent(time)}`,
    `numItineraries=${numItineraries}`,
    "transitModes=TRANSIT",
    "directModes=WALK",
  ];
  const url = `${TRANSIT_API_BASE}/v6/plan?${params.join("&")}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": TRANSIT_USER_AGENT,
      },
      signal: controller.signal,
    });
    const json = await safeFetchJson<MotisPlanResponse>(response);
    if (!json) return null;

    const result = normalizeItineraries(json.itineraries);
    segmentCache.set(key, { at: Date.now(), value: result });
    return result;
  } catch (error) {
    Sentry.captureException(error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function mergeViaItineraries(segments: TransitItinerary[]): TransitItinerary {
  const legs = segments.flatMap((segment) => segment.legs);
  const startTime = segments[0].startTime;
  const endTime = segments[segments.length - 1].endTime;

  return {
    id: `transit-via-${startTime}-${endTime}`,
    startTime,
    endTime,
    duration: Math.max(0, (Date.parse(endTime) - Date.parse(startTime)) / 1000),
    transfers: Math.max(
      0,
      segments.reduce((sum, segment) => sum + segment.transfers, 0) +
        segments.length -
        1,
    ),
    distance: legs.reduce((sum, leg) => sum + leg.distance, 0),
    legs,
    timeZone: segments[0].timeZone,
    combinedFromVia: true,
  };
}

export async function fetchTransitItineraries(
  from: [number, number],
  to: [number, number],
  waypoints: [number, number][] = [],
  departure: Date = new Date(),
): Promise<TransitItinerary[] | null> {
  if (!waypoints.length) {
    return fetchSegment(from, to, departure, 3);
  }

  const points = [from, ...waypoints, to];
  const segments: TransitItinerary[] = [];
  let requestTime = departure;

  for (let index = 0; index < points.length - 1; index++) {
    const result = await fetchSegment(
      points[index],
      points[index + 1],
      requestTime,
      1,
    );
    if (result === null) return null;
    if (!result.length) return [];

    const segment = result[0];
    segments.push(segment);
    requestTime = new Date(
      new Date(segment.endTime).getTime() +
        (index < points.length - 2 ? VIA_LAYOVER_MS : 0),
    );
  }

  return [mergeViaItineraries(segments)];
}
