import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import type { StyleSpecification } from "maplibre-gl";

export type PoiCategory = {
  key: string;
  label: string;
  color: string;
  icon: number;
  classes: string[];
};

export const POI_CATEGORIES: PoiCategory[] = [
  {
    key: "restaurant",
    label: "Restaurant",
    color: "#E4572E",
    icon: require("@/assets/map/icons/poi-restaurant.png"),
    classes: ["restaurant", "fast_food", "food_court", "food"],
  },
  {
    key: "sushi",
    label: "Sushi",
    color: "#E4572E",
    icon: require("@/assets/map/icons/poi-sushi.png"),
    classes: ["sushi"],
  },
  {
    key: "bakery",
    label: "Bakery",
    color: "#E4572E",
    icon: require("@/assets/map/icons/poi-bakery.png"),
    classes: ["bakery"],
  },
  {
    key: "cafe",
    label: "Cafe",
    color: "#8E5A3B",
    icon: require("@/assets/map/icons/poi-cafe.png"),
    classes: ["cafe", "ice_cream"],
  },
  {
    key: "bar",
    label: "Bar",
    color: "#7B2CBF",
    icon: require("@/assets/map/icons/poi-bar.png"),
    classes: ["bar", "nightclub"],
  },
  {
    key: "beer",
    label: "Pub",
    color: "#B5651D",
    icon: require("@/assets/map/icons/poi-bar.png"),
    classes: ["beer", "biergarten", "pub"],
  },
  {
    key: "alcohol_shop",
    label: "Alcohol",
    color: "#9C6644",
    icon: require("@/assets/map/icons/poi-shop.png"),
    classes: ["alcohol_shop", "alcohol", "beverages", "wine"],
  },
  {
    key: "shop",
    label: "Shop",
    color: "#028090",
    icon: require("@/assets/map/icons/poi-shop.png"),
    classes: [
      "accessories",
      "antiques",
      "beauty",
      "bed",
      "boutique",
      "camera",
      "carpet",
      "charity",
      "chemist",
      "chocolate",
      "coffee",
      "computer",
      "convenience",
      "confectionery",
      "copyshop",
      "cosmetics",
      "garden_centre",
      "doityourself",
      "erotic",
      "electronics",
      "fabric",
      "farm",
      "florist",
      "frozen_food",
      "furniture",
      "video_games",
      "video",
      "general",
      "gift",
      "hardware",
      "hearing_aids",
      "hifi",
      "interior_decoration",
      "jewelry",
      "kiosk",
      "locksmith",
      "lamps",
      "mall",
      "massage",
      "motorcycle",
      "mobile_phone",
      "newsagent",
      "optician",
      "outdoor",
      "paint",
      "perfumery",
      "perfume",
      "pet",
      "photo",
      "second_hand",
      "shoes",
      "sports",
      "stationery",
      "tailor",
      "tattoo",
      "ticket",
      "tobacco",
      "toys",
      "travel_agency",
      "watches",
      "weapons",
      "wholesale",
    ],
  },
  {
    key: "clothing_store",
    label: "Clothing",
    color: "#0F766E",
    icon: require("@/assets/map/icons/poi-shop.png"),
    classes: ["clothing_store", "bag", "clothes"],
  },
  {
    key: "grocery",
    label: "Grocery",
    color: "#15803D",
    icon: require("@/assets/map/icons/poi-shop.png"),
    classes: [
      "grocery",
      "supermarket",
      "deli",
      "delicatessen",
      "department_store",
      "greengrocer",
      "marketplace",
    ],
  },
  {
    key: "laundry",
    label: "Laundry",
    color: "#0891B2",
    icon: require("@/assets/map/icons/poi-shop.png"),
    classes: ["laundry", "dry_cleaning"],
  },
  {
    key: "office",
    label: "Office",
    color: "#64748B",
    icon: require("@/assets/map/icons/poi-generic.png"),
    classes: [
      "accountant",
      "advertising_agency",
      "architect",
      "association",
      "bail_bond_agent",
      "company",
      "construction_company",
      "consulting",
      "cooperative",
      "courier",
      "coworking",
      "diplomatic",
      "educational_institution",
      "employment_agency",
      "energy_supplier",
      "engineer",
      "estate_agent",
      "financial",
      "financial_advisor",
      "forestry",
      "foundation",
      "geodesist",
      "government",
      "graphic_design",
      "guide",
      "harbour_master",
      "health_insurance",
      "insurance",
      "interior_design",
      "it",
      "lawyer",
      "logistics",
      "marketing",
      "moving_company",
      "newspaper",
      "ngo",
      "notary",
      "physician",
      "political_party",
      "private_investigator",
      "property_management",
      "publisher",
      "quango",
      "religion",
      "research",
      "security",
      "surveyor",
      "tax_advisor",
      "telecommunication",
      "therapist",
      "translator",
      "travel_agent",
      "tutoring",
      "union",
      "water_utility",
      "web_design",
      "wedding_planner",
    ],
  },
  {
    key: "town_hall",
    label: "Town hall",
    color: "#475569",
    icon: require("@/assets/map/icons/poi-generic.png"),
    classes: [
      "town_hall",
      "townhall",
      "public_building",
      "courthouse",
      "community_centre",
    ],
  },
  {
    key: "school",
    label: "School",
    color: "#2A6F97",
    icon: require("@/assets/map/icons/poi-school.png"),
    classes: ["school", "kindergarten"],
  },
  {
    key: "college",
    label: "College",
    color: "#1D4ED8",
    icon: require("@/assets/map/icons/poi-school.png"),
    classes: ["college", "university"],
  },
  {
    key: "library",
    label: "Library",
    color: "#4338CA",
    icon: require("@/assets/map/icons/poi-school.png"),
    classes: ["library", "books"],
  },
  {
    key: "hospital",
    label: "Health",
    color: "#D62828",
    icon: require("@/assets/map/icons/poi-health.png"),
    classes: [
      "hospital",
      "nursing_home",
      "clinic",
      "dentist",
      "doctors",
      "pharmacy",
      "veterinary",
    ],
  },
  {
    key: "atm",
    label: "Bank / ATM",
    color: "#166534",
    icon: require("@/assets/map/icons/poi-generic.png"),
    classes: ["atm", "bank"],
  },
  {
    key: "post",
    label: "Post",
    color: "#CA8A04",
    icon: require("@/assets/map/icons/poi-generic.png"),
    classes: ["post", "post_box", "post_office", "parcel_locker"],
  },
  {
    key: "lodging",
    label: "Lodging",
    color: "#7B2CBF",
    icon: require("@/assets/map/icons/poi-generic.png"),
    classes: [
      "lodging",
      "hotel",
      "motel",
      "bed_and_breakfast",
      "guest_house",
      "hostel",
      "chalet",
      "alpine_hut",
      "dormitory",
    ],
  },
  {
    key: "campsite",
    label: "Campsite",
    color: "#365314",
    icon: require("@/assets/map/icons/poi-generic.png"),
    classes: ["campsite", "camp_site", "caravan_site"],
  },
  {
    key: "car",
    label: "Car",
    color: "#57534E",
    icon: require("@/assets/map/icons/poi-car.png"),
    classes: ["car", "car_repair", "car_parts"],
  },
  {
    key: "taxi",
    label: "Taxi",
    color: "#57534E",
    icon: require("@/assets/map/icons/poi-taxi.png"),
    classes: ["taxi"],
  },
  {
    key: "fuel",
    label: "Fuel",
    color: "#EA580C",
    icon: require("@/assets/map/icons/poi-fuel.png"),
    classes: ["fuel", "charging_station"],
  },
  {
    key: "bus",
    label: "Bus",
    color: "#3A86FF",
    icon: require("@/assets/map/icons/poi-bus.png"),
    classes: ["bus", "bus_stop", "bus_station"],
  },
  {
    key: "railway",
    label: "Rail",
    color: "#2563EB",
    icon: require("@/assets/map/icons/poi-transit.png"),
    classes: [
      "railway",
      "station",
      "halt",
      "tram_stop",
      "subway",
      "railway_light",
      "railway_metro",
    ],
  },
  {
    key: "aerialway",
    label: "Aerialway",
    color: "#0EA5E9",
    icon: require("@/assets/map/icons/poi-transit.png"),
    classes: ["aerialway"],
  },
  {
    key: "entrance",
    label: "Entrance",
    color: "#60A5FA",
    icon: require("@/assets/map/icons/poi-transit.png"),
    classes: ["entrance", "subway_entrance", "train_station_entrance"],
  },
  {
    key: "harbor",
    label: "Harbor / Ferry",
    color: "#0369A1",
    icon: require("@/assets/map/icons/poi-transit.png"),
    classes: ["harbor", "marina", "dock", "ferry"],
  },
  {
    key: "airport",
    label: "Airport",
    color: "#1E3A8A",
    icon: require("@/assets/map/icons/poi-transit.png"),
    classes: ["airport", "airfield", "heliport"],
  },
  {
    key: "attraction",
    label: "Attraction",
    color: "#F4A261",
    icon: require("@/assets/map/icons/poi-attraction.png"),
    classes: [
      "attraction",
      "viewpoint",
      "monument",
      "information",
      "lighthouse",
      "volcano",
      "mountain",
      "water",
      "wetland",
    ],
  },
  {
    key: "art_gallery",
    label: "Art / Culture",
    color: "#9333EA",
    icon: require("@/assets/map/icons/poi-attraction.png"),
    classes: [
      "art_gallery",
      "art",
      "artwork",
      "gallery",
      "arts_centre",
      "cinema",
      "theatre",
      "museum",
    ],
  },
  {
    key: "music",
    label: "Music",
    color: "#C026D3",
    icon: require("@/assets/map/icons/poi-attraction.png"),
    classes: ["music", "musical_instrument"],
  },
  {
    key: "castle",
    label: "Castle",
    color: "#A16207",
    icon: require("@/assets/map/icons/poi-attraction.png"),
    classes: ["castle", "ruins"],
  },
  {
    key: "stadium",
    label: "Sport",
    color: "#16A34A",
    icon: require("@/assets/map/icons/poi-attraction.png"),
    classes: [
      "stadium",
      "american_football",
      "soccer",
      "baseball",
      "basketball",
      "tennis",
      "cricket",
      "pitch",
      "skiing",
    ],
  },
  {
    key: "swimming",
    label: "Swimming",
    color: "#0891B2",
    icon: require("@/assets/map/icons/poi-attraction.png"),
    classes: ["swimming", "swimming_area"],
  },
  {
    key: "golf",
    label: "Golf",
    color: "#65A30D",
    icon: require("@/assets/map/icons/poi-attraction.png"),
    classes: ["golf", "golf_course", "miniature_golf"],
  },
  {
    key: "park",
    label: "Park",
    color: "#2D6A4F",
    icon: require("@/assets/map/icons/poi-attraction.png"),
    classes: ["park", "bbq", "garden", "dog_park", "picnic_site"],
  },
  {
    key: "zoo",
    label: "Zoo",
    color: "#84CC16",
    icon: require("@/assets/map/icons/poi-attraction.png"),
    classes: [
      "zoo",
      "enclosure",
      "petting_zoo",
      "aviary",
      "wildlife_park",
      "birds",
      "safari_park",
      "butterfly",
      "falconry",
      "reptile",
      "terrarium",
      "aquarium",
      "amusement_park",
    ],
  },
  {
    key: "cemetery",
    label: "Cemetery",
    color: "#78716C",
    icon: require("@/assets/map/icons/poi-generic.png"),
    classes: ["cemetery", "grave_yard"],
  },
  {
    key: "generic",
    label: "Other",
    color: "#6C757D",
    icon: require("@/assets/map/icons/poi-generic.png"),
    classes: [
      "police",
      "fire_station",
      "prison",
      "embassy",
      "toilets",
      "drinking_water",
      "telephone",
      "waste_basket",
      "parking",
      "parking_garage",
      "hairdresser",
      "industry",
      "warehouse",
      "commercial",
      "building",
      "dam",
      "shelter",
      "ranger_station",
      "bicycle_rental",
    ],
  },
];

