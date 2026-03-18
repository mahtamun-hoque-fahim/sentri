/**
 * Sentri TOTP Library
 * RFC 6238 — Time-based One-Time Password
 * Uses only the Web Crypto API (no external dependencies).
 */

// ─── Base32 decode ────────────────────────────────────────────────────────────

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input: string): Uint8Array {
  const str    = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  const output: number[] = [];
  let buffer   = 0;
  let bitsLeft = 0;

  for (const char of str) {
    const val = BASE32_CHARS.indexOf(char);
    if (val < 0) continue;
    buffer    = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      output.push((buffer >> bitsLeft) & 0xff);
    }
  }
  return new Uint8Array(output);
}

// ─── HOTP ─────────────────────────────────────────────────────────────────────

async function hotp(key: Uint8Array, counter: bigint): Promise<number> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  // counter as 8-byte big-endian
  const counterBuf = new ArrayBuffer(8);
  const view       = new DataView(counterBuf);
  view.setBigUint64(0, counter, false);

  const sig    = await crypto.subtle.sign("HMAC", cryptoKey, counterBuf);
  const arr    = new Uint8Array(sig);
  const offset = arr[arr.length - 1] & 0x0f;
  const code   = (
    ((arr[offset]     & 0x7f) << 24) |
    ((arr[offset + 1] & 0xff) << 16) |
    ((arr[offset + 2] & 0xff) << 8)  |
     (arr[offset + 3] & 0xff)
  );
  return code % 1_000_000;
}

// ─── TOTP ─────────────────────────────────────────────────────────────────────

const STEP = 30; // seconds

export async function generateTOTP(secret: string): Promise<{
  code:      string;
  remaining: number;   // seconds until next code
  progress:  number;   // 0–1, how far through current period
}> {
  const key     = base32Decode(secret);
  const epoch   = Math.floor(Date.now() / 1000);
  const counter = BigInt(Math.floor(epoch / STEP));
  const raw     = await hotp(key, counter);
  const code    = String(raw).padStart(6, "0");
  const elapsed = epoch % STEP;
  return {
    code,
    remaining: STEP - elapsed,
    progress:  elapsed / STEP,
  };
}

export function parseTOTPUri(uri: string): { secret: string; issuer: string; account: string } | null {
  try {
    const url     = new URL(uri);
    if (url.protocol !== "otpauth:") return null;
    const secret  = url.searchParams.get("secret") ?? "";
    const issuer  = url.searchParams.get("issuer") ?? url.pathname.split("/")[1] ?? "";
    const account = decodeURIComponent(url.pathname.split(":").pop() ?? "");
    return { secret, issuer, account };
  } catch {
    return null;
  }
}
