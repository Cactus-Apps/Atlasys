import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppTheme, TabTheme } from "../theme";

type AvatarConfig = {
  seed?: string;
  hair?: string;
  body?: string;
  eyebrows?: string;
  eyes?: string;
  mouth?: string;
  nose?: string;
  accessories?: string;
  hats?: string;
  faceHair?: string;
  hairColor?: string;
  bodyColor?: string;
  headColor?: string;
  earsColor?: string;
  eyebrowsColor?: string;
  eyesColor?: string;
  mouthColor?: string;
  noseColor?: string;
  accessoriesColor?: string;
  hatsColor?: string;
  faceHairColor?: string;
  backgroundColor?: string;
};

type SavedPlace = {
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
  thumbnail?: string | null;
  addedAt: string;
};

export type CustomPlace = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  addedAt: string;
  /** Eigener Kategoriename für Custom-Kategorien (nur wenn category === "custom") */
  customCategory?: string;
  /** Key des gewählten Icons für Custom-Kategorien (Farbe + Icon werden daraus abgeleitet) */
  categoryIcon?: string;
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

type NavRouteData = {
  id: string;
  destinationName: string;
  startName: string;
  startCoords: [number, number];
  destinationCoords: [number, number];
  geometry: { type: "LineString"; coordinates: [number, number][] };
  steps: any[];
  distance: number;
  duration: number;
  profile: "driving" | "cycling" | "walking";
};

type StoreAuth = {
  savedPlaces: SavedPlace[];
  addPlace: (place: Omit<SavedPlace, "addedAt">) => void;
  updatePlace: (
    name: string,
    updates: Partial<Omit<SavedPlace, "name" | "addedAt">>,
  ) => void;
  reorderPlaces: (fromIndex: number, toIndex: number) => void;
  removePlace: (name: string) => void;
  isPlaceSaved: (name: string) => boolean;
  _seededForUserId: string | null;
  seedDefaultPlace: () => void;

  // Custom places (long-press pins, e.g. Home/Work)
  customPlaces: CustomPlace[];
  addCustomPlace: (place: Omit<CustomPlace, "id" | "addedAt">) => void;
  updateCustomPlace: (id: string, updates: Partial<Omit<CustomPlace, "id" | "addedAt">>) => void;
  removeCustomPlace: (id: string) => void;
  importCustomPlaces: (places: Omit<CustomPlace, "id" | "addedAt">[]) => {
    added: number;
    updated: number;
  };
  isCustomPlaceSaved: (lat: number, lon: number) => boolean;

  // Onboarding & Settings & Theme
  isOnboardingCompleted: boolean;
  setOnboardingCompleted: (val: boolean) => void;
  seenAnalyticsUpdate: boolean;
  setSeenAnalyticsUpdate: (val: boolean) => void;
  /** Version the user last saw in the UpdateScreen */
  lastSeenUpdateVersion: string;
  setLastSeenUpdateVersion: (val: string) => void;
  settings: {
    notifications: boolean;
    analytics: boolean;
    /** Sentry: false = don't send crash reports (absent → enabled) */
    crashReports?: boolean;
    /** Expo Updates: background check (absent → enabled) */
    autoUpdateCheck?: boolean;
    /** Daily analytics ping (absent → disabled) */
    ping?: boolean;
    theme: AppTheme; // ← replaces both old fields
    /** Fine control; missing in old saves → fallback to `notifications` */
    tabTheme: TabTheme;
    notificationTopics?: {
      userAccount: boolean;
      coolPlaces: boolean;
      subscriptions: boolean;
      offlineMaps: boolean;
      updates: boolean;
    };
  };

  updateSettings: (settings: Partial<StoreAuth["settings"]>) => void;
  // Routing
  currentRoute: RouteData | null;
  setCurrentRoute: (route: RouteData | null) => void;

  // Navigation (in-memory, non-persisted)
  navRoute: NavRouteData | null;
  setNavRoute: (route: NavRouteData | null) => void;

  // Search History
  searchHistory: string[];
  setSearchHistory: (history: string[]) => void;
  addToSearchHistory: (item: string) => void;
  removeFromSearchHistory: (item: string) => void;
  clearSearchHistory: () => void;

  // Map Position (in-memory only, resets on app close)
  mapPosition: { latitude: number; longitude: number; zoom: number } | null;
  setMapPosition: (
    pos: { latitude: number; longitude: number; zoom: number } | null,
  ) => void;

  // Avatar
  avatarConfig: AvatarConfig | null;
  setAvatarConfig: (config: AvatarConfig | null) => void;

  // Session Management
  userId: string | null;
  setUserId: (id: string | null) => void;
  searchCount: number;
  incrementSearchCount: () => void;
  clearStore: (options?: { preserveOnboarding?: boolean }) => void;
};

const initialState = {
  savedPlaces: [],
  customPlaces: [],
  _seededForUserId: null,
  isOnboardingCompleted: false,
  seenAnalyticsUpdate: false,
  lastSeenUpdateVersion: "",
  settings: {
    notifications: false,
    analytics: true,
    crashReports: true,
    autoUpdateCheck: true,
    theme: "light" as AppTheme,
    tabTheme: "modern" as TabTheme,
    notificationTopics: {
      userAccount: false,
      coolPlaces: false,
      subscriptions: false,
      offlineMaps: false,
      updates: false,
    },
  },
  avatarConfig: null,
  currentRoute: null,
  navRoute: null,
  mapPosition: null,
  searchHistory: [],
  userId: null,
  searchCount: 0,
};

