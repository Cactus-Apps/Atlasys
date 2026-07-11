import { FilterCategory, FilterItem } from "@/app/(tabs)/mapscreen";

export const FILTER_CATEGORIES: FilterCategory[] = [
  { id: "food", labelKey: "Cat_food", icon: "Utensils", color: "#D97200" },
  {
    id: "nature",
    labelKey: "Cat_nature",
    icon: "Leaf",
    color: "#16A34A",
  },
  {
    id: "activities",
    labelKey: "Cat_activities",
    icon: "FerrisWheel",
    color: "#725A50",
  },
  {
    id: "shopping",
    labelKey: "Cat_shopping",
    icon: "ShoppingBag",
    color: "#5D60BE",
  },
  {
    id: "services",
    labelKey: "Cat_services",
    icon: "Building",
    color: "#8B5CF6",
  },
  {
    id: "medical",
    labelKey: "Cat_medical",
    icon: "Ambulance",
    color: "#BA3827",
  },
  { id: "transit", labelKey: "Cat_transit", icon: "Bus", color: "#0E7490" },
];

export const FILTER_DEFS: FilterItem[] = [
  {
    id: "restaurants",
    labelKey: "Filter_restaurants",
    subclass: ["restaurant"],
    categoryId: "food",
  },
  {
    id: "bars",
    labelKey: "Filter_bars",
    subclass: ["bar", "pub"],
    categoryId: "food",
  },
  {
    id: "cafes",
    labelKey: "Filter_cafes",
    subclass: ["cafe"],
    categoryId: "food",
  },
  {
    id: "delivery",
    labelKey: "Filter_delivery",
    subclass: ["fast_food", "food_court", "takeaway"],
    categoryId: "food",
  },

  {
    id: "museums",
    labelKey: "Filter_museums",
    subclass: ["museum"],
    categoryId: "activities",
  },
  {
    id: "parks",
    labelKey: "Filter_parks",
    subclass: ["park", "nature"],
    categoryId: "nature",
  },
  {
    id: "livemusic",
    labelKey: "Filter_livemusic",
    subclass: ["music_venue", "concert_hall", "nightclub"],
    categoryId: "activities",
  },
  {
    id: "gym",
    labelKey: "Filter_gym",
    subclass: ["fitness_centre", "sports_centre"],
    categoryId: "activities",
  },
  {
    id: "cinema",
    labelKey: "Filter_cinema",
    subclass: ["cinema"],
    categoryId: "activities",
  },
  {
    id: "art",
    labelKey: "Filter_art",
    subclass: ["art_gallery"],
    categoryId: "activities",
  },
  {
    id: "attractions",
    labelKey: "Filter_attractions",
    subclass: ["attraction", "monument", "artwork", "zoo", "aquarium"],
    categoryId: "activities",
  },
  {
    id: "libraries",
    labelKey: "Filter_libraries",
    subclass: ["library"],
    categoryId: "activities",
  },

  {
    id: "groceries",
    labelKey: "Filter_groceries",
    subclass: ["supermarket", "grocery"],
    categoryId: "shopping",
  },
  {
    id: "malls",
    labelKey: "Filter_malls",
    subclass: ["mall"],
    categoryId: "shopping",
  },
  {
    id: "cosmetics",
    labelKey: "Filter_cosmetics",
    subclass: ["chemist", "beauty", "cosmetics"],
    categoryId: "shopping",
  },
  {
    id: "electronics",
    labelKey: "Filter_electronics",
    subclass: ["electronics"],
    categoryId: "shopping",
  },
  {
    id: "automotive",
    labelKey: "Filter_automotive",
    subclass: ["car", "car_repair", "car_parts"],
    categoryId: "shopping",
  },
  {
    id: "clothing",
    labelKey: "Filter_clothing",
    subclass: ["clothes"],
    categoryId: "shopping",
  },

  {
    id: "hotels",
    labelKey: "Filter_hotels",
    subclass: ["hotel", "hostel", "motel", "lodging"],
    categoryId: "services",
  },
  {
    id: "hospitals",
    labelKey: "Filter_hospitals",
    subclass: ["hospital", "clinic", "doctor"],
    categoryId: "medical",
  },
  {
    id: "post",
    labelKey: "Filter_post",
    subclass: ["post_office"],
    categoryId: "services",
  },
  {
    id: "parking",
    labelKey: "Filter_parking",
    subclass: ["parking"],
    categoryId: "services",
  },
  {
    id: "car_rental",
    labelKey: "Filter_car_rental",
    subclass: ["car_rental"],
    categoryId: "services",
  },
  {
    id: "car_repair",
    labelKey: "Filter_car_repair",
    subclass: ["car_repair"],
    categoryId: "services",
  },
  {
    id: "car_wash",
    labelKey: "Filter_car_wash",
    subclass: ["car_wash"],
    categoryId: "services",
  },
  {
    id: "pharmacy",
    labelKey: "Filter_pharmacy",
    subclass: ["pharmacy"],
    categoryId: "medical",
  },

  {
    id: "bus",
    labelKey: "Filter_bus",
    subclass: ["bus"],
    categoryId: "transit",
  },
  {
    id: "train",
    labelKey: "Filter_train",
    subclass: ["railway", "train"],
    categoryId: "transit",
  },
  {
    id: "subway",
    labelKey: "Filter_subway",
    subclass: ["subway", "metro"],
    categoryId: "transit",
  },
];
