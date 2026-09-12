import nacl from "tweetnacl";
import * as Crypto from "expo-crypto";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

// ---------------------------------------------------------------------------
// Copyright / security notes
// Everything here is thin packaging around TweetNaCl (public domain,
// audited: Bernstein et al., crowdfunded audit). We do NOT invent any
// primitives. The only custom logic is fixed-size binary framing + padding so
// that `position` and `end` messages are indistinguishable by size, and a
// persistent anti-replay counter. Both are documented trade-offs, not crypto.
//
// Message framing (E2E, server-blind):
//   wire   = [ v:u8 ][ epoch:u16 ][ nonce:24 ][ cipher:immer 352 ]
//   plain  = fixed 336 bytes:
//            [ magic 4 ] [ type 1 ] [ counter u32 ] [ senderSpk 32 ]
//            [ reserved 8 ] [ lat f64 ] [ lon f64 ] [ acc f32 ]
//            [ padding … ][ sig(Ed25519 detached) 64 at offset 272 ]
//
//   position (type 0x01) and end (type 0x02) yield the EXACT same byte
//   length. A passive observer cannot tell them apart, neither by size nor
//   by any visible field (type/counter are inside the AEAD + signature).
// ---------------------------------------------------------------------------

export const MSG_POSITION = 0x01 as const;
export const MSG_END = 0x02 as const;
export type ShareMessageType = typeof MSG_POSITION | typeof MSG_END;

export const PLAINTEXT_SIZE = 336;
export const SIG_OFFSET = 272;
export const CIPHERTEXT_SIZE = PLAINTEXT_SIZE + 16; // secretbox Poly1305 tag
export const NONCE_SIZE = 24;
export const WIRE_HEADER_SIZE = 27; // v(1) + epoch(2) + nonce(24)
export const WIRE_SIZE = WIRE_HEADER_SIZE + CIPHERTEXT_SIZE; // 379, constant

export const EPHEMERAL_SESSION_PREFIX = "ats-share-";

const MAGIC = new Uint8Array([0x41, 0x54, 0x53, 0x31]); // "ATS1"
const OFF_TYPE = 4;
const OFF_COUNTER = 5;
const OFF_SPK = 9; // 32 bytes
const OFF_RESERVED_A = 41; // 8 bytes
const OFF_LAT = 49;
const OFF_LON = 57;
const OFF_ACC = 65;
const OFF_RESERVED_B = 69; // 8 bytes -> padding until 272

let prngBound = false;
function ensurePRNG(): void {
  if (prngBound) return;
  nacl.setPRNG((x) => {
    const rnd = Crypto.getRandomBytes(x.length);
    x.set(rnd);
  });
  prngBound = true;
}

export type DeviceIdentity = {
  signPublicKey: string; // base64, Ed25519
  signSecretKey: string;
  boxPublicKey: string; // base64, X25519 (for wrapping DEKs)
  boxSecretKey: string;
};

export type ParsedShareMessage = {
  type: ShareMessageType;
  counter: number;
  senderSignPublicKey: string; // base64
  hasPosition: boolean;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
};

// Key generation

export function generateDeviceIdentity(): DeviceIdentity {
  ensurePRNG();
  const sign = nacl.sign.keyPair();
  const box = nacl.box.keyPair();
  return {
    signPublicKey: encodeBase64(sign.publicKey),
    signSecretKey: encodeBase64(sign.secretKey),
    boxPublicKey: encodeBase64(box.publicKey),
    boxSecretKey: encodeBase64(box.secretKey),
  };
}

export function randomBytesBase64(length: number): string {
  ensurePRNG();
  return encodeBase64(nacl.randomBytes(length));
}

