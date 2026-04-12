# 🔐 Sentri

> Zero-knowledge encrypted password manager for your trusted circle.

**Live:** [sentri-here.vercel.app](https://sentri-here.vercel.app) · **Extension:** [sentri-extension](https://github.com/mahtamun-hoque-fahim/sentri-extension)

---

## What is Sentri?

Sentri is a privacy-first password manager built on zero-knowledge principles — your master password and vault data **never leave your device in plaintext**. All encryption and decryption happens entirely in your browser using the Web Crypto API.

Even as the developer, it's technically impossible to read your vault contents.

---

## Tech Stack

| Layer       | Technology                                        |
|-------------|---------------------------------------------------|
| Framework   | Next.js 15 (App Router)                           |
| Language    | TypeScript                                        |
| Styling     | Tailwind CSS                                      |
| Fonts       | Clash Display (display) · Onest (body) · JetBrains Mono (mono) |
| Auth        | Clerk (email + OTP verification)                  |
| Database    | Neon (PostgreSQL) + Drizzle ORM                   |
| Encryption  | AES-256-GCM via Web Crypto API                    |
| Key Deriv.  | PBKDF2-SHA256, 600,000 iterations                 |
| Icons       | Lucide React                                      |
| Deployment  | Vercel                                            |

---

## Features

- 🔒 **Zero-knowledge** — vault key derived locally, never sent to server
- 🗄️ **Vault types** — Logins, Cards, Secure Notes, SSH Keys, API Keys
- 🛡️ **Watchtower** — breach detection via HaveIBeenPwned (k-anonymity)
- 🔗 **Secure sharing** — one-time encrypted links, decryption key in URL fragment
- 🔑 **Password generator** — configurable length, charset, entropy display
- 📦 **Import** — CSV import from other managers
- 🚨 **Emergency Kit** — PDF backup of account recovery info
- 🌙 **Dark mode only**

---

## Design System

See [`COLOR_GUIDE.md`](./COLOR_GUIDE.md) for the full color palette, typography, logo usage, and UI patterns.

**Quick reference:**
- Background: `#0a0a0a`
- Accent: `#00e676`
- Text: `#f0ede6`
- Display font: Clash Display

---

## Project Structure

```
sentri/
├── app/
│   ├── (app)/          # Authenticated app routes
│   ├── (auth)/         # Auth pages (signin, signup, unlock)
│   ├── api/            # API routes
│   ├── share/          # Public share page
│   └── globals.css     # Design tokens + global styles
├── components/
│   ├── layout/         # Sidebar, Header, ThemeToggle stub
│   ├── ui/             # Logo components (SentriLogo, SentriIcon, SentriLogoDuotone)
│   ├── vault/          # Vault item components
│   └── sharing/        # Share modal
├── lib/                # crypto, api, theme, db
├── store/              # Zustand vault store
├── public/fonts/       # Self-hosted Clash Display woff2 files
└── COLOR_GUIDE.md      # Design system reference
```

---

## Environment Variables

```env
DATABASE_URL=          # Neon PostgreSQL connection string (pooled)
DATABASE_URL_UNPOOLED= # Neon direct connection (for migrations)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/unlock
```

---

## Related

- **Browser Extension** → [github.com/mahtamun-hoque-fahim/sentri-extension](https://github.com/mahtamun-hoque-fahim/sentri-extension)
- **Built by** → [mahtamunhoquefahim.vercel.app](https://mahtamunhoquefahim.vercel.app)