export const useAuthStore = create<StoreAuth>()(
  persist(
    (set, get) => ({
      ...initialState,
      savedPlaces: [],
      addPlace: (place) => {
        const newPlace = { ...place, addedAt: new Date().toISOString() };
        set((state) => ({
          savedPlaces: [
            newPlace,
            ...state.savedPlaces.filter((p) => p.name !== place.name),
          ],
        }));
      },
      updatePlace: (name, updates) => {
        set((state) => ({
          savedPlaces: state.savedPlaces.map((p) =>
            p.name === name ? { ...p, ...updates } : p,
          ),
        }));
      },
      reorderPlaces: (fromIndex, toIndex) => {
        set((state) => {
          const updated = [...state.savedPlaces];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          return { savedPlaces: updated };
        });
      },
      removePlace: (name) => {
        set((state) => ({
          savedPlaces: state.savedPlaces.filter((p) => p.name !== name),
        }));
      },
      isPlaceSaved: (name) => {
        return get().savedPlaces.some((p) => p.name === name);
      },
      customPlaces: [],
      addCustomPlace: (place) => {
        const newPlace = {
          ...place,
          id: `place-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({
          customPlaces: [newPlace, ...state.customPlaces],
        }));
      },
      updateCustomPlace: (id, updates) => {
        set((state) => ({
          customPlaces: state.customPlaces.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        }));
      },
      removeCustomPlace: (id) => {
        set((state) => ({
          customPlaces: state.customPlaces.filter((p) => p.id !== id),
        }));
      },
      importCustomPlaces: (places) => {
        let added = 0;
        let updated = 0;
        set((state) => {
          const existing = [...state.customPlaces];
          for (const p of places) {
            const idx = existing.findIndex(
              (e) =>
                Math.abs(e.latitude - p.latitude) < 0.0001 &&
                Math.abs(e.longitude - p.longitude) < 0.0001,
            );
            if (idx >= 0) {
              existing[idx] = {
                ...existing[idx],
                name: p.name,
                category: p.category,
                customCategory: p.customCategory,
                categoryIcon: p.categoryIcon,
              };
              updated++;
            } else {
              existing.push({
                ...p,
                id: `place-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                addedAt: new Date().toISOString(),
              });
              added++;
            }
          }
          return { customPlaces: existing };
        });
        return { added, updated };
      },
      isCustomPlaceSaved: (lat, lon) => {
        return get().customPlaces.some(
          (p) =>
            Math.abs(p.latitude - lat) < 0.0001 &&
            Math.abs(p.longitude - lon) < 0.0001,
        );
      },
      _seededForUserId: null,
      seedDefaultPlace: () => {
        const state = get();
        if (state.savedPlaces.length > 0) return;
        if (state._seededForUserId === state.userId && state.userId !== null)
          return;
        set({
          savedPlaces: [
            {
              name: "Paris",
              latitude: 48.8566,
              longitude: 2.3522,
              region: "Île-de-France",
              country: "France",
              thumbnail:
                "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/500px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg",
              addedAt: new Date().toISOString(),
            },
          ],
          _seededForUserId: state.userId,
        });
      },

  isOnboardingCompleted: false,
  setOnboardingCompleted: (val) => set({ isOnboardingCompleted: val }),
  seenAnalyticsUpdate: false,
  setSeenAnalyticsUpdate: (val) => set({ seenAnalyticsUpdate: val }),
  lastSeenUpdateVersion: "",
  setLastSeenUpdateVersion: (val) => set({ lastSeenUpdateVersion: val }),
      settings: {
        notifications: false,
        analytics: true,
        crashReports: true,
        autoUpdateCheck: true,
        theme: "light" as AppTheme,
        tabTheme: "modern" as TabTheme,
        notificationTopics: {
          userAccount: false,
          coolPlaces: false,
          subscriptions: false,
          offlineMaps: false,
          updates: false,
        },
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      currentRoute: null,
      setCurrentRoute: (route) => set({ currentRoute: route }),
      navRoute: null,
      setNavRoute: (route) => set({ navRoute: route }),

      mapPosition: null,
      setMapPosition: (pos) => set({ mapPosition: pos }),

      searchHistory: [],
      setSearchHistory: (history) => set({ searchHistory: history }),
      addToSearchHistory: (item) =>
        set((state) => ({
          searchHistory: [
            item,
            ...state.searchHistory.filter((h) => h !== item),
          ].slice(0, 5),
        })),
      removeFromSearchHistory: (item) =>
        set((state) => ({
          searchHistory: state.searchHistory.filter((h) => h !== item),
        })),
      clearSearchHistory: () => set({ searchHistory: [] }),

      setAvatarConfig: (config) => set({ avatarConfig: config }),
      setUserId: (id) => set({ userId: id }),
      searchCount: 0,
      incrementSearchCount: () =>
        set((state) => ({ searchCount: state.searchCount + 1 })),
      clearStore: (options?: { preserveOnboarding?: boolean }) =>
        set((state) => ({
          ...initialState,
          isOnboardingCompleted: options?.preserveOnboarding
            ? state.isOnboardingCompleted
            : initialState.isOnboardingCompleted,
          settings: state.settings,
        })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState: any) => {
        if (!persistedState || typeof persistedState !== "object") {
          return initialState;
        }
        return {
          ...initialState,
          ...persistedState,
          settings: {
            ...initialState.settings,
            ...(persistedState.settings ?? {}),
          },
        };
      },
      partialize: (state) => ({
        isOnboardingCompleted: state.isOnboardingCompleted,
        seenAnalyticsUpdate: state.seenAnalyticsUpdate,
        lastSeenUpdateVersion: state.lastSeenUpdateVersion,
        settings: state.settings,
        userId: state.userId,
        savedPlaces: state.savedPlaces,
        customPlaces: state.customPlaces,
        searchHistory: state.searchHistory,
        avatarConfig: state.avatarConfig,
        _seededForUserId: state._seededForUserId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.seedDefaultPlace();
        }
      },
    },
  ),
);
