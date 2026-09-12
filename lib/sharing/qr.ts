import {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8,
} from "tweetnacl-util";

// QR pairing payloads. Two-step, out-of-band flow (mirrors how messenger
// apps pair linked devices – scan in person, never forward screenshots):
//
//   1. Member  shows identity QR = public keys + display name (safe)
//   2. Admin scans it, wraps the family DEK to that member, shows invite QR
//      Invite QR contains ONLY (familyId + DEK wrapped to the member + admin
//      public keys). A screenshot of an invite can never decrypt anything:
//      unwrapping needs the member's box secret key, which never leaves the
//      member's device.
//
// The channel name is NOT put into any QR; every participant derives it from
// familyId + DEK on their own device (see deriveChannelName).

export const QR_PREFIX = "ATLASYS-SHARE:v1:";

export type IdentityPayload = {
  v: 1;
  /** sign public key, base64 */
  k: string;
  /** box public key, base64 */
  b: string;
  /** display name (optional, public) */
  n?: string;
};

export type InvitePayload = {
  v: 1;
  /** family id, hex */
  f: string;
  /** DEK wrapped to the scanned member via nacl.box */
  w: {
    n: string; // nonce, base64
    c: string; // box ciphertext, base64
  };
  /** admin device keys so the member can add them to their roster */
  a: {
    k: string; // sign public key, base64
    b: string; // box public key, base64
    n?: string; // admin display name
  };
};

export type QrPayload =
  | { kind: "identity"; data: IdentityPayload }
  | { kind: "invite"; data: InvitePayload };

function b64UrlSafeEncode(input: string): string {
  return encodeBase64(decodeUTF8(input))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
function b64UrlSafeDecode(input: string): string {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return encodeUTF8(decodeBase64(s));
}

export function encodeIdentityQr(payload: IdentityPayload): string {
  return QR_PREFIX + b64UrlSafeEncode(JSON.stringify(payload));
}

export function encodeInviteQr(payload: InvitePayload): string {
  return QR_PREFIX + b64UrlSafeEncode(JSON.stringify(payload));
}

export function decodeQr(content: string): QrPayload | null {
  if (!content.startsWith(QR_PREFIX)) return null;
  const raw = content.slice(QR_PREFIX.length);
  try {
    const obj = JSON.parse(b64UrlSafeDecode(raw)) as
      | (IdentityPayload & { b: string })
      | InvitePayload;
    if (obj.v !== 1) return null;
    // invite carries a wrapped DEK + admin keys; identity does not
    if ((obj as InvitePayload).w && (obj as InvitePayload).a) {
      return { kind: "invite", data: obj as InvitePayload };
    }
    if ((obj as IdentityPayload).k && (obj as IdentityPayload).b) {
      return { kind: "identity", data: obj as IdentityPayload };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseQrContent(content: string): QrPayload | null {
  return decodeQr(content);
}
