/**
 * Sicheres JSON-Einlesen einer Fetch-Response.
 *
 * Gründe: Einige APIs (Wikipedia/Wikidata/Commons, Nominatim) liefern bei
 * Rate-Limits oder Fehlern kein JSON, sondern HTML oder Klartext. Ein direkter
 * `.json()`-Aufruf würde dort eine `SyntaxError: JSON Parse error` werfen und
 * den ganzen Ladevorgang abbrechen. Dieser Helper degradiert stattdessen auf
 * `null`, sodass ein fehlgeschlagener Call den Rest nicht blockiert.
 */
export async function safeFetchJson<T = any>(
  response: Response,
): Promise<T | null> {
  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") || "";
  if (
    contentType &&
    !contentType.includes("application/json") &&
    !contentType.includes("application/javascript") &&
    !contentType.includes("text/json")
  ) {
    return null;
  }

  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
