import { create } from "zustand";

// IMPORTANT: NO timestamps are kept here and none are ever rendered. The
// only internal timing is the offline-detection bookkeeping, which lives in
// the channel manager and is never shown.

export type PeerStatus = "online" | "offline" | "ended";

export type SharedPeer = {
  id: string;
  name?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  status: PeerStatus;
};

type SharingStore = {
  sessionLoaded: boolean;
  isAdmin: boolean;
  active: boolean;
  sending: boolean;
  peers: Record<string, SharedPeer>;
  lastError: string | null;

  setSessionLoaded: (value: boolean) => void;
  setIsAdmin: (value: boolean) => void;
  setActive: (value: boolean) => void;
  setSending: (value: boolean) => void;
  setLastError: (message: string | null) => void;
  upsertPosition: (
    peerId: string,
    name: string | undefined,
    latitude: number,
    longitude: number,
    accuracyMeters?: number,
  ) => void;
  markOffline: (peerId: string) => void;
  markEnded: (peerId: string, name?: string) => void;
  reset: () => void;
};

const initialState = {
  sessionLoaded: false,
  isAdmin: false,
  active: false,
  sending: false,
  peers: {},
  lastError: null,
};

export const useSharingStore = create<SharingStore>()((set, get) => ({
  ...initialState,

  setSessionLoaded: (value) => set({ sessionLoaded: value }),
  setIsAdmin: (value) => set({ isAdmin: value }),
  setActive: (value) => set({ active: value, sending: value }),
  setSending: (value) => set({ sending: value }),
  setLastError: (message) => set({ lastError: message }),

  upsertPosition: (peerId, name, latitude, longitude, accuracyMeters) =>
    set((state) => ({
      peers: {
        ...state.peers,
        [peerId]: {
          ...(state.peers[peerId] ?? { id: peerId, status: "online" }),
          id: peerId,
          name: name ?? state.peers[peerId]?.name,
          latitude,
          longitude,
          accuracyMeters,
          status: "online",
        },
      },
    })),

  markOffline: (peerId) =>
    set((state) => {
      const peer = state.peers[peerId];
      if (!peer) return state;
      return {
        peers: { ...state.peers, [peerId]: { ...peer, status: "offline" } },
      };
    }),

  markEnded: (peerId, name) =>
    set((state) => {
      const peer = state.peers[peerId];
      if (!peer) return state;
      return {
        peers: {
          ...state.peers,
          [peerId]: {
            ...peer,
            name: name ?? peer.name,
            status: "ended",
          },
        },
      };
    }),

  reset: () => set({ ...initialState }),
}));

export function hasActiveShare(): boolean {
  return useSharingStore.getState().active;
}