export const POI_ICON_IDS: Record<string, string> = Object.fromEntries(
  POI_CATEGORIES.map((category) => [
    category.key,
    `atlasys-poi-${category.key}`,
  ]),
);

const PARENT_BY_CLASS: Record<string, PoiCategory> = {};
for (const category of POI_CATEGORIES) {
  for (const value of [category.key, ...category.classes]) {
    PARENT_BY_CLASS[value] = category;
  }
}

export const POI_LEGEND = POI_CATEGORIES.map((category) => ({
  id: POI_ICON_IDS[category.key],
  label: category.label,
  color: category.color,
}));

export function buildPoiIconImageExpression(): unknown[] {
  return [
    "match",
    ["get", "class"],
    ...Object.entries(PARENT_BY_CLASS).flatMap(([value, category]) => [
      value,
      POI_ICON_IDS[category.key],
    ]),
    POI_ICON_IDS.generic,
  ];
}

export function buildPoiColorExpression(): unknown[] {
  return [
    "match",
    ["get", "class"],
    ...Object.entries(PARENT_BY_CLASS).flatMap(([value, category]) => [
      value,
      category.color,
    ]),
    "#6C757D",
  ];
}

const POI_SOURCE_ID = "openmaptiles";
const POI_SOURCE_LAYER = "poi";
const POI_SYMBOL_LAYER_ID = "atlasys-poi-symbols";
const POI_HALO_LAYER_ID = "atlasys-poi-halo";

