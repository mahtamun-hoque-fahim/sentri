import {
  pgTable, text, timestamp, uuid, integer,
} from "drizzle-orm/pg-core";

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profiles = pgTable("profiles", {
  clerkUserId:       text("clerk_user_id").primaryKey(),
  email:             text("email").notNull().unique(),
  secretKeyHint:     text("secret_key_hint"),
  encryptedVaultKey: text("encrypted_vault_key").notNull(),
  vaultKeySalt:      text("vault_key_salt").notNull(),
  vaultKeyIv:        text("vault_key_iv").notNull(),
  createdAt:         timestamp("created_at").defaultNow(),
});

// ─── Vaults ───────────────────────────────────────────────────────────────────
export const vaults = pgTable("vaults", {
  id:        uuid("id").primaryKey().defaultRandom(),
  ownerId:   text("owner_id").notNull().references(() => profiles.clerkUserId, { onDelete: "cascade" }),
  name:      text("name").notNull().default("Personal"),
  vaultType: text("vault_type").notNull().default("personal"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Vault Items ──────────────────────────────────────────────────────────────
export const vaultItems = pgTable("vault_items", {
  id:              uuid("id").primaryKey().defaultRandom(),
  vaultId:         uuid("vault_id").references(() => vaults.id, { onDelete: "cascade" }),
  ownerId:         text("owner_id").notNull().references(() => profiles.clerkUserId, { onDelete: "cascade" }),
  itemType:        text("item_type").notNull(),
  encryptedData:   text("encrypted_data").notNull(),
  iv:              text("iv").notNull(),
  titleEncrypted:  text("title_encrypted").notNull(),
  titleIv:         text("title_iv").notNull(),
  faviconUrl:      text("favicon_url"),
  lastUsedAt:      timestamp("last_used_at"),
  createdAt:       timestamp("created_at").defaultNow(),
  updatedAt:       timestamp("updated_at").defaultNow(),
});

// ─── Item History ─────────────────────────────────────────────────────────────
export const itemHistory = pgTable("item_history", {
  id:            uuid("id").primaryKey().defaultRandom(),
  itemId:        uuid("item_id").notNull().references(() => vaultItems.id, { onDelete: "cascade" }),
  ownerId:       text("owner_id").notNull().references(() => profiles.clerkUserId, { onDelete: "cascade" }),
  encryptedData: text("encrypted_data").notNull(),
  iv:            text("iv").notNull(),
  changedAt:     timestamp("changed_at").defaultNow(),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const userSessions = pgTable("user_sessions", {
  id:          uuid("id").primaryKey().defaultRandom(),
  userId:      text("user_id").notNull().references(() => profiles.clerkUserId, { onDelete: "cascade" }),
  deviceName:  text("device_name"),
  ipAddress:   text("ip_address"),
  userAgent:   text("user_agent"),
  lastActive:  timestamp("last_active").defaultNow(),
  createdAt:   timestamp("created_at").defaultNow(),
});

// ─── Secure Shares ────────────────────────────────────────────────────────────
export const secureShares = pgTable("secure_shares", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  itemId:              uuid("item_id").notNull().references(() => vaultItems.id, { onDelete: "cascade" }),
  createdBy:           text("created_by").notNull().references(() => profiles.clerkUserId, { onDelete: "cascade" }),
  encryptedShareData:  text("encrypted_share_data").notNull(),
  shareIv:             text("share_iv").notNull(),
  expiresAt:           timestamp("expires_at").notNull(),
  viewCount:           integer("view_count").default(0),
  maxViews:            integer("max_views").default(1),
  createdAt:           timestamp("created_at").defaultNow(),
});

// ─── Vault Members ────────────────────────────────────────────────────────────
export const vaultMembers = pgTable("vault_members", {
  id:                uuid("id").primaryKey().defaultRandom(),
  vaultId:           uuid("vault_id").notNull().references(() => vaults.id, { onDelete: "cascade" }),
  userId:            text("user_id").notNull().references(() => profiles.clerkUserId, { onDelete: "cascade" }),
  role:              text("role").notNull().default("viewer"),
  encryptedVaultKey: text("encrypted_vault_key"),
  wrapIv:            text("wrap_iv"),
  createdAt:         timestamp("created_at").defaultNow(),
});

// ─── Vault Invites ────────────────────────────────────────────────────────────
export const vaultInvites = pgTable("vault_invites", {
  id:        uuid("id").primaryKey().defaultRandom(),
  vaultId:   uuid("vault_id").notNull().references(() => vaults.id, { onDelete: "cascade" }),
  email:     text("email").notNull(),
  status:    text("status").notNull().default("pending"),
  createdBy: text("created_by").notNull().references(() => profiles.clerkUserId, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});
