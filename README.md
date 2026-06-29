# Sentri

Intelligent password manager for your trusted circle.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Neon (PostgreSQL) + Drizzle ORM
- Better Auth (email/password + OTP)
- Web Crypto API — AES-256-GCM + PBKDF2-SHA256
- Turborepo + PNPM workspaces
- Vercel (primary) + Cloudflare Workers via `@opennextjs/cloudflare` (secondary)

## Prerequisites

- Node 20+
- PNPM 9+
- A Neon project (two connection strings — pooled + unpooled)
- Vercel account
- Cloudflare account + `wrangler` CLI

## Local setup

1. Clone: `git clone https://github.com/mahtamun-hoque-fahim/sentri`
2. Install: `pnpm install`
3. Copy `.env.example` to `.env.local` and fill in values (see PLANNER.md → Env Vars)
4. Push schema: `pnpm db:push`
5. Run dev: `pnpm dev`

## Env vars

See PLANNER.md → Env Vars for descriptions. Names only:

```
DATABASE_URL
DATABASE_URL_UNPOOLED
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NEXT_PUBLIC_APP_URL
RESEND_API_KEY
ADMIN_USER_IDS
```

## Scripts

```bash
pnpm dev                  # local dev (Turbopack)
pnpm build                # production build
pnpm start                # serve production build
pnpm lint                 # ESLint
pnpm typecheck            # tsc --noEmit
pnpm db:push              # push schema to Neon (dev only)
pnpm db:generate          # generate migration from schema
pnpm db:migrate           # apply migrations (production)
```

## Deploy

- Push to `main` → Vercel auto-deploys
- `wrangler deploy` → Cloudflare Workers
- Verify env vars are set in BOTH Vercel and Cloudflare dashboards before any production deploy

## Folder structure

```
app/              routes (App Router)
components/       UI primitives and features
lib/              auth, db, api helpers
packages/crypto/  shared PBKDF2 + AES-256-GCM primitives (monorepo)
store/            Zustand stores
public/fonts/     Clash Display woff2 files (self-hosted)
extension/        browser extension (links packages/crypto)
```

See PLANNER.md → Architecture for full detail.
