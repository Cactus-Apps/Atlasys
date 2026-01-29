import { create } from "zustand";

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

type StoreAuth = {
  isSubscribed: boolean;
  setSubscribed: (val: boolean) => void;
};

export const useAuthStore = create<StoreAuth>((set) => ({
  isSubscribed: false,
  setSubscribed: (val) => set({ isSubscribed: val }),
}));

