# Sentri — Design Guide

Implementation spec for the design system. No rationale. No marketing copy. Just tokens, patterns, and constraints.

## Color tokens

CSS variables in `app/globals.css` (Tailwind v4 — tokens auto-promote to utilities):

```css
@import "tailwindcss";

@theme {
  --color-bg:           #0a0a0a;
  --color-bg2:          #0f0f0f;
  --color-surface:      #141414;
  --color-surface2:     #1a1a1a;
  --color-surface3:     #202020;
  --color-border:       #1f1f1f;
  --color-border2:      #2a2a2a;

  --color-text:         #f0ede6;
  --color-text2:        #c8c4bc;
  --color-sub:          #8a8a8a;

  --color-accent:       #00e676;
  --color-accent2:      #00b85a;
  --color-accent-faint: rgba(0, 230, 118, 0.08);

  --color-danger:       #FF4D6A;
  --color-warning:      #FFB547;
  --color-success:      #00e676;

  --color-gold:         #C8A96A;
  --color-purple:       #A78BFA;

  --color-surface-nav:  rgba(10, 10, 10, 0.92);
}
```

### Token usage rules
| Token | Use |
|---|---|
| `bg` | Page background |
| `bg2` | Alternate section background |
| `surface` | Cards, sidebar, nav |
| `surface2` | Input backgrounds, secondary surfaces |
| `surface3` | Hover states, shimmer highlight |
| `border` | Default borders |
| `border2` | Hover borders, stronger dividers |
| `accent` | Primary green — CTAs, active states, links, cursor |
| `accent2` | Accent hover |
| `accent-faint` | Accent background tint (badges, active nav bg) |
| `text` | Primary text |
| `text2` | Secondary text |
| `sub` | Muted/placeholder text, inactive nav |
| `danger` | Errors, destructive actions |
| `warning` | Warnings |
| `success` | Success states (alias of accent — same color) |
| `gold` | Circle and sharing features ONLY |
| `purple` | SSH key vault items ONLY |
| `surface-nav` | Sticky nav backdrop with blur |

> `gold` and `purple` are semantic tokens — never use them outside their designated domains.

---

## Typography

**Families** (Clash Display is self-hosted via woff2 — load in `app/layout.tsx`):
- Display: Clash Display (`--font-clash`) — h1, h2, hero text, section titles, vault item names
- Body: Onest (`--font-onest`) — default for all UI text, labels, descriptions
- Mono: JetBrains Mono (`--font-mono`) — passwords, keys, entropy display, vault status, code

**Weights used:**
- Body: 400 (regular), 500 (medium, button labels, emphasis)
- Display: 500, 600 (hero)
- Mono: 400, 500

**Size scale** (rem):
| Token | Size | Use |
|---|---|---|
| `text-xs` | 0.75rem | Badges, timestamps, captions |
| `text-sm` | 0.875rem | Secondary text, form labels, nav items |
| `text-base` | 1rem | Body, descriptions |
| `text-lg` | 1.125rem | Card titles, lead text |
| `text-xl` | 1.25rem | h4, section subheadings |
| `text-2xl` | 1.5rem | h3 |
| `text-3xl` | 1.875rem | h2, page headings |
| `text-4xl` | 2.25rem | h1 |
| `text-5xl` | 3rem | Hero headline (landing) |

**Line height:** 1.6 for body, 1.2 for display headings.

---

## Spacing scale

Tailwind defaults. Common values in use:
- 2 (8px) — icon gaps, inline spacing
- 3 (12px) — badge padding, tight gaps
- 4 (16px) — button padding, list item gaps
- 6 (24px) — card padding, section spacing
- 8 (32px) — large card padding
- 12 (48px) — section vertical rhythm
- 16 (64px) — page section gaps

---

## Border radius

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Badges, small chips |
| `rounded-md` | 6px | Buttons (default) |
| `rounded-lg` | 8px | Inputs, small cards |
| `rounded-xl` | 12px | Cards (standard) |
| `rounded-2xl` | 16px | Modals, large panels |
| `rounded-full` | 9999px | Avatars, pill buttons, entropy bar |

---

## Shadows

```css
--shadow-sm: 0 1px 2px rgb(0 0 0 / 0.5);
--shadow-md: 0 4px 12px rgb(0 0 0 / 0.6);
--shadow-lg: 0 12px 32px rgb(0 0 0 / 0.7);
--shadow-glow: 0 0 24px rgba(0, 230, 118, 0.12);
```

