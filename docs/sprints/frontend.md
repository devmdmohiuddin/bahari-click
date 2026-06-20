# Frontend (Storefront) Sprints

Next.js App Router + shadcn/ui + Tailwind. Mobile-first — most buyers arrive from a Facebook/Instagram ad on a mid-range phone. RSC for reads, Server Actions for mutations, Zustand for cart/UI. Feature-by-feature below.

---

## Phase 0 — Foundation

### S0.1 App shell & design system
- **Build:** Root layout, header (**Bahari Click logo**, search slot, cart icon w/ count), footer, mobile nav drawer. **Apply [brand guidelines](../07-brand-guidelines.md):** shadcn theme with brand-orange primary (`16 100% 56%`), pill buttons/badges (`--radius: 0.75rem`), brand fonts via `next/font` (Plus Jakarta Sans headings + Inter body, Hind Siliguri for Bangla), favicon = the click mark, brand-orange focus ring. Utils: BDT `৳` formatting, Asia/Dhaka time. Toast/skeleton primitives; **loading spinner uses the click/sparkle motif**.
- **Acceptance:** Responsive shell renders with brand colors/fonts/logo; no hard-coded colors (all via tokens); cart icon reflects Zustand count.

### S0.2 Cart store
- **Build:** Zustand cart (add/remove/qty, persist to localStorage). Selectors for count/subtotal.
- **Acceptance:** Cart survives refresh; subtotal computed client-side (display only — server re-computes at checkout).

---

## Phase 1 — Catalog

### S1.1 Home page
- **Build:** Featured products, category entry tiles, simple hero/banner slot. ISR.
- **Acceptance:** Renders featured + categories from backend.

### S1.2 Category / listing page
- **Build:** Product grid, category→subcategory nav, sort dropdown (newest/price/best-selling), pagination/infinite scroll. **Sold count badge** on each card. Next `<Image>` via Cloudinary loader.
- **Acceptance:** Browsing a category lists correct products with sold counts; sort works.
- **Deps:** Backend F1.3.

### S1.3 Product card
- **Build:** Reusable card: image, title, price (+ compare-at strikethrough), sold count, rating stars, quick add-to-cart for single-variant products.
- **Acceptance:** Card consistent across home/listing/related.

---

## Phase 2 — Product detail page (PDP)

### S2.1 Gallery + variant switch
- **Build:** Main image + thumbnail strip + zoom. **Color/size selectors**; selecting a variant **swaps the main image** to that variant's first image; default = first variant's image. Disable unavailable combos; show per-variant price/stock.
- **Acceptance:** Variant selection updates image, price, and availability instantly (data hydrated, no refetch).
- **Deps:** Backend F2.1.

### S2.2 Info sections
- **Build:** Tabs/accordions: **Description** (rich text), **Specifications** (key/value table), **Reviews & ratings** (avg, star breakdown, list of approved reviews, "write a review" form via Server Action).
- **Acceptance:** All sections render; review submit creates a pending review with success toast.
- **Deps:** Backend F2.2.

### S2.3 Add to cart + related
- **Build:** Add-to-cart (validates a variant is selected). **Related products** carousel at bottom.
- **Acceptance:** Add-to-cart updates store; related shows same-category items.

---

## Phase 3 — Stock & pre-order

### S3.1 Out-of-stock → notify-me
- **Build:** When selected variant `stock=0`, replace Add-to-cart with **Notify me / Pre-order** form (phone + optional qty) → Server Action. Success state.
- **Acceptance:** OOS variant shows the form; submission creates a PreOrderRequest with confirmation.
- **Deps:** Backend F3.2.

---

## Phase 4 — Cart & COD checkout

### S4.1 Cart page
- **Build:** Line items (image, variant label, qty stepper, line total), subtotal, edit/remove, "proceed to checkout".
- **Acceptance:** Cart edits reflect immediately; empty-cart state handled.

### S4.2 Checkout (COD)
- **Build:** Single-page checkout: name, **phone** (normalized), address, area, **shipping zone selector** (fee shown), optional coupon field (live validate), order summary with server-confirmed total. **Guest by default**; optional OTP verify for phone. Submit via Server Action.
- **Acceptance:** Totals match server; invalid coupon shows error; order places and returns an order number.
- **Deps:** Backend F4.1–F4.4.

### S4.3 Confirmation + tracking
- **Build:** Order confirmation page (order number, summary, "you'll get an SMS"). Public **Track order** page (phone + order number → status timeline). Clear cart on success.
- **Acceptance:** Confirmation shows correct order; tracking returns live status.
- **Deps:** Backend F4.5.

---

## Phase 5 — Fulfillment-facing UX & pixels

### S5.1 Status timeline & review prompt
- **Build:** Richer tracking timeline (pending→…→delivered). Delivered → deep-link to leave a review (from the delivered SMS).
- **Acceptance:** Timeline reflects courier-synced status; review link prefilled to product.

### S5.2 Analytics & pixel
- **Build:** Meta Pixel + GA4/GTM. Client events: ViewContent, AddToCart, InitiateCheckout, Purchase (paired with server CAPI dedup id).
- **Acceptance:** Events fire and dedup against server CAPI.
- **Deps:** Backend F5.4.

---

## Phase 6 — Search, filters, SEO, polish

### S6.1 Search & filters
- **Build:** Search bar + results page; filter sidebar/drawer (subcategory, price range, color, size, in-stock); combine with sort.
- **Acceptance:** Filter combinations + search return correct results, URL-synced (shareable).
- **Deps:** Backend F6.1.

### S6.2 SEO
- **Build:** Per-page metadata, Open Graph, **JSON-LD Product** structured data (price, rating, availability), dynamic `sitemap.xml`, `robots.txt`, canonical URLs.
- **Acceptance:** Rich results validate; sitemap lists published products.

### S6.3 Polish
- **Build:** Loading skeletons, empty/error states, image lazy-loading, perf pass (Lighthouse mobile), accessibility pass.
- **Acceptance:** Good mobile Lighthouse scores; no layout shift on PDP.

---

## Phase 7+ — Post-launch storefront

- **Customer account area:** order history, saved addresses.
- **Wishlist** + recently viewed.
- **Single-product landing pages** (FB-ad funnel) — minimal 1-step COD form template.
- **Flash sale / campaign** pages with countdown.
- **WhatsApp/Messenger** support button.
- **Product Q&A**, size guides.
- **Online payment** UI (bKash/Nagad/card) once aggregator is live.
- **Bangla UI** localization rollout.
