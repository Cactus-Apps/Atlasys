import * as Location from "expo-location";
import { supabase } from "@/lib/auth/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useSharingStore } from "./state";
import {
  sealShareMessage,
  openShareMessage,
  wireToBase64,
  wireFromBase64,
  MSG_END,
} from "./crypto";
import {
  loadSession,
  saveSession,
  getOrCreateIdentity,
  type ShareSession,
  type IdentityWithMeta,
  bumpSentCounter,
  tryAcceptCounter,
} from "./storage";

const SEND_INTERVAL_MS = 8_000;
const LOCATION_TIME_INTERVAL_MS = 5_000;
const LOCATION_DISTANCE_INTERVAL_M = 10;
const HEARTBEAT_SCAN_MS = 2_000;
const OFFLINE_THRESHOLD_MS = 25_000;

function shortIdOf(signPublicKeyB64: string): string {
  return signPublicKeyB64.slice(-16);
}

type PeerMeta = { name?: string; lastSeenMs: number };

class ShareChannelManager {
  private session: ShareSession | null = null;
  private identity: IdentityWithMeta | null = null;
  private channel: RealtimeChannel | null = null;
  private sendTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private locationWatcher: Location.LocationSubscription | null = null;
  private lastLocation: Location.LocationObject | null = null;
  private peerMeta = new Map<string, PeerMeta>();
  private running = false;

  isRunning(): boolean {
    return this.running;
  }

  getCurrentSession(): ShareSession | null {
    return this.session;
  }

  async bootstrap(): Promise<void> {
    const identity = await getOrCreateIdentity();
    this.identity = identity;
    const session = await loadSession();
    this.session = session ?? null;
    useSharingStore.getState().setSessionLoaded(true);
    if (session) {
      useSharingStore.getState().setIsAdmin(session.isAdmin);
      useSharingStore.getState().setActive(session.active);
      useSharingStore.getState().setSending(false);
    }
  }

  async start(session: ShareSession, sending: boolean): Promise<void> {
    this.stop();
    this.session = session;
    this.running = true;

    const identity = this.identity ?? (await getOrCreateIdentity());
    this.identity = identity;

    useSharingStore.getState().setIsAdmin(session.isAdmin);
    useSharingStore.getState().setActive(true);

    const active = { ...session, active: true };
    await saveSession(active);

    const allowedSenders = new Set([
      session.adminSignPublicKey,
      ...session.members.map((m) => m.signPublicKey),
    ]);

    const channel = supabase.channel(session.channelName, {
      config: { broadcast: { self: false } },
    });
    channel.on(
      "broadcast",
      { event: "share" },
      (payload: { payload?: string; event: string; type: string }) => {
        void this.handleMessage(payload?.payload ?? "", allowedSenders);
      },
    );

    const joined = await new Promise<boolean>((resolve) => {
      channel.subscribe((status) => {
        resolve(
          status === "SUBSCRIBED" || status === "CHANNEL_ERROR"
            ? status === "SUBSCRIBED"
            : false,
        );
      });
    });
    if (!joined) {
      useSharingStore.getState().setLastError("realtime-join-failed");
      this.stop();
      return;
    }
    this.channel = channel;

    if (sending) {
      await this.startSending();
    }

    this.heartbeatTimer = setInterval(() => {
      this.scanHeartbeats();
    }, HEARTBEAT_SCAN_MS);
  }

  async startSending(): Promise<void> {
    const store = useSharingStore.getState();
    store.setSending(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      store.setLastError("location-permission-denied");
      store.setSending(false);
      return;
    }

    try {
      this.locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_TIME_INTERVAL_MS,
          distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
        },
        (loc) => {
          this.lastLocation = loc;
        },
      );
    } catch {
      store.setLastError("location-watch-failed");
      store.setSending(false);
      this.sendTimer && clearInterval(this.sendTimer);
      return;
    }

    this.sendTimer = setInterval(() => {
      void this.publishPosition();
    }, SEND_INTERVAL_MS);
    void this.publishPosition();
  }

  private async publishPosition(): Promise<void> {
    const session = this.session;
    const identity = this.identity;
    if (!session || !identity || !this.channel) return;
    if (!this.lastLocation?.coords) return;

    const counter = await bumpSentCounter(session.epoch);
    const wire = sealShareMessage(
      session.epoch,
      session.dek,
      0x01 as const,
      counter,
      identity.signPublicKey,
      identity.signSecretKey,
      {
        latitude: this.lastLocation.coords.latitude,
        longitude: this.lastLocation.coords.longitude,
        accuracyMeters: this.lastLocation.coords.accuracy ?? 0,
      },
    );
    this.channel.send({
      type: "broadcast",
      event: "share",
      payload: wireToBase64(wire),
    });
  }

  private async handleMessage(
    b64: string,
    allowedSenders: Set<string>,
  ): Promise<void> {
    const session = this.session;
    if (!session) return;
    if (!b64) return;
    const store = useSharingStore.getState();

    let msg;
    try {
      msg = openShareMessage(
        wireFromBase64(b64),
        session.epoch,
        session.dek,
        allowedSenders,
      );
    } catch {
      return;
    }

    const deviceId = shortIdOf(msg.senderSignPublicKey);
    const member = session.members.find(
      (m) => m.signPublicKey === msg.senderSignPublicKey,
    );
    const name = member?.name ?? session.adminName;
    if (!member && msg.senderSignPublicKey !== session.adminSignPublicKey) {
      return;
    }

    const accepted = await tryAcceptCounter(
      session.epoch,
      deviceId,
      msg.counter,
    );
    if (!accepted) return;

    if (msg.type === 0x02) {
      store.markEnded(deviceId, name);
      this.peerMeta.delete(deviceId);
      return;
    }

    if (msg.hasPosition) {
      store.upsertPosition(
        deviceId,
        name,
        msg.latitude ?? 0,
        msg.longitude ?? 0,
        msg.accuracyMeters ?? 0,
      );
      this.peerMeta.set(deviceId, { name, lastSeenMs: Date.now() });
    }
  }

  private scanHeartbeats(): void {
    const now = Date.now();
    const store = useSharingStore.getState();
    for (const [deviceId, meta] of this.peerMeta) {
      if (now - meta.lastSeenMs > OFFLINE_THRESHOLD_MS) {
        store.markOffline(deviceId);
      }
    }
  }

  async stopSharing(): Promise<void> {
    const session = this.session;
    const identity = this.identity;
    if (session && identity && this.channel) {
      try {
        const counter = await bumpSentCounter(session.epoch);
        const wire = sealShareMessage(
          session.epoch,
          session.dek,
          MSG_END,
          counter,
          identity.signPublicKey,
          identity.signSecretKey,
        );
        await this.channel.send({
          type: "broadcast",
          event: "share",
          payload: wireToBase64(wire),
        });
      } catch {}
    }
    await this.deactivateSession();
    this.stop();
  }
  async deactivateSession(): Promise<void> {
    const session = this.session;
    if (session) {
      await saveSession({ ...session, active: false });
    }
    useSharingStore.getState().setActive(false);
    useSharingStore.getState().setSending(false);
  }

  stop(): void {
    this.running = false;
    if (this.locationWatcher) {
      this.locationWatcher.remove();
      this.locationWatcher = null;
    }
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
      this.sendTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.channel) {
      void supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.lastLocation = null;
    this.peerMeta.clear();
  }
}

export const sharingManager = new ShareChannelManager();
