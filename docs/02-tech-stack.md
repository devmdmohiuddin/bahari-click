# 02 — Tech Stack & Rationale

Reviewed against the original proposal. Verdict: the original stack was largely correct. Adjustments are in **Auth** and the **BD integration layer**, not in the core.

---

## Recommended stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend framework** | **Next.js (App Router)** | Already chosen, correct. SSR/ISR for SEO + speed, Server Actions for mutations, one codebase for storefront + admin + API. |
| **UI** | **shadcn/ui + Tailwind CSS** | Own your components (copy-in, not a dependency), fast to theme, excellent for both storefront and admin tables/forms. |
| **Backend** | **Next.js Server Actions + Route Handlers** | No separate service at this scale. Server Actions for form mutations; Route Handlers for webhooks (courier/SMS) and any public API. |
| **Database** | **PostgreSQL** | Relational data (product→variant→order→review) maps to relational. Industry default. |
| **ORM** | **Prisma** | Best DX, type-safe, painless migrations. Fine for this scale; you won't hit Drizzle's edge-runtime advantage here. |
| **DB hosting** | **Neon** (or Supabase) | Serverless Postgres, branching, generous free tier. Pick **Supabase** instead if you want to consolidate storage + auth. |
| **Auth** | **Better Auth** (or Auth.js v5) with **phone OTP** | BD customers don't use email. Phone+OTP first, guest checkout default. Better Auth has first-class phone/OTP + admin roles; Auth.js works too. |
| **Image storage** | **Cloudinary** | Upload, auto-format (AVIF/WebP), responsive resizing, CDN. Critical for image-heavy pages on BD mobile networks. (UploadThing/Supabase Storage are simpler alternatives.) |
| **Validation** | **Zod** | Pairs with Server Actions + react-hook-form. One schema for client + server. |
| **Forms** | **react-hook-form + Zod** | Standard combo. |
| **Client state** | **Zustand** | Cart + UI state. Lightweight, no Redux. |
| **Server state / data fetching** | **React Server Components + TanStack Query** (admin client tables) | RSC for reads on storefront; TanStack Query for interactive admin tables. |
| **Email (optional)** | **Resend** | Receipts/admin alerts. Secondary to SMS in BD. |
| **SMS (BD)** | **BulkSMSBD / Alpha SMS / MIM SMS** | OTP + order-status SMS. Pick one with a clean HTTP API + masking. |
| **Courier (BD)** | **Steadfast / Pathao / RedX** APIs | Consignment creation + COD fraud check + status sync. Steadfast is common for fraud-check coverage. |
| **Payments (later)** | **SSLCommerz / aamarPay** | One aggregator covers bKash, Nagad, Rocket, cards. Don't integrate bKash directly. |
| **Analytics / ads** | **GA4 + Meta Pixel + Conversion API** | Server-side CAPI for accurate ad attribution. |
| **Hosting** | **Vercel** | Zero-config Next.js, ISR, edge. (Or self-host on a VPS/Coolify if data-residency or cost demands it later.) |
| **Background jobs** | **Vercel Cron + a queue** (Upstash QStash) | Stock-notify, status polling, abandoned-cart, report rollups. |
| **Error monitoring** | **Sentry** | Catch checkout/courier failures early. |

---

## Why custom over a commerce platform

**Decision: build custom.**

- **Needs are simple now** — COD only, single market, single currency. A platform's multi-currency / multi-region / payment-abstraction machinery is dead weight.
- **Data model is custom** — variant-linked images, pre-order/notify-me, China sourcing cost, BD shipping zones, and courier fraud-check don't map cleanly to Medusa/Shopify primitives. You'd spend your time bending the platform.
- **BD integrations are the real work** — couriers, SMS, fraud check, FB CAPI. No platform ships these; you build them either way. Better to build on a schema you fully control.
- **Escape hatch exists** — if you later need a mobile app or a large team, extract a NestJS API from the Prisma layer. The schema stays; only the transport changes.

**When you'd reconsider:** if you needed multi-vendor marketplace, multi-currency, or hundreds of thousands of SKUs on day one — none of which apply.

### Rejected alternatives

| Option | Why not (now) |
|---|---|
| Medusa / Shopify / Saleor | Generic primitives fight the custom variant/pre-order/sourcing model; integrations still custom. |
| Separate NestJS backend | Extra infra/deploys for one frontend. Extract later if needed. |
| MongoDB | Relational shape; you'd reinvent joins and integrity. |
| Drizzle ORM | Fine, but Prisma's DX wins for a small team; perf edge irrelevant at this scale. |
| Clerk (email-first) | BD market is phone-first; OTP + guest checkout matter more than polished email auth. |
| Redux | Overkill; Zustand covers cart/UI. |

---

## Money & data conventions

- Store all money as **integer BDT (whole taka)** in `Int`. No floats, no minor units needed (taka is the practical smallest unit for retail). Single currency — no currency field.
- Timestamps in **UTC**, displayed in **Asia/Dhaka (UTC+6)**.
- IDs: `cuid()`/`uuid` for entities; human-friendly **order number** (e.g. `BC-25061-0042`) for customer/courier reference.
- Phone numbers normalized to `+8801XXXXXXXXX` on input.

---

## Environments

- **dev** — local Postgres (Docker) or a Neon dev branch; Cloudinary dev folder; SMS/courier in sandbox or mock mode.
- **prod** — Neon/Supabase prod; Vercel prod; live SMS/courier keys; Sentry + analytics on.
- Secrets in Vercel env vars; never in repo. `.env.example` committed.
