import type { CityPOI } from "./cityoverpass";

export function rankCityPOIs(pois: CityPOI[]): CityPOI[] {
  return pois
    .map((poi) => {
      let score = 0;
      if (poi.image) score += 100000;
      if (poi.stars === 5) score += 80000;
      if (poi.stars && poi.stars >= 4) score += 70000;
      const cat = (poi.category || "").toLowerCase();
      const sub = (poi.subtype || "").toLowerCase();
      if (cat === "museum" || sub === "museum") score += 60000;
      if (poi.cuisine || cat === "food" || sub === "restaurant") score += 60000;
      if (cat === "attraction" || sub === "attraction") score += 30000;
      if (cat === "monument" || sub === "monument") score += 20000;
      if (cat === "artwork" || sub === "artwork") score += 10000;
      if (poi.description) score += 2000;
      if (poi.website) score += 1500;
      if (poi.wikidata || poi.wikipedia) score += 1500;
      if (poi.phone) score += 1000;
      if (poi.openingHours) score += 1000;
      return { poi, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ poi }) => poi);
}
