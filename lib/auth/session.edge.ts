/**
 * Edge Runtime-compatible session verification.
 * Uses Web Crypto API (crypto.subtle) — NO Node.js APIs, NO Prisma.
 * Imported ONLY by middleware.ts (Edge Runtime).
 * For server-side signing/seeding, use lib/auth/session.ts (Node.js runtime).
 */

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "commerceos_default_secure_session_secret_2026_key";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  workspaceId: string;
  expiresAt: string;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

/** Decode a base64 string to UTF-8 (Edge-safe, ASCII session data only) */
function decodeBase64(b64: string): string {
  // atob is available in the Edge Runtime
  const binary = atob(b64);
  return binary;
}

/** Hex string → Uint8Array<ArrayBuffer> (Edge-safe) */
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const pairs = hex.match(/.{2}/g);
  if (!pairs) return new Uint8Array(new ArrayBuffer(0));
  const buf = new ArrayBuffer(pairs.length);
  const view = new Uint8Array(buf);
  pairs.forEach((byte, index) => { view[index] = parseInt(byte, 16); });
  return view;
}

/**
 * Verify a session token in the Edge Runtime.
 * Returns the payload on success, or null if invalid/expired.
 */
export async function verifySessionEdge(
  token: string
): Promise<SessionPayload | null> {
  if (!token) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const dataPart = token.slice(0, lastDot);
  const sigHex = token.slice(lastDot + 1);

  try {
    const key = await importHmacKey(SESSION_SECRET);
    const sigBytes = hexToBytes(sigHex);
    const dataBytes = new TextEncoder().encode(dataPart);

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valid) return null;

    const json = decodeBase64(dataPart);
    const payload = JSON.parse(json) as SessionPayload;

    // Check expiry
    if (payload.expiresAt && new Date(payload.expiresAt) < new Date()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
