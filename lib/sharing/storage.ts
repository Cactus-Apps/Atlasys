import * as SecureStore from "expo-secure-store";
import {
  generateDeviceIdentity,
  randomBytesBase64,
  deriveChannelName,
  type DeviceIdentity,
} from "./crypto";

const SS = "atlasys.sharing.v1.";

export const SS_IDENTITY = `${SS}device_identity`;
export const SS_SESSION = `${SS}session`;
export const SS_COUNTER_SENT = `${SS}counters.sent`;
export const SS_COUNTER_RECV = `${SS}counters.recv`;

export type RosterMember = {
  id: string; // hex(signPublicKey)[..16] – stable, device-bound
  name?: string;
  signPublicKey: string; // base64
  boxPublicKey: string; // base64
};

export type ShareSession = {
  epoch: number;
  familyId: string; // hex, random
  dek: string; // base64 (family encryption key)
  channelName: string;
  isAdmin: boolean;
  active: boolean;
  adminName?: string;
  adminSignPublicKey: string; // base64
  adminBoxPublicKey: string; // base64
  members: RosterMember[]; // other participants (not self)
};

export type IdentityWithMeta = DeviceIdentity & { name?: string };

async function getJSON<T>(key: string): Promise<T | undefined> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

async function setJSON(key: string, value: unknown): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

// Device identity (created once, stored in Keychain/Keystore)

export async function getOrCreateIdentity(
  name?: string,
): Promise<IdentityWithMeta> {
  const existing = await getJSON<IdentityWithMeta>(SS_IDENTITY);
  if (existing?.signSecretKey) {
    if (name && existing.name !== name) {
      await setJSON(SS_IDENTITY, { ...existing, name });
      return { ...existing, name };
    }
    return existing;
  }
  const fresh = generateDeviceIdentity();
  const stored: IdentityWithMeta = { ...fresh, name };
  await setJSON(SS_IDENTITY, stored);
  return stored;
}

export async function getIdentity(): Promise<IdentityWithMeta | undefined> {
  return getJSON<IdentityWithMeta>(SS_IDENTITY);
}

// Session (family + DEK + roster)

export async function loadSession(): Promise<ShareSession | undefined> {
  const session = await getJSON<ShareSession>(SS_SESSION);
  if (!session) return undefined;
  // The epoch is a small rotation counter (1..65535) that fits the u16 wire
  // field. Sessions that predate rotation carried Date.now() there and could
  // never be opened across devices; drop them so the user starts fresh.
  if (
    !Number.isInteger(session.epoch) ||
    session.epoch < 1 ||
    session.epoch > 0xffff
  ) {
    await clearSession();
    return undefined;
  }
  return session;
}

export async function saveSession(session: ShareSession): Promise<void> {
  await setJSON(SS_SESSION, session);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SS_SESSION);
  await SecureStore.deleteItemAsync(SS_COUNTER_SENT);
  await SecureStore.deleteItemAsync(SS_COUNTER_RECV);
}

/**
 * Rotate the family DEK: new key, bumped epoch, derived new channel name and
 * an empty roster. Every remaining member must be paired again (admin-only).
 * Forward secrecy: old DEK/channel holders (including removed members and the
 * server relay) cannot decrypt or join the new channel.
 */
export async function rotateSession(
  session: ShareSession,
): Promise<ShareSession> {
  const dek = randomBytesBase64(32);
  const channelName = await deriveChannelName(session.familyId, dek);
  const next: ShareSession = {
    ...session,
    epoch: session.epoch + 1,
    dek,
    channelName,
    active: false,
    members: [],
  };
  if (next.epoch > 0xffff) {
    throw new Error("epoch-exhausted");
  }
  await saveSession(next);
  return next;
}

// Anti-replay counters (persistent across restarts)

export async function getSentCounter(epoch: number): Promise<number> {
  const map = await getJSON<Record<number, number>>(SS_COUNTER_SENT);
  return map?.[epoch] ?? 0;
}

export async function bumpSentCounter(epoch: number): Promise<number> {
  const map = (await getJSON<Record<number, number>>(SS_COUNTER_SENT)) ?? {};
  const next = (map[epoch] ?? 0) + 1;
  map[epoch] = next;
  await setJSON(SS_COUNTER_SENT, map);
  return next;
}

export async function getRecvCounter(
  epoch: number,
  deviceId: string,
): Promise<number> {
  const map =
    await getJSON<Record<string, Record<string, number>>>(SS_COUNTER_RECV);
  return map?.[epoch]?.[deviceId] ?? 0;
}

/**
 * Accept a message only if its counter is strictly greater than the last
 * accepted one for (epoch, sender). Returns false for duplicates/replays.
 */
export async function tryAcceptCounter(
  epoch: number,
  deviceId: string,
  counter: number,
): Promise<boolean> {
  const map =
    (await getJSON<Record<string, Record<string, number>>>(SS_COUNTER_RECV)) ??
    {};
  const epochMap = map[epoch] ?? {};
  const last = epochMap[deviceId] ?? 0;
  if (counter <= last) {
    return false;
  }
  epochMap[deviceId] = counter;
  map[epoch] = epochMap;
  await setJSON(SS_COUNTER_RECV, map);
  return true;
}

// Export for debugging (no secret values)
export async function hasDeviceIdentity(): Promise<boolean> {
  const id = await getIdentity();
  return Boolean(id?.signSecretKey);
}
