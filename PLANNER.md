# Sentri — Planner

> Intelligent password manager for your trusted circle — the one you'd actually recommend to a friend.

## Project Overview

**Purpose.** Most password managers are secure but nobody wants to use them. Bitwarden is ugly, breach checking is paywalled, sharing is awkward, and nobody rewards users for being secure. Sentri fixes all four: clean UI, free breach checking, frictionless circle sharing, and a perks layer that gives something back to members.

**Target user.** Fahim and a small circle of trusted friends. Eventual public release. Primary acquisition target: people who have never set up a password manager — zero switching cost, no Bitwarden inertia.

**Key value.** The password manager someone uninstalls Bitwarden for — not because it's more secure on paper, but because it feels better to use and gives something back.

**Current phase.** Planning

---

## Architecture

**Stack:**
- Framework: Next.js 16 App Router
- Language: TypeScript (strict)
- Styling: Tailwind CSS v4 + CSS variables
- Database: Neon (PostgreSQL)
- ORM: Drizzle ORM
- Auth: Better Auth (email/password + email OTP)
- Encryption: Web Crypto API — AES-256-GCM + PBKDF2-SHA256 (600k iterations)
- State: Zustand (vault store, unlock state)
- Icons: Lucide React
- Email: Resend
- Deployment: Vercel (primary) + Cloudflare Workers via `@opennextjs/cloudflare` (secondary)

**Deployment topology:**
- `main` → Vercel production
- PRs → Vercel preview
- `main` → Cloudflare Workers production (mirror via `@opennextjs/cloudflare`)

**Monorepo structure (pre-build decision):**
- `/` — Next.js web app
- `/packages/crypto` — shared crypto library (PBKDF2 + AES-256-GCM primitives, shared between web app and extension)
- `/extension` — browser extension (separate but monorepo-linked — see sentri-extension repo)
- Decision: Turborepo + PNPM workspaces. The crypto library is the hard dependency — it must never be duplicated.

**Folder structure (summary):**
```
app/
  (auth)/           signin, signup, unlock, onboarding
  (app)/            dashboard and children
  share/[token]/    public share view
  admin/            admin dashboard and children
  api/              route handlers
components/
  layout/           nav, sidebar, shell
  vault/            vault item cards, forms, type icons
  ui/               primitives (button, input, badge, card, modal)
  sharing/          share link UI
  circle/           circle member cards, invite flow
lib/
  auth/             Better Auth config
  db/               Drizzle schema + client
  crypto/           re-exports from packages/crypto
  api/              typed fetch helpers
packages/
  crypto/           shared PBKDF2 + AES-256-GCM primitives
store/
  vault.ts          Zustand vault store
  unlock.ts         Zustand unlock/session store
```

---

## User Flows

### Flow 1: New user signs up and creates vault
1. User lands on `/`
2. Clicks "Get started"
3. `/signup` — enters email → Better Auth creates account, sends OTP
4. Verifies OTP → session created
5. `/onboarding` — prompted to set master password
6. Client derives vault key via PBKDF2-SHA256 (600k iterations, random salt) in a Web Worker
7. Key verification hash stored server-side (not the key — never the key)
8. Prompted to download emergency kit PDF (client-side generated)
9. Prompted to install browser extension
10. Redirected to `/dashboard` with empty vault + single CTA: "Add your first login"

### Flow 2: Returning user unlocks vault
1. User opens app → Better Auth session checked → valid
2. `/unlock` — prompted for master password
3. Client re-derives vault key via PBKDF2 in Web Worker (3-8s on slow devices — loading state required)
4. Vault key stored in Zustand memory store (never persisted to localStorage or server)
5. Encrypted vault items fetched from server
6. Items decrypted client-side → vault store populated
7. Redirected to `/dashboard`

### Flow 3: Extension autofill
1. User visits a login form in browser
2. Extension detects credential fields
3. Extension pops up → prompts for master password if vault is locked
4. Derives vault key client-side → fetches encrypted items from API
5. Decrypts → matches hostname → autofills
6. Session persists in extension memory until browser is closed

