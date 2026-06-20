# 07 — Brand Guidelines

Derived from the Bahari Click logo: a bold orange **"Bahari"** wordmark, a rounded outlined **"click"** pill, and a cursor-with-sparkle **click mark**. The brand is energetic, friendly, and mobile-first. These tokens are the single source of truth for the storefront and admin UI.

> **Note:** Exact hex values below are sampled to match the logo closely — confirm against the original vector/asset and adjust the token once, here, if needed. Everything downstream references the token, not raw hex.

---

## 1. Logo

**Elements**
- **Wordmark** — "Bahari" in heavy geometric sans, brand orange.
- **"click" pill** — lowercase, lighter weight, inside a rounded (pill) outline.
- **Click mark** — cursor/arrow with motion sparks. Use standalone as **favicon, app icon, and loading/spinner motif**.

**Usage rules**
- Clear space around the logo ≥ the height of the "click" pill.
- Minimum width: 120px on web, 32px for the standalone click mark (favicon).
- **Do not:** recolor (only brand orange, or white/black knockout), stretch, add shadows, rotate, or place the orange logo on a low-contrast/orange background.
- On dark or photo backgrounds use the **white knockout** logo.

---

## 2. Color palette

### Brand
| Token | Hex | HSL | Use |
|---|---|---|---|
| `brand` (primary) | `#FF5A1F` | `16 100% 56%` | CTAs, links, active states, sold-count badge, brand accents |
| `brand-hover` | `#E84A12` | `14 86% 49%` | Hover/pressed on primary |
| `brand-tint` | `#FFF1EB` | `18 100% 96%` | Chips, highlight backgrounds, subtle fills |
| `brand-foreground` | `#FFFFFF` | — | Text/icon on brand orange |

### Neutrals
| Token | Hex | Use |
|---|---|---|
| `foreground` | `#1A1A1A` | Primary text |
| `muted-foreground` | `#6B7280` | Secondary text |
| `border` | `#E5E7EB` | Borders, dividers |
| `muted` / surface-alt | `#F5F5F5` | Section backgrounds |
| `background` | `#FFFFFF` | Page background |

### Semantic (kept distinct from brand orange)
| Token | Hex | Use |
|---|---|---|
| `success` | `#16A34A` | Delivered, in-stock, confirmations |
| `warning` | `#F59E0B` | Low stock, risky-order flag (amber, *not* brand orange) |
| `danger` | `#DC2626` | Errors, cancelled/returned, out-of-stock |
| `info` | `#2563EB` | Neutral info, tracking states |

> Because the brand *is* orange, never use orange for warnings — that's why warnings use amber and primary CTAs own the orange. This keeps "buy" actions unambiguous.

---

## 3. Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display / headings | **Plus Jakarta Sans** (or Poppins) | 600–800 | Geometric, rounded — matches the wordmark feel |
| Body / UI | **Inter** | 400–600 | Clean, highly legible on mobile |
| Bangla | **Hind Siliguri** (or Noto Sans Bengali) | 400–700 | For Bangla labels/SMS-facing text |

- Load via `next/font` (self-hosted, no layout shift — also keeps it free, no external CDN call).
- Scale (mobile-first): `xs 12 · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30 · 4xl 36`.
- Headings tight tracking; body normal. Prices use heading font, bold.

---

## 4. Shape, spacing, elevation

- **Radius:** base `0.75rem` (12px) for cards/inputs; **pill** (`9999px`) for buttons, chips, and badges — echoes the "click" pill. shadcn `--radius: 0.75rem`.
- **Spacing:** 4px scale (4/8/12/16/24/32…).
- **Shadows:** subtle only (`sm`/`md`); the brand reads clean and flat, not heavy.
- **Buttons:** primary = brand orange, pill, white text; secondary = outline; ghost for tertiary. Generous tap targets (≥44px) for mobile.

---

## 5. shadcn / Tailwind token mapping

Set these in `globals.css` (shadcn CSS variables, HSL) and `tailwind.config` so every component inherits the brand:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 10%;
  --primary: 16 100% 56%;          /* brand orange */
  --primary-foreground: 0 0% 100%;
  --secondary: 18 100% 96%;        /* brand tint */
  --secondary-foreground: 14 86% 40%;
  --muted: 0 0% 96%;
  --muted-foreground: 220 9% 46%;
  --border: 220 13% 91%;
  --ring: 16 100% 56%;             /* focus ring = brand */
  --radius: 0.75rem;
  --destructive: 0 72% 51%;
}
```

Expose `brand`, `brand-tint`, `success`, `warning`, `info` as Tailwind colors for non-shadcn usage.

---

## 6. Brand voice & motifs

- **Tone:** friendly, energetic, action-oriented ("Add to cart", "Order now", "Track it") — the name is a verb-feeling: *click → it's yours*.
- **Click motif:** reuse the cursor-sparkle as the **loading spinner**, empty-state illustration accent, and micro-interaction on add-to-cart (a small spark animation). Keep it light, not gimmicky.
- **Imagery:** clean white product backgrounds; orange used as accent, not flooding the page.

---

## 7. Where this is applied (sprint hooks)

- **Storefront** → `S0.1 App shell & design system` implements all tokens above (fonts via `next/font`, shadcn theme, logo in header, favicon = click mark).
- **Admin** → `A0.1 Admin shell` uses the same tokens (orange primary, pill buttons) but a calmer, data-dense layout.
- All later UI tasks consume tokens — no hard-coded colors/fonts anywhere.
