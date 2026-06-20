# 06 — Cost & Free-Tier Plan

**Goal: build and develop the entire project for ৳0.** This doc tracks exactly what is free, what has a free tier, and what costs money — and the maximally-free dev setup. Rule of thumb: **everything is free during development; real costs only appear at launch (and most are operational, passed to customers).**

---

## Tier 1 — Free forever (open-source libraries you run)

No account, no limit, no cost at any scale:

Next.js · React · shadcn/ui · Tailwind · **Prisma** · **Better Auth** · Zod · react-hook-form · Zustand · TanStack Query · **PostgreSQL** (the engine itself).

## Tier 2 — Free tier, enough for dev + small launch

| Service | Role | Free tier | Commercial OK? | Cost trigger |
|---|---|---|---|---|
| **Neon** | Postgres hosting | 0.5 GB, auto-suspend | Yes | > storage / heavy compute |
| **Supabase** (alt) | DB + storage + auth | 500MB DB, 1GB files, 50k MAU | Yes | Pauses after 7 days idle; over limits |
| **Cloudinary** | Image CDN | ~25GB transform+bandwidth/mo | Yes | High traffic / big catalog |
| **Resend** | Email (optional) | 3,000/mo, 100/day | Yes | Over volume |
| **Upstash** (optional) | Rate-limit + jobs (QStash) | Redis: 256MB, 500K cmd/mo, 10GB bw; QStash: 1,000 msg/day | Yes | Over volume — **but no charge unless you add a card** (no card = capped, never billed) |
| **Sentry** | Error monitoring | 5k errors/mo, 1 user | Yes | Over volume / more seats |
| **GA4 + Meta Pixel** | Analytics + ads | Free | Yes | Never |

## Tier 3 — Watch out (the real cost traps)

| Item | Reality | Free path |
|---|---|---|
| **Vercel Hobby** | Free tier is **non-commercial only**. Fine for all dev/testing; a live revenue store technically needs **Pro ($20/mo)**. | Dev on Vercel free. At launch: **Cloudflare Pages/Workers** (free tier *allows* commercial) or self-host via **Coolify** on a cheap VPS. |
| **SMS** (BulkSMSBD/Alpha) | **No free tier.** ~৳0.25–0.45 per message in BD. | **Mock SMS adapter** in dev (log OTP/message to console). Pay only when real customers are texted at launch. |
| **Courier APIs** (Steadfast/Pathao/RedX) | Integration + merchant signup + sandbox are **free**. You pay the **delivery fee per parcel** when operating — and that's billed to the customer as shipping. | **Mock courier adapter** + provider sandbox during dev. |
| **Payment gateway** (later: SSLCommerz/aamarPay) | Sandbox free. Live = per-transaction fee (~1.5–2.5%). | Not needed until online payments phase; COD has no gateway cost. |
| **Domain name** | ~৳1,200/yr (.com ~$10). | Not needed for dev — launch on free `*.vercel.app`. Buy only when going public. |

---

## Maximally-free development setup

Use this for all of Phases 0–6 — total cost **৳0**:

| Concern | Dev choice (free) | Swap-at-launch |
|---|---|---|
| Database | **Local Postgres via Docker** — no limits, no signup | Neon/Supabase free tier |
| Auth | **Better Auth** (self-hosted lib, no per-user fee ever) | same |
| Images | Cloudinary free tier (or local folder in dev) | Cloudinary |
| **SMS** | **Mock adapter** (console log) | Real SMS provider |
| **Courier** | **Mock adapter** + sandbox | Real courier API |
| Rate-limiting | **Postgres table** (already have Postgres) — no Upstash needed | Upstash (free tier) if higher volume |
| Background jobs | **Vercel Cron + DB-backed job table** — fully free | Upstash QStash only if real queuing needed |
| Hosting | Vercel free previews / `localhost` | Cloudflare / Vercel Pro / VPS |
| Analytics | GA4 + Pixel (free) | same |

> The architecture already isolates SMS, courier, and payments behind **adapters** ([03-architecture.md](./03-architecture.md) → `server/integrations`). Switching a mock to a real provider is a one-file change — no rewrite, no cost until you choose to flip it.

---

## Cost summary by stage

- **Development (Phases 0–6):** **৳0.** Everything is free or mocked.
- **Soft launch (a few real orders):** still ~৳0 — only SMS (a few taka) + optional domain. Stay on free DB/image tiers and a commercial-friendly free host (Cloudflare) or Vercel Pro if you prefer.
- **Operating:** SMS per message + courier delivery (customer-paid shipping) + optional Vercel Pro (৳~2,400/mo) + domain (৳~1,200/yr). Payment-gateway fees only after online payments are added.

**Nothing on this list blocks you from building the complete product for free.**
