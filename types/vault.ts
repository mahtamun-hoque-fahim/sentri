// ─── Vault Item Types ─────────────────────────────────────────────────────────

export type ItemType = "login" | "card" | "note" | "ssh_key" | "api_credential";

export interface LoginItem {
  type: "login";
  username: string;
  password: string;
  totp_secret?: string;
  urls: string[];
  notes?: string;
  custom_fields?: CustomField[];
}

export interface CardItem {
  type: "card";
  cardholder_name: string;
  number: string;
  expiry: string;
  cvv: string;
  pin?: string;
  notes?: string;
}

export interface SecureNoteItem {
  type: "note";
  content: string;
}

export interface SSHKeyItem {
  type: "ssh_key";
  private_key: string;
  public_key: string;
  passphrase?: string;
  fingerprint?: string;
}

export interface APICredentialItem {
  type: "api_credential";
  credential_type: "api_key" | "token" | "secret";
  key: string;
  hostname?: string;
  notes?: string;
}

export type VaultItemData =
  | LoginItem
  | CardItem
  | SecureNoteItem
  | SSHKeyItem
  | APICredentialItem;

export interface CustomField {
  label: string;
  value: string;
  secret: boolean;
}

// ─── DB Row (camelCase — matches Drizzle ORM output) ─────────────────────────

export interface VaultItemRow {
  id: string;
  vaultId: string;
  ownerId: string;
  itemType: ItemType;
  encryptedData: string;
  iv: string;
  titleEncrypted: string;
  titleIv: string;
  faviconUrl: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Decrypted item (in memory only) ─────────────────────────────────────────

export interface DecryptedVaultItem {
  id: string;
  title: string;
  itemType: ItemType;
  faviconUrl: string | null;
  createdAt: string;
  updatedAt: string;
  data: VaultItemData;
}

// ─── Profile (camelCase — matches Drizzle ORM output) ────────────────────────

export interface Profile {
  clerkUserId: string;
  email: string;
  secretKeyHint: string | null;
  encryptedVaultKey: string;
  vaultKeySalt: string;
  vaultKeyIv: string;
  createdAt: string;
}

// ─── Password strength ───────────────────────────────────────────────────────

export type PasswordStrength = "very-weak" | "weak" | "fair" | "strong" | "very-strong";
