# 🔐 Sentri

> A zero-knowledge encrypted password manager for your trusted circle.

**Live:** [sentri-here.vercel.app](https://sentri-here.vercel.app)

---

## What is Sentri?

Sentri is a privacy-first password manager built on zero-knowledge principles — meaning your master password and vault data **never leave your device in plaintext**. All encryption and decryption happens entirely in your browser using the Web Crypto API.

Even as the developer, it's technically impossible to read your vault contents.

---

## Tech Stack

| Layer        | Technology                                      |
|-------------|--------------------------------------------------|
| Framework   | Next.js 14 (App Router)                          |
| Language    | TypeScript                                       |
| Styling     | Tailwind CSS + Space Grotesk / Space Mono fonts  |
| Auth        | Clerk (email + OTP verification)                 |
| Database    | Neon (PostgreSQL) + Drizzle ORM                  |
| Encryption  | AES-256-GCM via Web Crypto API                   |
| Key Deriv.  | PBKDF2-SHA256, 600,000 iterations                |
| Icons       | Lucide React                                     |
| Deployment  | Vercel                                           |
| Extension   | Vanilla JS Chrome Extension (Manifest V3)        |

---

## Security Model

```
Master Password + Secret Key
        ↓  PBKDF2 (SHA-256, 600,000 iterations)
   AES-256-GCM Key  ←  memory only, cleared on lock
        ↓
  Encrypts all vault data in browser
        ↓
  Ciphertext stored in Neon (PostgreSQL)
```

- The server **never receives** the master password, secret key, or plaintext vault data
- The vault key exists **only in memory** — cleared on lock or session end
- Each item is individually encrypted with AES-256-GCM
- A **canary value** is encrypted on signup to verify credentials on unlock without exposing vault contents
- The **Secret Key** is a 128-bit random hex value shown only once at signup — it's required alongside the master password to derive the vault key

---

## Features

### Phase 1 (Current)
- Zero-knowledge AES-256-GCM encryption
- Master Password + Secret Key two-factor key derivation (PBKDF2, 600k iterations)
- Clerk authentication with email OTP verification
- Vault item types: **Logins, Cards, Notes, SSH Keys, API Credentials**
- In-memory vault key (never written to localStorage or disk)
- Password strength meter & configurable password generator
- Full CRUD for vault items with encryption/decryption
- Search & filter vault by category
- Favicon auto-fetch for login items
- TOTP / 2FA code display
- Secure share links (item re-encrypted with URL-fragment key — server never sees it)
- Watchtower: breached password detection via HaveIBeenPwned API (k-anonymity)
- Session management & inactivity auto-lock
- Browser extension for autofill
- CSV/JSON import from 1Password, Bitwarden, LastPass, generic CSV
- Emergency Kit PDF export
- Web3-inspired dark UI design system

### Phase 2 (Planned)
- Item history / version tracking
- Auto-lock timer settings
- TOTP management improvements

### Phase 3 (Planned)
- Shared vaults with invite flow
- Emergency access contacts

### Phase 4 (Planned)
- 1Password / Bitwarden full import
- Mobile app

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Clerk](https://clerk.com) application (production instance recommended)

### 1. Clone & Install

```bash
git clone https://github.com/mahtamun-hoque-fahim/sentri.git
cd sentri
npm install
```

### 2. Set Up Database

Run the schema in your Neon SQL editor:

```bash
# Using Drizzle migrations
npx drizzle-kit push
```

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in:

```env
# Neon Database
DATABASE_URL=postgresql://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/unlock
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/unlock
```

> **Important:** Use a Clerk **production** instance for real users — development mode limits email delivery.

### 4. Run

```bash
npm run dev   # http://localhost:3000
```

---

## Browser Extension

The `/extension` directory contains a Manifest V3 Chrome extension for autofill.

### Install (Development)
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `/extension` folder

### Usage
- Click the Sentri icon in your toolbar
- Enter your email, master password, and secret key to unlock
- Visit any login page — matching credentials appear automatically
- Click **Autofill** to fill in one click

---

## Project Structure

```
app/
├── (auth)/
│   ├── signup/       Signup + Secret Key reveal
│   ├── signin/       Sign in
│   └── unlock/       Key derivation + canary verify
├── (app)/
│   ├── dashboard/    Vault home — decrypt + list items
│   ├── vault/new     Create encrypted item
│   ├── vault/[id]    View / Edit / Delete item
│   ├── generator/    Password generator
│   ├── watchtower/   Breach + weakness scanner
│   ├── shared/       Shared vault items
│   ├── import/       Import from other managers
│   ├── emergency-kit Emergency kit PDF
│   └── settings/     Session management, auto-lock
├── api/
│   ├── auth/complete-signup   Signup completion (Bearer token auth)
│   ├── profile/               User profile + vault key storage
│   ├── vault/items/           CRUD for vault items
│   ├── vault/history/         Item version history
│   ├── shares/                Secure share link management
│   ├── sessions/              Session tracking
│   └── vaults/                Vault management
├── share/[shareId]/  Public share view (client-side decrypt)
components/
├── layout/           Sidebar, Header, InactivityLock
├── vault/            ItemCard, EmptyVault, PasswordField, TOTPDisplay, etc.
└── sharing/          ShareItemModal
lib/
├── crypto.ts         AES-256-GCM, PBKDF2, password generator, strength
├── db.ts             Neon + Drizzle setup
├── schema.ts         Database schema
├── api.ts            Fetch wrapper for API routes
└── importers.ts      1Password, Bitwarden, LastPass, CSV parsers
store/
└── vault.ts          Zustand in-memory vault key store
extension/
├── manifest.json
├── popup.html / popup.js
├── background.js
└── content.js
```

---

## License

MIT — built by [Mahtamun Hoque Fahim](https://github.com/mahtamun-hoque-fahim)
