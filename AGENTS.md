# Sentri

Intelligent password manager for your trusted circle — zero-knowledge encrypted vault with breach detection, circle sharing, and member perks.

## Setup & Commands

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Type check: `pnpm typecheck`
- DB push (dev only): `pnpm db:push`
- DB generate: `pnpm db:generate`
- DB migrate (production): `pnpm db:migrate`
- CF deploy: `wrangler deploy`

## Conventions & Non-Negotiables

- No emojis anywhere in code or UI — Lucide React icons only
- Dual deploy target: Vercel (primary) + Cloudflare Workers via `@opennextjs/cloudflare` — every route must be Edge Runtime compatible
- Auth: Better Auth — session checked server-side via `auth.api.getSession()`, never client-only. This is a rebuild; old Sentri used Clerk — do not port Clerk patterns.
- Zero-knowledge hard constraint: the vault key is derived client-side from the master password via PBKDF2-SHA256 (600k iterations) in a Web Worker. It lives in Zustand memory only. It must NEVER be sent to the server, stored in localStorage, cookies, or any persistent client storage.
- Shared crypto: all PBKDF2 and AES-256-GCM primitives live in `packages/crypto`. The extension and the web app both import from there. Never duplicate crypto code.
- AES-256-GCM nonce: each encryption operation generates a fresh 12-byte IV via `crypto.getRandomValues()`. The IV is stored alongside the ciphertext in `vault_items.iv`. Never reuse an IV.
- Breach checking: HIBP k-anonymity only. Send the first 5 chars of the SHA-1 hash to `/api/breach/check`, which proxies to HIBP. Never send the full hash to the server.
- Share link decryption key lives in the URL fragment (`#key`) only — it is never sent to or stored by the server.
- Dark mode only. No light mode. No toggle.

## Security Gotchas

- `.env.local` is never committed. If a secret leaks into git history or chat, rotate it immediately.
- `ADMIN_USER_IDS` env var controls admin access — verify this is set correctly on every deploy target.
- Emergency kit PDF must be generated entirely client-side — no master password or vault key ever touches the server, even transiently.
- Share links expire in 1 hour by default. Do not extend this default without Fahim's explicit approval.
- The `vaultKeySalt` column stores the PBKDF2 salt, not the key. The `vaultKeyVerificationHash` column stores a verification hash, not the key. Both are safe to store server-side. The key itself is never stored anywhere.

## Session Log

(Newest first. Max 10 entries — drop oldest on overflow.)

### 2026-06-29
- Did: Full pipeline run — Singularity interview, tree-man (22-route SITETREE.md), Council PRE-BUILD, repo-maintainer scaffold
- Decided: Monorepo (Turborepo + PNPM workspaces) for shared crypto between web app and extension. Better Auth replaces Clerk. Perks/affiliate layer first-class from day one.
- Council flagged: unlock UX double-auth problem, Web Worker requirement for PBKDF2, Better Auth + CF Workers POC needed before build starts, freemium line undefined.
- Next: Design unlock UX wireframe, initialize Turborepo monorepo, run Better Auth + CF Workers POC
