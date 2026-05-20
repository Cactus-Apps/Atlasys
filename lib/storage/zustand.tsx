import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppTheme } from "../theme";
import { AnalyticsChoice } from "@/lib/auth/analytics";

type StoreTabs = {
  NewTabBar: boolean;
  setNewTabBar: (tab: boolean) => void;
};

export const useTabStore = create<StoreTabs>((set) => ({
  NewTabBar: false,
  setNewTabBar: (tab) => set({ NewTabBar: tab }),
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
  savedPlaces: SavedPlace[];
  addPlace: (place: Omit<SavedPlace, "addedAt">) => void;
  removePlace: (name: string) => void;
  isPlaceSaved: (name: string) => boolean;

  // Onboarding & Settings & Theme
  isOnboardingCompleted: boolean;
  setOnboardingCompleted: (val: boolean) => void;
  settings: {
    notifications: boolean;
    analytics: AnalyticsChoice;
    /** Sentry: false = don't send crash reports (absent → enabled) */
    crashReports?: boolean;
    /** Expo Updates: background check (absent → enabled) */
    autoUpdateCheck?: boolean;
    theme: AppTheme; // ← replaces both old fields
    /** Fine control; missing in old saves → fallback to `notifications` */
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

  // Search History
  searchHistory: string[];
  setSearchHistory: (history: string[]) => void;
  addToSearchHistory: (item: string) => void;
  removeFromSearchHistory: (item: string) => void;
  clearSearchHistory: () => void;

  // Map Position (in-memory only, resets on app close)
  mapPosition: { latitude: number; longitude: number; zoom: number } | null;
  setMapPosition: (pos: { latitude: number; longitude: number; zoom: number } | null) => void;

  // Session Management
  userId: string | null;
  setUserId: (id: string | null) => void;
  searchCount: number;
  incrementSearchCount: () => void;
  clearStore: (options?: { preserveOnboarding?: boolean }) => void;
};

const initialState = {
  savedPlaces: [],
  isOnboardingCompleted: false,
  settings: {
    notifications: false,
    analytics: "none" as AnalyticsChoice,
    crashReports: true,
    autoUpdateCheck: true,
    theme: "light" as AppTheme,
    notificationTopics: {
      userAccount: false,
      coolPlaces: false,
      subscriptions: false,
      offlineMaps: false,
      updates: false,
    },
  },
  currentRoute: null,
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
        analytics: "none",
        crashReports: true,
        autoUpdateCheck: true,
        theme: "light" as AppTheme,
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
        settings: state.settings,
        userId: state.userId,
        savedPlaces: state.savedPlaces,
        searchHistory: state.searchHistory,
      }),
    },
  ),
);
