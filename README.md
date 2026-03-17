# 🔐 Sentri

A zero-knowledge encrypted password manager for your trusted circle.
Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## ✨ Phase 1 Features

- Zero-knowledge AES-256-GCM encryption (client-side only)
- Master Password + Secret Key two-factor key derivation (PBKDF2, 600k iterations)
- Supabase Auth + Row Level Security
- Vault item types: Logins, Cards, Notes, SSH Keys, API Credentials
- In-memory vault key (never written to localStorage or disk)
- Password strength meter & configurable password generator
- Create / View / Edit / Delete vault items with full encryption
- Search & filter vault by category
- Favicon auto-fetch for login items
- Responsive Sentri green design system

## 🚀 Getting Started

### 1. Install
```bash
git clone https://github.com/mahtamun-hoque-fahim/sentri.git
cd sentri && npm install
```

### 2. Supabase setup
1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Copy project URL + anon key

### 3. Environment
```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4. Run
```bash
npm run dev   # http://localhost:3000
```

## 🔒 Security Model

```
Master Password + Secret Key
        ↓  PBKDF2 (SHA-256, 600,000 iterations)
   AES-256-GCM Key  ←  memory only, cleared on lock
        ↓
  Encrypts all items in browser  →  ciphertext stored in Supabase
```

The server never receives or stores plaintext. Even as the developer, you cannot read vault contents.

## 📁 Structure

```
app/(auth)/signup     Signup + Secret Key reveal
app/(auth)/signin     Login + key derivation + canary verify
app/(app)/dashboard   Vault home (decrypt + list items)
app/(app)/vault/new   Create new encrypted item
app/(app)/vault/[id]  View / Edit / Delete item
app/(app)/generator   Password generator
lib/crypto.ts         AES-256-GCM, PBKDF2, generator, strength
store/vault.ts        Zustand in-memory vault key store
supabase/schema.sql   Full DB schema with RLS policies
```

## 🗺️ Roadmap

- **Phase 2:** Watchtower, item history, session manager, auto-lock, TOTP codes
- **Phase 3:** Shared vaults, secure share links, invite flow, Emergency Kit PDF
- **Phase 4:** Browser extension, CLI tool, 1Password/Bitwarden import

## License
MIT