const POI_MIN_ZOOM = 10;

const POI_RANK_BY_ZOOM = [
  "interpolate",
  ["linear"],
  ["zoom"],
  10,
  1,
  12,
  2,
  14,
  4,
  16,
  8,
  18,
  16,
];

const POI_FILTER = [
  "all",
  ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false],
  ["has", "rank"],
  ["<", ["get", "rank"], POI_RANK_BY_ZOOM],
];

const POI_DARK_OUTLINE = "#0B1020";

export type PoiStyleOptions = { dark?: boolean };

function isDarkStyle(style: StyleSpecification): boolean {
  const id = (style as { id?: string }).id ?? "";
  return `${style.name ?? ""} ${id}`.toLowerCase().includes("dark");
}

function buildPoiHaloLayer(
  dark: boolean,
): StyleSpecification["layers"][number] {
  const color = buildPoiColorExpression();
  return {
    id: POI_HALO_LAYER_ID,
    type: "circle",
    source: POI_SOURCE_ID,
    "source-layer": POI_SOURCE_LAYER,
    minzoom: POI_MIN_ZOOM,
    filter: POI_FILTER,
    paint: {
      "circle-color": color,
      "circle-radius": 12,
      "circle-opacity": dark ? 0.95 : 0.3,
    },
  } as unknown as StyleSpecification["layers"][number];
}

