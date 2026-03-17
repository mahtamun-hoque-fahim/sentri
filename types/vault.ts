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

// ─── DB Row ──────────────────────────────────────────────────────────────────

export interface VaultItemRow {
  id: string;
  vault_id: string;
  owner_id: string;
  item_type: ItemType;
  encrypted_data: string;
  iv: string;
  title_encrypted: string;
  title_iv: string;
  favicon_url: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Decrypted item (in memory only) ─────────────────────────────────────────

export interface DecryptedVaultItem {
  id: string;
  title: string;
  item_type: ItemType;
  favicon_url: string | null;
  created_at: string;
  updated_at: string;
  data: VaultItemData;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  secret_key_hint: string | null;
  encrypted_vault_key: string;
  vault_key_salt: string;
  vault_key_iv: string;
  created_at: string;
}

// ─── Password strength ───────────────────────────────────────────────────────

export type PasswordStrength = "very-weak" | "weak" | "fair" | "strong" | "very-strong";
