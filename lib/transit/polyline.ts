/**
 * Decodes a Google encoded polyline into `[longitude, latitude]` pairs.
 * MOTIS uses precision 6 for its `legGeometry`.
 */
export function decodePolyline(
  encoded: string,
  precision = 6,
): [number, number][] {
  const coordinates: [number, number][] = [];
  const factor = 10 ** precision;
  let index = 0;
  let lat = 0;
  let lon = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lon += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lon / factor, lat / factor]);
  }

  return coordinates;
}

export function decodeMotisPolyline(
  polyline: { points?: string; precision?: number } | undefined,
): [number, number][] {
  if (!polyline?.points) return [];
  return decodePolyline(polyline.points, polyline.precision ?? 6);
}
