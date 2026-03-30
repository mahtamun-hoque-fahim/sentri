# Sentri Design Guide

> Last updated: 2026-03-30
> Theme: **Professional Vault** — deep navy, indigo accent, serif + geometric sans

---

## Design Philosophy

Sentri must feel like a **trusted vault** — not a hackathon project, not a Web3 app.
The aesthetic direction is: *Swiss banking meets modern SaaS.*

**Core principles:**
- **Stillness over flash** — no neon glows, no gradients screaming for attention
- **Weight and authority** — typography and spacing that communicates security
- **Restraint** — every color, every shadow earns its place
- **Trust signals everywhere** — metrics, copy, and layout reinforce credibility

---

## Color Palette

All colors are defined as CSS variables in `app/globals.css`.

| Token            | Value       | Usage                                      |
|-----------------|-------------|---------------------------------------------|
| `--bg`          | `#0A0E17`   | Page background                            |
| `--bg2`         | `#0F1623`   | Secondary background (sections)           |
| `--surface`     | `#141C2E`   | Cards, sidebar, modals                    |
| `--surface2`    | `#1A2236`   | Input backgrounds, nested surfaces        |
| `--surface3`    | `#1F2840`   | Hover states, subtle elevation            |
| `--border`      | `#263352`   | Default borders                           |
| `--border2`     | `#2E3D63`   | Hover borders, stronger dividers          |
| `--text`        | `#E2E8F5`   | Primary text                              |
| `--text2`       | `#A8B4CC`   | Secondary text, descriptions              |
| `--sub`         | `#6B7A99`   | Placeholder, labels, muted text           |
| `--accent`      | `#4F6EF7`   | Primary CTA, active states, links         |
| `--accent2`     | `#3A56D4`   | Accent hover state                        |
| `--accent-dim`  | `rgba(79,110,247,0.12)` | Accent backgrounds            |
| `--success`     | `#34C98A`   | Positive states, encryption indicator     |
| `--danger`      | `#F0516A`   | Errors, delete actions, lock warning      |
| `--warning`     | `#F5A623`   | Cautions, weak passwords                  |
| `--gold`        | `#C8A96A`   | Card item type accent                     |

### Item type colors
| Type             | Color       |
|-----------------|-------------|
| Login           | `#4F6EF7`   |
| Card            | `#C8A96A`   |
| Note            | `#6B7A99`   |
| SSH Key         | `#A78BFA`   |
| API Credential  | `#F5A623`   |

---

## Typography

| Role         | Font                          | Usage                             |
|-------------|-------------------------------|-----------------------------------|
| Display     | `Instrument Serif` (italic OK) | Page headlines, hero h1           |
| UI Body     | `Geist`                        | All interface text, buttons, nav  |
| Monospace   | `Geist Mono`                   | Keys, codes, labels, vault items  |

**Font import** (in `app/layout.tsx`):
```
Instrument Serif:ital@0;1 + Geist:wght@300;400;500;600;700 + Geist Mono:wght@400;500
```

**Type scale guidelines:**
- Hero headline: `text-5xl`–`text-7xl`, `font-normal`, Instrument Serif
- Section heading: `text-3xl`, `font-normal`, Instrument Serif  
- UI heading: `text-sm`–`text-base`, `font-semibold`, Geist
- Body: `text-sm`, `font-normal`, Geist, color `--text2`
- Labels: `text-xs`, `font-semibold`, uppercase, `tracking-widest`, color `--sub`
- Mono values: `font-mono`, `text-xs`–`text-sm`, Geist Mono

---

## Component Tokens

