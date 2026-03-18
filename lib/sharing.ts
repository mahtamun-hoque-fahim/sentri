/**
 * Sentri Sharing Crypto Library
 *
 * Shared Vaults:  ECDH P-256 key exchange
 *   - Each user has an EC keypair generated on signup
 *   - Public key stored plaintext in profiles
 *   - Private key encrypted with vault key, stored in profiles
 *   - Shared vault key is ECDH-wrapped: owner derives shared secret with
 *     recipient's public key, uses it to AES-wrap the vault symmetric key
 *
 * Secure Share Links: random AES key in URL fragment
 *   - Random 256-bit AES key generated client-side
 *   - Item encrypted with that key, stored in secure_shares
 *   - Key embedded in URL fragment (#k=...) — never sent to server
 *   - Server enforces expiry + view count
 */

import { encryptData, decryptData, uint8ToBase64, base64ToUint8 } from "./crypto";

// ─── ECDH Keypair ─────────────────────────────────────────────────────────────

export async function generateECDHKeypair(): Promise<{
  publicKeyB64:  string;
  privateKeyB64: string;
}> {
  const keypair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  const pubRaw  = await crypto.subtle.exportKey("spki", keypair.publicKey);
  const privRaw = await crypto.subtle.exportKey("pkcs8", keypair.privateKey);

  return {
    publicKeyB64:  uint8ToBase64(new Uint8Array(pubRaw)),
    privateKeyB64: uint8ToBase64(new Uint8Array(privRaw)),
  };
}

export async function importPublicKey(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    base64ToUint8(b64).buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
}

export async function importPrivateKey(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    base64ToUint8(b64).buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey", "deriveBits"]
  );
}

// ─── ECDH Shared Secret → AES Wrapping Key ───────────────────────────────────

async function deriveSharedAESKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Wrap vault symmetric key for a recipient ─────────────────────────────────

/**
 * Takes the vault's symmetric CryptoKey, exports it as raw bytes,
 * then encrypts those bytes using the ECDH shared secret with the recipient.
 * Result is stored in vault_members.encrypted_vault_key
 */
export async function wrapVaultKeyForRecipient(
  vaultKey: CryptoKey,
  myPrivateKey: CryptoKey,
  recipientPublicKeyB64: string
): Promise<{ ciphertext: string; iv: string }> {
  const recipientPubKey = await importPublicKey(recipientPublicKeyB64);
  const sharedKey       = await deriveSharedAESKey(myPrivateKey, recipientPubKey);
  const rawVaultKey     = await crypto.subtle.exportKey("raw", vaultKey);
  return encryptData(sharedKey, uint8ToBase64(new Uint8Array(rawVaultKey)));
}

/**
 * Unwraps the vault key that was encrypted for us by the owner.
 */
export async function unwrapVaultKey(
  encryptedKey: string,
  iv: string,
  myPrivateKey: CryptoKey,
  ownerPublicKeyB64: string
): Promise<CryptoKey> {
  const ownerPubKey = await importPublicKey(ownerPublicKeyB64);
  const sharedKey   = await deriveSharedAESKey(myPrivateKey, ownerPubKey);
  const rawB64      = await decryptData<string>(sharedKey, encryptedKey, iv);
  const rawBytes    = base64ToUint8(rawB64 as unknown as string);

  return crypto.subtle.importKey(
    "raw",
    rawBytes.buffer as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Secure Share Links ───────────────────────────────────────────────────────

/**
 * Generates a random AES-256-GCM key for a share link.
 * The key goes in the URL fragment; the encrypted payload goes in the DB.
 */
export async function generateShareKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportShareKeyToFragment(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return uint8ToBase64(new Uint8Array(raw))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function importShareKeyFromFragment(fragment: string): Promise<CryptoKey> {
  // Re-pad base64url
  const b64 = fragment.replace(/-/g, "+").replace(/_/g, "/");
  const pad  = (4 - (b64.length % 4)) % 4;
  const raw  = base64ToUint8(b64 + "=".repeat(pad));
  return crypto.subtle.importKey(
    "raw",
    raw.buffer as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
