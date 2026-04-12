# Sentri — Color & Design Guide

> Single source of truth for all design tokens. Both the web app and browser extension follow this guide.

---

## Color Palette

| Token           | Hex         | Usage                                      |
|-----------------|-------------|---------------------------------------------|
| `--bg`          | `#0a0a0a`   | Page background                             |
| `--bg2`         | `#0f0f0f`   | Alternate section background                |
| `--surface`     | `#141414`   | Cards, sidebar, nav                         |
| `--surface2`    | `#1a1a1a`   | Input backgrounds, secondary surfaces       |
| `--surface3`    | `#202020`   | Hover states, shimmer highlight             |
| `--border`      | `#1f1f1f`   | Default borders                             |
| `--border2`     | `#2a2a2a`   | Hover borders, stronger dividers            |
| `--text`        | `#f0ede6`   | Primary text                                |
| `--text2`       | `#c8c4bc`   | Secondary text                              |
| `--sub`         | `#8a8a8a`   | Muted/placeholder text, inactive nav items  |
| `--accent`      | `#00e676`   | Primary green — CTAs, active states, links  |
| `--accent2`     | `#00b85a`   | Accent hover state                          |
| `--accent-dim`  | `rgba(0,230,118,0.08)` | Accent background tint (badges, active nav) |
| `--success`     | `#00e676`   | Same as accent                              |
| `--danger`      | `#FF4D6A`   | Errors, destructive actions                 |
| `--warning`     | `#FFB547`   | Warnings                                    |
| `--gold`        | `#C8A96A`   | Shared vaults, "circle" feature             |
| `--purple`      | `#A78BFA`   | SSH keys category                           |
| `--surface-nav` | `rgba(10,10,10,0.92)` | Sticky nav backdrop blur background    |

---

## Typography

| Role          | Font           | Weights        | Usage                          |
|---------------|----------------|----------------|-------------------------------|
| Display       | Clash Display  | 400–700        | All headings, section titles  |
| Body          | Onest          | 300–600        | All body text, UI labels      |
| Monospace     | JetBrains Mono | 400–500        | Code, keys, vault status      |

### Font Loading
- **Clash Display** — self-hosted in `public/fonts/` (woff2)
- **Onest + JetBrains Mono** — Google Fonts CDN

---

## Logo Variants

| Component           | Usage                          | Colors                        |
|--------------------|--------------------------------|-------------------------------|
| `SentriLogo`        | Nav, auth pages, sidebar       | `color` prop (default `#00e676`) |
| `SentriLogoDuotone` | Hero section                   | `accentColor` + `secondaryColor` |
| `SentriIcon`        | Footer, favicon, CTA badge     | `color` prop (default `#00e676`) |

### Standard placements
- **Landing nav (top-left):** `SentriLogo height={24} color="#ffffff"`
- **Sidebar:** `SentriLogoDuotone height={22} accentColor="#ffffff" secondaryColor="#00e676"`
- **Hero:** `SentriLogoDuotone height={44}` (defaults)
- **Footer:** `SentriIcon size={18}`

---

## UI Patterns

### Active nav item
```css
background: var(--accent-dim);
border-left: 2px solid var(--accent);
color: #ffffff;
```

### Accent button
```css
background: var(--accent);
color: #000;
font-weight: 600;
```

### Input focus
```css
border-color: var(--accent);
box-shadow: 0 0 0 3px var(--accent-dim);
```

### Vault card
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 12px;
```

---

## Extension Colors

The browser extension mirrors this palette exactly. See [`sentri-extension`](https://github.com/mahtamun-hoque-fahim/sentri-extension) repo for extension-specific implementation.

---

## Mode
Dark mode only. No light mode. No toggle.
