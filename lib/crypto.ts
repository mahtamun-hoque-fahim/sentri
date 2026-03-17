/**
 * Sentri Crypto Library
 * All encryption/decryption happens client-side.
 * The server NEVER sees plaintext.
 */

const PBKDF2_ITERATIONS = 600_000;

// ─── Key Derivation ──────────────────────────────────────────────────────────

export async function deriveKey(
  masterPassword: string,
  secretKey: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const combined = masterPassword + ":" + secretKey;

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(combined),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Encrypt ─────────────────────────────────────────────────────────────────

export async function encryptData(
  key: CryptoKey,
  data: object | string
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  const encoded = new TextEncoder().encode(payload);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encoded
  );

  return {
    ciphertext: uint8ToBase64(new Uint8Array(encrypted)),
    iv: uint8ToBase64(iv),
  };
}

// ─── Decrypt ─────────────────────────────────────────────────────────────────

export async function decryptData<T = unknown>(
  key: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<T> {
  const ivBytes = base64ToUint8(iv);
  const data    = base64ToUint8(ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );

  const text = new TextDecoder().decode(decrypted);
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// ─── Secret Key Generation ───────────────────────────────────────────────────

export function generateSecretKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
  return (hex.match(/.{1,4}/g) ?? []).join("-");
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

// ─── Password Generator ──────────────────────────────────────────────────────

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function generatePassword(opts: GeneratorOptions): string {
  const sets: string[] = [];
  if (opts.uppercase) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (opts.lowercase) sets.push("abcdefghijklmnopqrstuvwxyz");
  if (opts.numbers)   sets.push("0123456789");
  if (opts.symbols)   sets.push("!@#$%^&*()-_=+[]{}|;:,.<>?");

  if (sets.length === 0) return "";

  const charset = sets.join("");
  const bytes   = crypto.getRandomValues(new Uint8Array(opts.length * 2));
  let result    = "";

  for (let i = 0; i < bytes.length && result.length < opts.length; i++) {
    result += charset[bytes[i] % charset.length];
  }

  // Ensure at least one character from each set
  const guaranteed = sets.map((set) => {
    const b = crypto.getRandomValues(new Uint8Array(1));
    return set[b[0] % set.length];
  });

  const arr = result.split("");
  guaranteed.forEach((ch, i) => { arr[i] = ch; });

  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint8Array(1))[0] % (i + 1);
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }

  return arr.join("");
}

// ─── Password Strength ───────────────────────────────────────────────────────

export type StrengthLevel = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

export function getPasswordStrength(password: string): {
  level: StrengthLevel;
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { level: "very-weak", score: 0, label: "Empty", color: "#D93025" };

  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score += 2;

  const levels: Array<{ level: StrengthLevel; label: string; color: string }> = [
    { level: "very-weak",   label: "Very Weak",   color: "#D93025" },
    { level: "very-weak",   label: "Very Weak",   color: "#D93025" },
    { level: "weak",        label: "Weak",        color: "#EA8C35" },
    { level: "weak",        label: "Weak",        color: "#EA8C35" },
    { level: "fair",        label: "Fair",        color: "#F9D74C" },
    { level: "fair",        label: "Fair",        color: "#F9D74C" },
    { level: "strong",      label: "Strong",      color: "#006341" },
    { level: "very-strong", label: "Very Strong", color: "#004D32" },
    { level: "very-strong", label: "Very Strong", color: "#004D32" },
  ];

  const entry = levels[Math.min(score, 8)];
  return { ...entry, score };
}

// ─── Utils ───────────────────────────────────────────────────────────────────

export function uint8ToBase64(arr: Uint8Array): string {
  return btoa(Array.from(arr).map((b) => String.fromCharCode(b)).join(""));
}

export function base64ToUint8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
