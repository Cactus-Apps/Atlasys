import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type StoreTabs = {
  TabBar: "CustomTabBar1" | "CustomTabBar2";
  setTabBar: (tab: "CustomTabBar1" | "CustomTabBar2") => void;
};

export const useTabStore = create<StoreTabs>((set) => ({
  TabBar: "CustomTabBar2",
  setTabBar: (tab) => set({ TabBar: tab }),
}));

type Storeloading = {
  loadingGpsCoords: boolean;
  loadingWeather: boolean;
  loadingAll: boolean;
  setloadingGpsCoords: (val: boolean) => void;
  setloadingWeather: (val: boolean) => void;
};

export const useloadingStore = create<Storeloading>((set) => ({
  loadingGpsCoords: true,
  loadingWeather: true,
  loadingAll: true,
  setloadingGpsCoords: (val) =>
    set(() => ({
      loadingGpsCoords: val,
    })),
  setloadingWeather: (val) =>
    set(() => ({
      loadingWeather: val,
    })),
}));


type SavedPlace = {
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
  thumbnail?: string | null;
  addedAt: string;
};

type RouteData = {
  id: string;
  destinationName: string;
  destinationCoords: [number, number];
  geometry: any;
  distance: number;
  duration: number;
  timestamp: string;
};



type StoreAuth = {
  isSubscribed: boolean;
  setSubscribed: (val: boolean) => void;
  savedPlaces: SavedPlace[];
  addPlace: (place: Omit<SavedPlace, "addedAt">) => void;
  removePlace: (name: string) => void;
  isPlaceSaved: (name: string) => boolean;

  // Onboarding & Settings
  isOnboardingCompleted: boolean;
  setOnboardingCompleted: (val: boolean) => void;
  settings: {
    notifications: boolean;
    locationSharing: boolean;
    analytics: boolean;
    designStyle?: "modern" | "classic";
  };
  updateSettings: (settings: Partial<StoreAuth["settings"]>) => void;

  // Routing
  currentRoute: RouteData | null;
  setCurrentRoute: (route: RouteData | null) => void;
  routeHistory: RouteData[];
  addRouteToHistory: (route: RouteData) => void;

  // Session Management
  userId: string | null;
  setUserId: (id: string | null) => void;
  searchCount: number;
  incrementSearchCount: () => void;
  clearStore: () => void;
};

const initialState = {
  isSubscribed: false,
  savedPlaces: [],
  isOnboardingCompleted: false,
  settings: {
    notifications: false,
    locationSharing: false,
    analytics: false,
    designStyle: "classic" as const,
  },
  currentRoute: null,
  routeHistory: [],
  userId: null,
  searchCount: 0,
};

export const useAuthStore = create<StoreAuth>()(
  persist(
    (set, get) => ({
      ...initialState,
      setSubscribed: (val) => set({ isSubscribed: val }),
      savedPlaces: [],
      addPlace: (place) => {
        const newPlace = { ...place, addedAt: new Date().toISOString() };
        set((state) => ({
          savedPlaces: [newPlace, ...state.savedPlaces.filter(p => p.name !== place.name)],
        }));
      },
      removePlace: (name) => {
        set((state) => ({
          savedPlaces: state.savedPlaces.filter((p) => p.name !== name),
        }));
      },
      isPlaceSaved: (name) => {
        return get().savedPlaces.some((p) => p.name === name);
      },

      isOnboardingCompleted: false,
      setOnboardingCompleted: (val) => set({ isOnboardingCompleted: val }),
      settings: {
        notifications: false,
        locationSharing: false,
        analytics: false,
        designStyle: "classic",
      },
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      currentRoute: null,
      setCurrentRoute: (route) => set({ currentRoute: route }),
      routeHistory: [],
      addRouteToHistory: (route) => set((state) => ({
        routeHistory: [route, ...state.routeHistory].slice(0, 10)
      })),

      setUserId: (id) => set({ userId: id }),
      searchCount: 0,
      incrementSearchCount: () => set((state) => ({ searchCount: state.searchCount + 1 })),
      clearStore: () => set(initialState),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboardingCompleted: state.isOnboardingCompleted,
        settings: state.settings,
        userId: state.userId,
      }),
    }
  )
);

