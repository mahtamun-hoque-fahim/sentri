# BRAIN.md — Sentri

> This file is maintained by the Singularity skill. It is the identity document of this project.
> When Claude drifts, hallucinates, or loses context — this file is the source of truth.
> Do not confuse this with PLANNER.md (tasks/phases) or DESIGN_GUIDE.md (design tokens).

---

## The One-Line Truth

Sentri is an intelligent password manager for your trusted circle — the one you'd actually recommend to a friend.

---

## Why It Exists

Most password managers are secure but nobody *wants* to use them. Bitwarden is free but ugly. 1Password is polished but expensive. Nobody has built something that feels genuinely good to open, rewards you for being secure, and works naturally for a small circle of people who trust each other. Sentri fills that gap — a clean, intelligent vault with breach detection free for everyone, perks for members, and sharing that works between people who actually know each other. It's also project 1 of 5 pipeline rebuilds — a high-complexity training ground for Fahim's full skill pipeline.

---

## What It Must Become

The password manager someone uninstalls Bitwarden for. Not because it's more secure on paper — because it feels better to use, gives something back, and was clearly built by someone who gives a damn about the experience.

---

## Core Decisions (Locked)

- [LOCKED] Zero-knowledge encryption — vault key derived locally via PBKDF2-SHA256, AES-256-GCM; never sent to server. Non-negotiable.
- [LOCKED] Better Auth (not Clerk) — migrating to Fahim's standard stack auth. Clerk is the old Sentri.
- [LOCKED] Next.js 16 App Router — Fahim's standard stack, Edge-compatible.
- [LOCKED] Neon + Drizzle ORM — standard database layer, no Supabase.
- [LOCKED] Browser extension included — cross-browser autofill is a core feature, not an afterthought.
- [LOCKED] Perks/affiliate layer — discounts and benefits for Sentri members. This is a real differentiator, not a nice-to-have.
- [LOCKED] Breach checking free for all — never paywalled. That's what separates Sentri from Bitwarden Premium, Keeper BreachWatch, etc.
- [LOCKED] Dark mode only — no toggle, no light mode, ever.
- [LOCKED] Dual deploy — Vercel (primary) + Cloudflare (secondary).

---

## Visual Identity (Locked)

> Carried forward from original Sentri. This is Sentri's product identity — not a default palette. Do not substitute any value.

| Token           | Value                    | Usage                                        |
|-----------------|--------------------------|----------------------------------------------|
| `bg`            | `#0a0a0a`                | Page background                              |
| `bg2`           | `#0f0f0f`                | Alternate section background                 |
| `surface`       | `#141414`                | Cards, sidebar, nav                          |
| `surface2`      | `#1a1a1a`                | Input backgrounds, secondary surfaces        |
| `surface3`      | `#202020`                | Hover states, shimmer highlight              |
| `border`        | `#1f1f1f`                | Default borders                              |
| `border2`       | `#2a2a2a`                | Hover borders, stronger dividers             |
| `accent`        | `#00e676`                | Primary green — CTAs, active states, links   |
| `accent2`       | `#00b85a`                | Accent hover state                           |
| `accent-faint`  | `rgba(0,230,118,0.08)`   | Accent background tint (badges, active nav)  |
| `text`          | `#f0ede6`                | Primary text                                 |
| `text2`         | `#c8c4bc`                | Secondary text                               |
| `sub`           | `#8a8a8a`                | Muted/placeholder text, inactive nav items   |
| `danger`        | `#FF4D6A`                | Errors, destructive actions                  |
| `warning`       | `#FFB547`                | Warnings                                     |
| `gold`          | `#C8A96A`                | Shared vaults, circle feature                |
| `purple`        | `#A78BFA`                | SSH keys category                            |
| `surface-nav`   | `rgba(10,10,10,0.92)`    | Sticky nav backdrop blur                     |
| Font (display)  | Clash Display (self-hosted, woff2) | All headings, section titles        |
| Font (body)     | Onest                    | All body text, UI labels                     |
| Font (mono)     | JetBrains Mono           | Code, keys, vault status, entropy display    |

---

## What It Must Never Become

- Never enterprise — no admin panels, team dashboards, SSO, compliance exports
- Never bloated — not a VPN, not an identity wallet, not a browser, not everything
- Never ugly — UI quality is a core product value, not a polish pass
- Never a subscription trap — breach checking, password health, and sharing are free
- Never a social network — the circle is trusted and small, not a discovery/follower platform
- Never security-theater — no "features" that feel secure but weaken zero-knowledge principles

---

## Current State

```
Status: Rebuild / Pre-Alpha
Last updated: 2026-06-29

What works:
- Old Sentri repo exists at github.com/mahtamun-hoque-fahim/sentri (reference only)
- Old extension at sentri-extension (reference only)
- Design system (COLOR_GUIDE.md) fully defined and carried forward
- Core crypto architecture proven (AES-256-GCM + PBKDF2-SHA256)

What's broken or incomplete:
- Everything — this is a fresh rebuild on Next.js 16 + Better Auth
- Old Sentri used Clerk; new Sentri uses Better Auth
- No BRAIN.md / PLANNER.md / pipeline docs existed in old repo

What's next (in spirit, not tasks):
- tree-man runs to define the route manifest
- Council PRE-BUILD to pressure-test the plan
- repo-maintainer scaffolds living docs
- Build begins on pipeline-clean foundation
```

---

## The Stack (Frozen)

| Layer       | Choice                                      |
|-------------|---------------------------------------------|
| Framework   | Next.js 16 App Router                       |
| Language    | TypeScript                                  |
| Styling     | Tailwind CSS v4                             |
| Database    | Neon (PostgreSQL) + Drizzle ORM             |
| Auth        | Better Auth                                 |
| Encryption  | Web Crypto API — AES-256-GCM + PBKDF2-SHA256 |
| State       | Zustand (vault store, unlock state)         |
| Icons       | Lucide React                                |
| Deployment  | Vercel (primary) + Cloudflare (secondary)   |
| Extension   | Separate repo — sentri-extension            |

---

## Constraints & Non-Negotiables

- Must deploy to both Vercel and Cloudflare (Edge Runtime compatible)
- No emojis in UI — lucide-react icons only
- Dark mode only — no light mode, no toggle
- No Supabase
- No Clerk — Better Auth is the auth layer
- Vault key must NEVER leave the client in plaintext — zero-knowledge is a hard constraint, not a marketing claim
- Breach checking must be free for all users — k-anonymity HIBP API
- Extension must mirror the web app palette exactly (COLOR_GUIDE.md is shared source of truth)
- Clash Display must be self-hosted (not CDN) — existing woff2 files carry forward

---

## Context Hooks (for Claude)

- The vault key is derived client-side from the master password — the server stores only encrypted blobs. Never suggest server-side decryption, even for convenience features.
- Auth is Better Auth, NOT Clerk. The old Sentri used Clerk. This is a rebuild.
- The old repo (`mahtamun-hoque-fahim/sentri`) is reference only — do not port old code wholesale. Rebuild clean.
- The browser extension lives in a separate repo (`sentri-extension`) and must stay in sync with the web app's design tokens.
- The `gold` token (`#C8A96A`) is specifically for circle/sharing features — do not use it generically.
- The `purple` token (`#A78BFA`) is specifically for SSH key vault items only.
- PBKDF2 uses 600,000 iterations — do not reduce this for "performance" reasons.
- Perks/affiliate layer is a first-class feature, not phase 3 content — it belongs in the architecture from day one.

---

*Last updated by Singularity on 2026-06-29*