function buildPoiSymbolLayer(
  dark: boolean,
): StyleSpecification["layers"][number] {
  return {
    id: POI_SYMBOL_LAYER_ID,
    type: "symbol",
    source: POI_SOURCE_ID,
    "source-layer": POI_SOURCE_LAYER,
    minzoom: POI_MIN_ZOOM,
    filter: POI_FILTER,
    layout: {
      "icon-image": buildPoiIconImageExpression(),
      "icon-size": 1,
      "icon-allow-overlap": true,
      "text-field": [
        "coalesce",
        ["get", "name:latin"],
        ["get", "name_en"],
        ["get", "name"],
      ],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      "text-max-width": 12,
      "text-anchor": "top",
      "text-offset": [0, 0.8],
      "text-optional": true,
    },
    paint: {
      "text-color": buildPoiColorExpression(),
      "text-halo-color": dark ? POI_DARK_OUTLINE : "#FFFFFF",
      "text-halo-width": dark ? 1.4 : 1.2,
    },
  } as unknown as StyleSpecification["layers"][number];
}

export function buildCustomPoiStyle(
  style: StyleSpecification,
  options?: PoiStyleOptions,
): StyleSpecification {
  const dark = options?.dark ?? isDarkStyle(style);
  const sources = { ...style.sources };
  if (!sources[POI_SOURCE_ID]) {
    sources[POI_SOURCE_ID] = {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    };
  }

  const layers = style.layers.map((layer) =>
    layer.type === "symbol" && layer["source-layer"] === POI_SOURCE_LAYER
      ? {
          ...layer,
          layout: {
            ...layer.layout,
            "icon-image": buildPoiIconImageExpression(),
            "icon-size": 1,
            "icon-allow-overlap": true,
          },
        }
      : layer,
  ) as StyleSpecification["layers"];

  const firstPoiIndex = layers.findIndex(
    (layer) =>
      layer.type === "symbol" && layer["source-layer"] === POI_SOURCE_LAYER,
  );

  if (firstPoiIndex >= 0) {
    layers.splice(firstPoiIndex, 0, buildPoiHaloLayer(dark));
  } else {
    layers.push(buildPoiHaloLayer(dark), buildPoiSymbolLayer(dark));
  }

  return { ...style, sources, layers };
}

function guessMime(uri: string): string {
  if (/\.png($|\?)/i.test(uri)) return "image/png";
  if (/\.jpe?g($|\?)/i.test(uri)) return "image/jpeg";
  if (/\.webp($|\?)/i.test(uri)) return "image/webp";
  return "application/octet-stream";
}

async function assetToDataUri(id: number): Promise<string> {
  const asset = Asset.fromModule(id);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const response = await fetch(uri);
  const blob = await response.blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(blob);
  });
  return `data:${guessMime(uri)};base64,${base64}`;
}

export function usePoiIconUris(): Record<string, string | null> {
  const [uris, setUris] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      POI_CATEGORIES.map(
        async (category) =>
          [category.key, await assetToDataUri(category.icon)] as const,
      ),
    )
      .then((entries) => {
        if (!cancelled) setUris(Object.fromEntries(entries));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return uris;
}
