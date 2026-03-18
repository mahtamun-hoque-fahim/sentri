-- ============================================================
-- Sentri — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────
-- Extends Supabase auth.users. All crypto fields are base64.
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT UNIQUE NOT NULL,
  secret_key_hint       TEXT,                     -- Last 4 chars of secret key
  encrypted_vault_key   TEXT NOT NULL,            -- AES-256-GCM encrypted canary
  vault_key_salt        TEXT NOT NULL,            -- PBKDF2 salt (base64)
  vault_key_iv          TEXT NOT NULL,            -- AES-GCM IV for vault key (base64)
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ─── Vaults ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vaults (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Personal',
  vault_type  TEXT NOT NULL DEFAULT 'personal' CHECK (vault_type IN ('personal', 'shared')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vaults"
  ON vaults FOR ALL
  USING (owner_id = auth.uid());

-- ─── Vault Items ─────────────────────────────────────────────
-- All sensitive data is stored as AES-256-GCM ciphertext.
-- The server never sees plaintext.
CREATE TABLE IF NOT EXISTS vault_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id         UUID REFERENCES vaults(id) ON DELETE CASCADE,
  owner_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type        TEXT NOT NULL CHECK (item_type IN ('login','card','note','ssh_key','api_credential')),
  encrypted_data   TEXT NOT NULL,   -- AES-256-GCM encrypted JSON blob
  iv               TEXT NOT NULL,   -- AES-GCM IV for encrypted_data (base64)
  title_encrypted  TEXT NOT NULL,   -- AES-256-GCM encrypted title
  title_iv         TEXT NOT NULL,   -- AES-GCM IV for title (base64)
  favicon_url      TEXT,            -- Non-sensitive: Google favicon CDN URL
  last_used_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own items"
  ON vault_items FOR ALL
  USING (owner_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vault_items_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Item History ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_data  TEXT NOT NULL,
  iv              TEXT NOT NULL,
  changed_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE item_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own item history"
  ON item_history FOR ALL
  USING (owner_id = auth.uid());

-- ─── Sessions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_name  TEXT,
  ip_address   TEXT,
  user_agent   TEXT,
  last_active  TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own sessions"
  ON sessions FOR ALL
  USING (user_id = auth.uid());

-- ─── Secure Shares ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secure_shares (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id              UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
  created_by           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_share_data TEXT NOT NULL,   -- Re-encrypted item data for share link
  share_iv             TEXT NOT NULL,
  expires_at           TIMESTAMPTZ NOT NULL,
  view_count           INT DEFAULT 0,
  max_views            INT DEFAULT 1,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE secure_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage shares"
  ON secure_shares FOR ALL
  USING (created_by = auth.uid());

-- Public can read non-expired shares (for share link recipients)
CREATE POLICY "Public can read valid shares"
  ON secure_shares FOR SELECT
  USING (expires_at > NOW() AND view_count < max_views);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vault_items_owner     ON vault_items (owner_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_type      ON vault_items (item_type);
CREATE INDEX IF NOT EXISTS idx_vault_items_updated   ON vault_items (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_history_item_id  ON item_history (item_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id      ON sessions (user_id);

-- ============================================================
-- Phase 2 additions — run these if upgrading from Phase 1
-- ============================================================

-- Ensure item_history owner_id column exists with RLS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'item_history' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE item_history ADD COLUMN owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Auto-populate owner_id on insert from auth.uid()
CREATE OR REPLACE FUNCTION set_item_history_owner()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS item_history_set_owner ON item_history;
CREATE TRIGGER item_history_set_owner
  BEFORE INSERT ON item_history
  FOR EACH ROW EXECUTE FUNCTION set_item_history_owner();

-- Sessions: auto-log on sign-in via trigger
-- (Alternatively populate from your app's sign-in flow)

-- ============================================================
-- Phase 3 additions
-- ============================================================

-- ─── Vault Members ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id   UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','editor','viewer')),
  -- ECDH-wrapped vault symmetric key for this member
  encrypted_vault_key TEXT,
  wrap_iv             TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vault_id, user_id)
);

ALTER TABLE vault_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see their memberships"
  ON vault_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Vault owners manage members"
  ON vault_members FOR ALL
  USING (
    vault_id IN (SELECT id FROM vaults WHERE owner_id = auth.uid())
  );

-- ─── Vault Invites ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_invites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id   UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vault_invites ENABLE ROW LEVEL SECURITY;

-- Auto-set created_by
CREATE OR REPLACE FUNCTION set_invite_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS vault_invites_set_creator ON vault_invites;
CREATE TRIGGER vault_invites_set_creator
  BEFORE INSERT ON vault_invites
  FOR EACH ROW EXECUTE FUNCTION set_invite_created_by();

-- Vault owner can manage invites they created
CREATE POLICY "Owners manage invites"
  ON vault_invites FOR ALL
  USING (created_by = auth.uid());

-- Invitees can see and update their own pending invites
CREATE POLICY "Invitees see their invites"
  ON vault_invites FOR SELECT
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Invitees update their invites"
  ON vault_invites FOR UPDATE
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vault_members_vault ON vault_members (vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_members_user  ON vault_members (user_id);
CREATE INDEX IF NOT EXISTS idx_vault_invites_vault ON vault_invites (vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_invites_email ON vault_invites (email);