export function randomHex(bytes: number): string {
  ensurePRNG();
  const buf = nacl.randomBytes(bytes);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Session channel name (capability secret, derived from the DEK)
// The channel name is unguessable and only derivable by devices that hold the
// family DEK. It is effectively the access token for the ephemeral relay.

export async function deriveChannelName(
  familyId: string,
  dekBase64: string,
): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${familyId}:${dekBase64}`,
  );
  return `${EPHEMERAL_SESSION_PREFIX}${digest}`;
}

// DEK wrapping (admin -> member)
// Wrap the 32-byte DEK so only the intended member (owning boxSecretKey
// matching boxPublicKey) can unwrap it. No key material is ever stored by us.

export function wrapDek(
  dek: Uint8Array,
  recipientBoxPublicKeyBase64: string,
  senderBoxSecretKeyBase64: string,
): { nonce: string; box: string } {
  ensurePRNG();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const sealed = nacl.box(
    dek,
    nonce,
    decodeBase64(recipientBoxPublicKeyBase64),
    decodeBase64(senderBoxSecretKeyBase64),
  );
  return { nonce: encodeBase64(nonce), box: encodeBase64(sealed) };
}

export function unwrapDek(
  nonce: string,
  box: string,
  senderBoxPublicKeyBase64: string,
  recipientBoxSecretKeyBase64: string,
): Uint8Array | null {
  const opened = nacl.box.open(
    decodeBase64(box),
    decodeBase64(nonce),
    decodeBase64(senderBoxPublicKeyBase64),
    decodeBase64(recipientBoxSecretKeyBase64),
  );
  if (!opened || opened.length !== nacl.secretbox.keyLength) return null;
  return opened;
}

// Build (sender side)

function buildPlaintext(
  type: ShareMessageType,
  counter: number,
  senderSignPublicKey: string,
  latitude: number | undefined,
  longitude: number | undefined,
  accuracyMeters: number,
  signSecretKeyBase64: string,
): Uint8Array {
  const plain = new Uint8Array(PLAINTEXT_SIZE);
  plain.set(MAGIC, 0);
  const dv = new DataView(plain.buffer);

  plain[OFF_TYPE] = type;
  dv.setUint32(OFF_COUNTER, counter >>> 0, false);
  plain.set(decodeBase64(senderSignPublicKey), OFF_SPK);

  if (type === MSG_POSITION && latitude != null && longitude != null) {
    dv.setFloat64(OFF_LAT, latitude, false);
    dv.setFloat64(OFF_LON, longitude, false);
    dv.setFloat32(OFF_ACC, accuracyMeters || 0, false);
  }
  // All remaining bytes stay 0: deterministic padding. position/end have
  // identical plaintext length -> identical ciphertext length.
  const sig = nacl.sign.detached(
    plain.subarray(0, SIG_OFFSET),
    decodeBase64(signSecretKeyBase64),
  );
  plain.set(sig, SIG_OFFSET);
  return plain;
}

/**
 * Seal a share message. Returns a fixed-length Uint8Array (WIRE_SIZE).
 */
export function sealShareMessage(
  epoch: number,
  dekBase64: string,
  type: ShareMessageType,
  counter: number,
  senderSignPublicKey: string,
  signSecretKeyBase64: string,
  location?: { latitude: number; longitude: number; accuracyMeters: number },
): Uint8Array {
  ensurePRNG();
  const plain = buildPlaintext(
    type,
    counter,
    senderSignPublicKey,
    location?.latitude,
    location?.longitude,
    location?.accuracyMeters ?? 0,
    signSecretKeyBase64,
  );
  const nonce = nacl.randomBytes(NONCE_SIZE);
  const cipher = nacl.secretbox(plain, nonce, decodeBase64(dekBase64));

  const wire = new Uint8Array(WIRE_SIZE);
  wire[0] = 1; // framing version
  const dv = new DataView(wire.buffer);
  dv.setUint16(1, epoch & 0xffff, false);
  wire.set(nonce, 3);
  wire.set(cipher, WIRE_HEADER_SIZE);
  return wire;
}

// Open (receiver side)

export const ShareCryptoError = {
  BAD_LENGTH: "bad-length",
  BAD_VERSION: "bad-version",
  BAD_EPOCH: "bad-epoch",
  DECRYPT_FAILED: "decrypt-failed",
  BAD_MAGIC: "bad-magic",
  BAD_SIGNATURE: "bad-signature",
} as const;

export function openShareMessage(
  wire: Uint8Array,
  epoch: number,
  dekBase64: string,
  allowedSenders: Set<string>,
): ParsedShareMessage {
  if (wire.length !== WIRE_SIZE) throw new Error(ShareCryptoError.BAD_LENGTH);
  if (wire[0] !== 1) throw new Error(ShareCryptoError.BAD_VERSION);
  const dv = new DataView(wire.buffer, wire.byteOffset, wire.byteLength);
  const wireEpoch = dv.getUint16(1, false);
  if (wireEpoch !== epoch) throw new Error(ShareCryptoError.BAD_EPOCH);

  const nonce = wire.subarray(3, 3 + NONCE_SIZE);
  const cipher = wire.subarray(WIRE_HEADER_SIZE);

  const opened = nacl.secretbox.open(cipher, nonce, decodeBase64(dekBase64));
  if (!opened) throw new Error(ShareCryptoError.DECRYPT_FAILED);

  for (let i = 0; i < MAGIC.length; i++) {
    if (opened[i] !== MAGIC[i]) throw new Error(ShareCryptoError.BAD_MAGIC);
  }

  const sig = opened.subarray(SIG_OFFSET);
  const senderSpkB64 = encodeBase64(opened.subarray(OFF_SPK, OFF_SPK + 32));
  if (!allowedSenders.has(senderSpkB64)) {
    throw new Error(ShareCryptoError.BAD_SIGNATURE);
  }
  const sigOk = nacl.sign.detached.verify(
    opened.subarray(0, SIG_OFFSET),
    sig,
    decodeBase64(senderSpkB64),
  );
  if (!sigOk) throw new Error(ShareCryptoError.BAD_SIGNATURE);

  const dataDv = new DataView(
    opened.buffer,
    opened.byteOffset,
    opened.byteLength,
  );
  const type = opened[OFF_TYPE] as ShareMessageType;
  const counter = dataDv.getUint32(OFF_COUNTER, false);

  if (type === MSG_POSITION) {
    return {
      type,
      counter,
      senderSignPublicKey: senderSpkB64,
      hasPosition: true,
      latitude: dataDv.getFloat64(OFF_LAT, false),
      longitude: dataDv.getFloat64(OFF_LON, false),
      accuracyMeters: dataDv.getFloat32(OFF_ACC, false),
    };
  }
  return {
    type,
    counter,
    senderSignPublicKey: senderSpkB64,
    hasPosition: false,
  };
}

// Base64 wrappers
export function wireToBase64(wire: Uint8Array): string {
  return encodeBase64(wire);
}

export function wireFromBase64(b64: string): Uint8Array {
  return decodeBase64(b64);
}
