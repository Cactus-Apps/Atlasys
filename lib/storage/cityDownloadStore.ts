import { create } from "zustand";
import * as Sentry from "@sentry/react-native";
import {
  CITY_DEFAULT_MAX_ZOOM,
  CITY_DEFAULT_MIN_ZOOM,
  deleteCityPackage,
  downloadCityPackage,
  listCityPackages,
  type CityDownloadPhase,
  type CityDownloadStatus,
  type CityOfflinePackage,
} from "./offlineCity";

export type CityDownloadTask = {
  status: CityDownloadStatus;
  percent: number;
  phase: CityDownloadPhase;
  downloaded: number;
  total: number;
  failed: number;
};

type StartCityDownloadParams = {
  cityId: string;
  cityName: string;
  latitude: number;
  longitude: number;
  minZoom?: number;
  maxZoom?: number;
};

type CityDownloadStore = {
  tasks: Record<string, CityDownloadTask>;
  packages: Record<string, CityOfflinePackage>;
  loaded: boolean;
  refresh: () => Promise<void>;
  start: (params: StartCityDownloadParams) => void;
  cancel: (cityId: string) => void;
  remove: (cityId: string) => Promise<void>;
};

const cancelRefs = new Map<string, { cancelled: boolean }>();

const initialTask = (): CityDownloadTask => ({
  status: "downloading",
  percent: 0,
  phase: "tiles",
  downloaded: 0,
  total: 0,
  failed: 0,
});

export const useCityDownloads = create<CityDownloadStore>((set, get) => ({
  tasks: {},
  packages: {},
  loaded: false,

  refresh: async () => {
    try {
      const packages = await listCityPackages();
      const byId: Record<string, CityOfflinePackage> = {};
      for (const pkg of packages) {
        byId[pkg.cityId] = pkg;
      }
      set((state) => {
        const tasks: Record<string, CityDownloadTask> = {};
        for (const [id, task] of Object.entries(state.tasks)) {
          if (task.status === "downloading") tasks[id] = task;
        }
        for (const pkg of packages) {
          tasks[pkg.cityId] = {
            status: "done",
            percent: 100,
            phase: "finalizing",
            downloaded: pkg.tileCount,
            total: pkg.tileCount,
            failed: 0,
          };
        }
        return { packages: byId, tasks, loaded: true };
      });
    } catch (err) {
      Sentry.captureException(err);
      set({ loaded: true });
    }
  },

  start: (params) => {
    const { cityId } = params;
    const state = get();
    if (state.packages[cityId]) return;
    if (state.tasks[cityId]?.status === "downloading") return;

    const cancelRef = { cancelled: false };
    cancelRefs.set(cityId, cancelRef);

    set((prev) => ({
      tasks: { ...prev.tasks, [cityId]: initialTask() },
    }));

    downloadCityPackage({
      ...params,
      minZoom: params.minZoom ?? CITY_DEFAULT_MIN_ZOOM,
      maxZoom: params.maxZoom ?? CITY_DEFAULT_MAX_ZOOM,
      cancelRef,
      onProgress: (p) => {
        set((prev) => ({
          tasks: {
            ...prev.tasks,
            [cityId]: {
              status: p.status,
              percent: p.percent,
              phase: p.phase,
              downloaded: p.downloaded,
              total: p.total,
              failed: p.failed,
            },
          },
        }));
      },
    })
      .then((pkg) => {
        cancelRefs.delete(cityId);
        if (pkg) {
          set((prev) => ({
            packages: { ...prev.packages, [cityId]: pkg },
            tasks: {
              ...prev.tasks,
              [cityId]: {
                status: "done",
                percent: 100,
                phase: "finalizing",
                downloaded: pkg.tileCount,
                total: pkg.tileCount,
                failed: 0,
              },
            },
          }));
        } else {
          set((prev) => {
            const task = prev.tasks[cityId] ?? initialTask();
            return {
              tasks: {
                ...prev.tasks,
                [cityId]: {
                  ...task,
                  status: cancelRef.cancelled ? "cancelled" : "error",
                },
              },
            };
          });
        }
      })
      .catch((err) => {
        Sentry.captureException(err);
        cancelRefs.delete(cityId);
        set((prev) => {
          const task = prev.tasks[cityId] ?? initialTask();
          return {
            tasks: {
              ...prev.tasks,
              [cityId]: { ...task, status: "error" },
            },
          };
        });
      });
  },

  cancel: (cityId) => {
    const ref = cancelRefs.get(cityId);
    if (ref) ref.cancelled = true;
  },

  remove: async (cityId) => {
    await deleteCityPackage(cityId);
    set((prev) => {
      const packages = { ...prev.packages };
      const tasks = { ...prev.tasks };
      delete packages[cityId];
      delete tasks[cityId];
      return { packages, tasks };
    });
  },
}));