Use sparingly — on dark surfaces, elevation comes from surface lightness steps, not shadows.

---

## Components

### Button — primary (accent)
```tsx
<button className="bg-accent text-bg px-4 py-2 rounded-md font-medium text-sm hover:bg-accent2 transition-colors duration-150">
  Add login
</button>
```

### Button — secondary
```tsx
<button className="bg-surface2 text-text px-4 py-2 rounded-md border border-border text-sm hover:bg-surface3 hover:border-border2 transition-colors duration-150">
  Cancel
</button>
```

### Button — ghost
```tsx
<button className="text-sub hover:text-text2 px-3 py-2 rounded-md text-sm transition-colors duration-150">
  Skip
</button>
```

### Button — danger
```tsx
<button className="bg-surface2 text-danger px-4 py-2 rounded-md border border-danger/20 text-sm hover:bg-danger/10 transition-colors duration-150">
  Delete
</button>
```

### Input
```tsx
<input className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-sub focus:border-accent focus:outline-none transition-colors duration-150" />
```

### Card
```tsx
<div className="bg-surface border border-border rounded-xl p-6">
  ...
</div>
```

### Card — elevated (hover state)
```tsx
<div className="bg-surface border border-border rounded-xl p-6 hover:border-border2 hover:bg-surface2 transition-colors duration-150 cursor-pointer">
  ...
</div>
```

### Badge — accent
```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-accent-faint text-accent">
  ACTIVE
</span>
```

### Badge — danger
```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-danger/10 text-danger">
  BREACHED
</span>
```

### Badge — gold (circle/sharing only)
```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-gold/10 text-gold">
  SHARED
</span>
```

### Badge — purple (SSH only)
```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-purple/10 text-purple">
  SSH KEY
</span>
```

### Password field (mono font)
```tsx
<input
  type="password"
  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text font-mono text-sm placeholder:text-sub focus:border-accent focus:outline-none"
/>
```

### Entropy bar
```tsx
<div className="w-full h-1.5 bg-surface3 rounded-full overflow-hidden">
  <div
    className="h-full rounded-full transition-all duration-300"
    style={{ width: `${entropy}%`, background: entropyColor }}
  />
</div>
```
`entropyColor`: danger below 40, warning 40-70, accent above 70.

---

## Animation defaults

- Hover transitions: `transition-colors duration-150 ease-out`
- Height/opacity reveals: `transition-all duration-200 ease-out`
- Modal/drawer enter: `transition-all duration-200 ease-out` (Framer Motion for complex)
- Page reveal: `transition-opacity duration-300 ease-out`
- Maximum UI animation: 300ms. Longer feels sluggish.
- Vault item unlock loading state: pulse skeleton on surface3 bg

Always wrap in `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Dark mode notes

Dark-first. No light mode. No toggle. No exceptions.

- Never use pure `#000000` for bg — use `--color-bg` (`#0a0a0a`)
- Never use pure `#ffffff` for text — use `--color-text` (`#f0ede6`)
- Elevation via surface lightness: bg → surface → surface2 → surface3
- Shadows are weak on dark surfaces — prefer `border` + surface step for depth
- The accent `#00e676` on `#0a0a0a` passes WCAG AA for large text. For small text (< 18px), pair with bold weight.

---

## Focus indicators

Always visible. Never `outline: none` without a replacement.

```css
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

---

## Icons

Lucide React only. No emojis. No custom SVG paths unless Lucide doesn't have it.
Size conventions: 16px inline/label, 20px card/action, 24px nav/hero.

Vault type icon map:
- login → `KeyRound`
- card → `CreditCard`
- note → `FileText`
- ssh_key → `Terminal` (purple tint)
- api_key → `Code2`

---

## Clash Display — self-hosted setup

Clash Display is not on Google Fonts. Files must be included in `public/fonts/`.

```tsx
// app/layout.tsx — local font loader
import localFont from 'next/font/local'

const clashDisplay = localFont({
  src: [
    { path: '../public/fonts/ClashDisplay-Regular.woff2', weight: '400' },
    { path: '../public/fonts/ClashDisplay-Medium.woff2', weight: '500' },
    { path: '../public/fonts/ClashDisplay-Semibold.woff2', weight: '600' },
  ],
  variable: '--font-clash',
  display: 'swap',
})
```

Copy `ClashDisplay-*.woff2` files from old Sentri repo's `public/fonts/` directory.