### Flow 4: Share a vault item with circle
1. User opens a vault item on `/dashboard/[id]`
2. Clicks "Share"
3. Client encrypts a copy of the item with a one-time key (not the vault key)
4. POST /api/share — server stores encrypted payload, returns token
5. Client constructs share URL: `sentri.app/share/[token]#[decryption-key]`
6. Fragment (#key) never sent to server — zero-knowledge share
7. User copies link and sends to circle member
8. Link expires in 1 hour by default

### Flow 5: Breach check (Watchtower)
1. User navigates to `/dashboard/watchtower`
2. Client takes the password for each vault item
3. Hashes with SHA-1, sends first 5 chars to `/api/breach/check` (k-anonymity proxy)
4. Server queries HIBP range API, returns matching suffix hashes
5. Client checks full hash against returned list — never sends full hash to server or HIBP
6. Breached items flagged with count

### Flow 6: Admin monitors platform
1. Admin navigates to `/admin`
2. Sees: total users, DAU/WAU/MAU, signups over time, feature usage
3. `/admin/users` — list with email, signup date, last active, item count, extension installed flag
4. `/admin/users/[id]` — metadata only, never vault contents
5. `/admin/perks` — create/edit/deactivate perks, track redemptions

---

## DB Schema

Drizzle schema lives in `lib/db/schema.ts`.

> Better Auth manages `users`, `sessions`, `accounts`, `verifications` tables automatically. Do not duplicate them. Extend the users table via Better Auth's `additionalFields` config.

### users (extended via Better Auth additionalFields)
| column | type | notes |
|---|---|---|
| extensionInstalled | boolean | default false |
| onboardingCompleted | boolean | default false |
| vaultKeySalt | text | random salt used for PBKDF2 — NOT the key |
| vaultKeyVerificationHash | text | for unlock verification — NOT the key |

### vault_items
| column | type | notes |
|---|---|---|
| id | text PK | nanoid |
| userId | text FK | → users.id |
| type | enum | login \| card \| note \| ssh_key \| api_key |
| name | text | encrypted — display name only, encrypted client-side |
| encryptedData | text | AES-256-GCM encrypted JSON blob of full item |
| iv | text | 12-byte IV for this item's encryption, base64 |
| createdAt | timestamp | defaultNow |
| updatedAt | timestamp | auto-update |

### circles
| column | type | notes |
|---|---|---|
| id | text PK | nanoid |
| ownerId | text FK | → users.id |
| name | text | default "My Circle" |
| createdAt | timestamp | defaultNow |

### circle_members
| column | type | notes |
|---|---|---|
| id | text PK | nanoid |
| circleId | text FK | → circles.id |
| userId | text FK | → users.id |
| invitedBy | text FK | → users.id |
| status | enum | pending \| active \| removed |
| joinedAt | timestamp | nullable until accepted |

### shared_links
| column | type | notes |
|---|---|---|
| id | text PK | nanoid — this IS the token in the URL |
| createdBy | text FK | → users.id |
| vaultItemId | text FK | → vault_items.id (for revocation reference) |
| encryptedPayload | text | encrypted item data — key is in URL fragment, never here |
| expiresAt | timestamp | default: createdAt + 1 hour |
| accessedAt | timestamp | null until first access |
| revoked | boolean | default false |
| createdAt | timestamp | defaultNow |

### perks
| column | type | notes |
|---|---|---|
| id | text PK | nanoid |
| title | text | |
| description | text | |
| affiliateUrl | text | |
| discountCode | text | nullable |
| category | text | |
| active | boolean | default true |
| createdAt | timestamp | defaultNow |

### perk_redemptions
| column | type | notes |
|---|---|---|
| id | text PK | nanoid |
| userId | text FK | → users.id |
| perkId | text FK | → perks.id |
| redeemedAt | timestamp | defaultNow |

---

## API Routes

> Better Auth handles all auth at `/api/auth/[...all]` automatically.

### Vault
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | /api/vault | session | — | `VaultItem[]` (encrypted blobs) |
| POST | /api/vault | session | `{ type, name, encryptedData, iv }` | `VaultItem` |
| GET | /api/vault/[id] | session + owner | — | `VaultItem` |
| PATCH | /api/vault/[id] | session + owner | `{ name?, encryptedData?, iv? }` | `VaultItem` |
| DELETE | /api/vault/[id] | session + owner | — | `{ ok: true }` |

### Breach / Watchtower
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | /api/breach/check | session | `?prefix=[5-char SHA1 prefix]` | `string` (HIBP suffix list, raw) |

### Sharing
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | /api/share | session | `{ vaultItemId, encryptedPayload, expiresInMinutes? }` | `{ token: string }` |
| GET | /api/share/[token] | public | — | `{ encryptedPayload, expiresAt }` |
| DELETE | /api/share/[token] | session + creator | — | `{ ok: true }` |
| GET | /api/share | session | — | `SharedLink[]` (user's outgoing links) |

### Circle
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | /api/circle | session | — | `Circle + CircleMember[]` |
| POST | /api/circle/invite | session | `{ email }` | `{ ok: true }` |
| PATCH | /api/circle/members/[id] | session | `{ status: 'active' \| 'removed' }` | `CircleMember` |

### Perks
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | /api/perks | session | — | `Perk[]` |
| POST | /api/perks/redeem | session | `{ perkId }` | `{ ok: true }` |

### Admin
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | /api/admin/users | admin | `?page&search` | `User[]` (no vault data) |
| GET | /api/admin/users/[id] | admin | — | `User` (metadata only) |
| GET | /api/admin/analytics | admin | `?period` | `AnalyticsSnapshot` |
| GET | /api/admin/perks | admin | — | `Perk[]` |
| POST | /api/admin/perks | admin | `{ title, description, affiliateUrl, discountCode?, category }` | `Perk` |
| PATCH | /api/admin/perks/[id] | admin | `{ active?, title?, ... }` | `Perk` |

---

## Env Vars

| Name | Required | Description | Example |
|---|---|---|---|
| DATABASE_URL | yes | Neon pooled connection | `postgresql://...?sslmode=require` |
| DATABASE_URL_UNPOOLED | yes | Neon direct connection (migrations) | `postgresql://...?sslmode=require` |
| BETTER_AUTH_SECRET | yes | Session signing secret (32+ chars) | `openssl rand -base64 32` |
| BETTER_AUTH_URL | yes | Public app URL | `https://sentri.app` |
| NEXT_PUBLIC_APP_URL | yes | Same, client-readable | `https://sentri.app` |
| RESEND_API_KEY | yes | Transactional email (OTP, breach alerts) | `re_...` |
| ADMIN_USER_IDS | yes | Comma-separated user IDs with admin role | `user_abc123` |

---

## Timeline / Phases

### Phase 0 — Pre-build decisions (Council to-dos)
Status: `[~]` in progress

- [x] Singularity interview complete — BRAIN.md committed
- [x] tree-man complete — SITETREE.md committed (22 routes)
- [x] Council PRE-BUILD complete — 14 to-dos gathered
- [ ] Design unlock UX and loading states before touching auth code
- [ ] Define monorepo structure (Turborepo + PNPM workspaces)
- [ ] Define freemium line (2-3 features behind $2-3/mo tier)
- [ ] Run Better Auth + Cloudflare Workers proof-of-concept
- [ ] Write share link security model one-pager
- [ ] Document AES-256-GCM IV/nonce management strategy

### Phase 1 — Foundation
Status: `[ ]` pending

- [ ] Repo initialized — Next.js 16, TypeScript, Tailwind v4, Turborepo
- [ ] `packages/crypto` created — PBKDF2 + AES-256-GCM primitives with Web Worker wrapper
- [ ] Neon project created, Drizzle schema applied
- [ ] Better Auth configured — email/password + OTP, role enum (user | admin)
- [ ] Middleware protecting `/dashboard/*`, `/unlock`, `/onboarding`, `/admin/*`
- [ ] CF Workers POC confirmed working (Better Auth session, Neon HTTP driver)
- [ ] `.env.example` committed

### Phase 2 — Auth + Vault Core
Status: `[ ]` pending

- [ ] Sign up flow — email OTP verified, onboarding redirect
- [ ] Onboarding — master password set, PBKDF2 Web Worker, salt stored, emergency kit PDF (client-side)
- [ ] Unlock screen — master password → Web Worker derivation → vault key in Zustand, loading state
- [ ] Vault CRUD — all 5 item types (login, card, note, ssh_key, api_key)
- [ ] Dashboard — list view, search, filter by type
- [ ] Individual item view/edit at `/dashboard/[id]`
- [ ] Password generator — `/dashboard/generator`

### Phase 3 — Extension + Sharing
Status: `[ ]` pending

- [ ] Browser extension scaffolded (sentri-extension repo, links to `packages/crypto`)
- [ ] Extension autofill — detect credential fields, prompt unlock, match hostname, fill
- [ ] Share link creation — one-time key, encrypted payload, token + fragment URL
- [ ] Share link public view — `/share/[token]` — client-side decryption from fragment
- [ ] Share link management — `/dashboard/sharing`
- [ ] Extension install prompt in onboarding

### Phase 4 — Circle + Watchtower + Perks
Status: `[ ]` pending

- [ ] Circle management — `/dashboard/circle` — invite by email, accept, remove
- [ ] Watchtower — `/dashboard/watchtower` — HIBP k-anonymity breach check + weak password scan
- [ ] Proactive breach alert emails via Resend
- [ ] Perks page — `/dashboard/perks` — browse and redeem
- [ ] Admin perks management — `/admin/perks`

### Phase 5 — Import + Admin
Status: `[ ]` pending

- [ ] CSV import — `/dashboard/import` — Bitwarden, 1Password, LastPass, Chrome
- [ ] Admin dashboard — `/admin` — metrics overview
- [ ] Admin user list — `/admin/users` and `/admin/users/[id]`
- [ ] Admin analytics — `/admin/analytics`

### Phase 6 — Polish + Launch
Status: `[ ]` pending

- [ ] Waterborne (emoji sweep)
- [ ] motion-hive (animation audit)
- [ ] valley-of-death (spec vs code audit)
- [ ] Sentinel (security audit)
- [ ] Airborne + Humanizer (SEO + copy)
- [ ] cave-man (visual opportunity audit)
- [ ] Council POST-BUILD
- [ ] gh-meta RELEASE
- [ ] ticket-checker (final pre-deploy QA)

---

## Next Steps

In order:
1. Design unlock UX wireframe — the double-auth explanation copy, Web Worker loading state, error states
2. Initialize repo with Turborepo + PNPM workspaces — scaffold `packages/crypto`
3. Run Better Auth + Cloudflare Workers POC — confirm Edge-compatible session + Neon HTTP driver
4. Apply Drizzle schema to Neon
5. Commit BRAIN.md, SITETREE.md, PLANNER.md, DESIGN_GUIDE.md, README.md, AGENTS.md to repo

---

## Notes & Decisions

**2026-06-29.** Rebuilt from scratch. Original Sentri used Clerk + Next.js 15. Rebuild uses Better Auth + Next.js 16. Reason: pipeline standards, Better Auth is the stack default, Clerk is a dependency Fahim wants to eliminate across all projects.

**2026-06-29.** Council PRE-BUILD flagged that affiliate-only revenue won't sustain the product. Freemium line must be defined before launch. Candidates: vault item limit (free: unlimited, premium: advanced sharing), priority breach alerts (email, free: daily digest, premium: instant), advanced sharing (free: 1-hour expiry, premium: custom expiry + password-protected links).

**2026-06-29.** Monorepo decision: Turborepo + PNPM workspaces. The `packages/crypto` shared library is the hard constraint — extension and web app must share a single PBKDF2 + AES-256-GCM implementation, never duplicate it.

**2026-06-29.** Share link security: URL fragment (#key) for decryption key. Fragment is not sent to server by HTTP spec, but does appear in browser history and is readable by browser extensions with history permission. Default expiry set to 1 hour (not 24). Warning copy required at link creation. See share link security one-pager (to be written in Phase 0).