### `.vault-card`
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 14px;
transition: border-color 0.2s, box-shadow 0.2s;
/* hover: border → --border2, box-shadow: 0 8px 32px rgba(0,0,0,0.25) */
```

### `.vault-input`
```css
background: var(--surface2);
border: 1px solid var(--border);
color: var(--text);
border-radius: 10px;
/* focus: border → --accent, box-shadow: 0 0 0 3px rgba(79,110,247,0.15) */
```

### `.btn-accent`
```css
background: var(--accent);
color: #fff;
font-weight: 600;
/* hover: background → --accent2, box-shadow: 0 4px 20px rgba(79,110,247,0.35), translateY(-1px) */
```

### `.nav-active` (sidebar)
```css
background: rgba(79,110,247,0.08);
color: var(--accent);
border-left: 2px solid var(--accent);
```

---

## Backgrounds

| Class          | Usage                        |
|---------------|------------------------------|
| `.vault-bg`   | Auth pages (signin, signup, unlock) — subtle grid |
| `.hero-glow`  | Landing page hero section — radial accent glow    |

Body has a **noise texture overlay** (`body::before`) at `opacity: 0.025` for depth.

---

## Icons

**Library:** `lucide-react`

| Area               | Icons used                                                   |
|-------------------|--------------------------------------------------------------|
| Sidebar nav        | LayoutGrid, Key, CreditCard, FileText, Terminal, Zap, Shield, Users, Download, AlertTriangle, Settings, LogOut, Plus, Menu, X |
| Item types         | Key (login), CreditCard (card), FileText (note), Terminal (SSH), Zap (API) |
| Auth pages         | Lock, Eye, EyeOff, ArrowRight, Copy, Check, Mail, Key, CheckCircle |
| Dashboard stats    | Key, CreditCard, FileText, Zap                               |
| Watchtower         | Skull, AlertTriangle, RefreshCw, Clock, Shield, Search       |
| General UI         | Search, Plus, ChevronRight, ExternalLink, ShieldOff, X       |

**Icon sizing:** `size={14}`–`size={18}` for UI, `size={20}`–`size={28}` for hero/empty states.  
**Stroke width:** `1.7`–`1.8` default, `2`–`2.5` for active/emphasis.

**No emojis anywhere.** Use Lucide icons throughout.

---

## Animations

```css
.animate-fade-up   /* 0.5s cubic-bezier(0.16,1,0.3,1) — page load reveals */
.animate-fade-in   /* 0.35s ease — modals, tooltips */
.animate-slide-in  /* 0.3s — sidebar items */

.delay-1 → .delay-5  /* 0.06s increments for staggered reveals */
```

---

## Spacing & Layout

- Sidebar width: `w-56` (224px)
- Main content max-width: `max-w-3xl` for vault lists, `max-w-2xl` for item detail
- Page padding: `px-6 py-6`
- Card gap: `gap-2` for vault item list, `gap-4`–`gap-5` for feature grids
- Border radius: `rounded-xl` (12px) for cards/inputs, `rounded-lg` (8px) for buttons/badges

---

## Do / Don't

| ✅ Do                                              | ❌ Don't                                      |
|--------------------------------------------------|----------------------------------------------|
| Use CSS variables for all colors                 | Hardcode hex values inline                   |
| Use Instrument Serif for display headings        | Use sans-serif for hero headlines            |
| Keep accent usage restrained (CTA, active only)  | Use accent color on every element            |
| Use `vault-card` class for all card surfaces     | Create one-off card styles                   |
| Use `vault-input` class for all form inputs      | Inline input styles                          |
| Use Lucide icons consistently                    | Mix icon libraries or use emojis             |
| Write copy that earns trust (technical, precise) | Fluffy marketing copy                        |
| Update this guide when changing the design       | Leave the guide out of date                  |

---

## Extension (`/extension`)

The Chrome extension popup mirrors the web app palette:

| Token      | Value       |
|-----------|-------------|
| `--bg`    | `#0A0E17`   |
| `--surf`  | `#141C2E`   |
| `--surf2` | `#1A2236`   |
| `--border`| `#263352`   |
| `--accent`| `#4F6EF7`   |
| `--text`  | `#E2E8F5`   |
| `--sub`   | `#6B7A99`   |
| `--danger`| `#F0516A`   |

Item type icons in the extension use **inline SVGs** with the same per-type colors as the web app.

---

## Updating this guide

When making UI changes, update the relevant section:
- New color → add to palette table
- New component → add token block  
- New icon usage → add to icons table
- Font change → update typography section
- Layout change → update spacing section
