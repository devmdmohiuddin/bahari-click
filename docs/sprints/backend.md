# Backend Sprints

Next.js Server Actions + Route Handlers + Prisma + Postgres. Organized feature-by-feature. Each feature lists: **build**, **acceptance**, and **dependencies**. See [data model](../04-data-model.md) and [architecture](../03-architecture.md).

---

## Phase 0 — Foundation

### F0.1 Repo & tooling
- **Build:** Next.js (App Router, TypeScript), ESLint/Prettier, Tailwind + shadcn init, `.env.example`, commit hooks. GitHub repo + Vercel project. Sentry init.
- **Acceptance:** `dev` runs; deploy to Vercel preview succeeds.

### F0.2 Database & Prisma
- **Build:** Provision Neon (or Supabase) Postgres. Prisma init, `db.ts` singleton, migration pipeline. Seed script scaffold.
- **Acceptance:** `prisma migrate dev` works; seed runs; connection pooled for serverless.

### F0.3 Auth scaffold
- **Build:** Better Auth (or Auth.js v5). Customer **phone+OTP** provider (mock SMS in dev). Admin auth with **roles** (OWNER/MANAGER/STAFF). Route middleware guarding `/admin`.
- **Acceptance:** Can request OTP (logged in dev), verify, get session; admin login gated by role.
- **Deps:** F0.2.

### F0.4 Media pipeline
- **Build:** Cloudinary account, signed-upload Route Handler, server util to store/transform.
- **Acceptance:** Upload returns a CDN URL; admin can later consume it.

### F0.5 Service-layer conventions
- **Build:** `server/services`, `server/actions`, `server/validators` (Zod), `server/integrations` skeleton. Error + result helpers. Audit-log helper.
- **Acceptance:** A sample action validates → calls a service → returns typed result.

---

## Phase 1 — Catalog backend

### F1.1 Category/Subcategory
- **Build:** Schema + migrations. Service: list active tree, by-slug. Cache with tags.
- **Acceptance:** Query returns nested category→subcategory tree.

### F1.2 Product + Variant + Images + Specs
- **Build:** Schema per data model. Services: create/update/publish product with variants, images (product + variant), specs. Slug generation. Sold-count display field (`real + boost`).
- **Acceptance:** A product with 2 colors × 2 sizes, gallery, variant images, and specs persists and reads back correctly.
- **Deps:** F0.4, F1.1.

### F1.3 Listing read API
- **Build:** Paginated product query by category/subcategory; sort (newest/price/best-selling); only published.
- **Acceptance:** Listing endpoint returns correct page, sort, counts.

---

## Phase 2 — Product detail backend

### F2.1 PDP read service
- **Build:** Full product fetch: variants, images (product+variant), specs, ratingAvg/count, related (same-subcategory, exclude self, by sold).
- **Acceptance:** Single query/service returns everything the PDP renders.

### F2.2 Reviews
- **Build:** Schema. Create review (guest/customer, rating, comment) → `isApproved=false`. List **approved** reviews + rating breakdown. Recompute `Product.ratingAvg/ratingCount` on approve/delete. Rate-limit create.
- **Acceptance:** Submitted review is hidden until approved; approval updates aggregates.

---

## Phase 3 — Stock & pre-order backend

### F3.1 Stock model
- **Build:** Authoritative `Variant.stock`. Service helpers: availability per variant, low-stock query. Adjustment log (reason).
- **Acceptance:** Stock reads correct; adjustments recorded.

### F3.2 Pre-order / notify-me
- **Build:** `PreOrderRequest` schema + create service (product/variant/phone/qty). Status transitions. Restock → enqueue notify job.
- **Acceptance:** Out-of-stock variant accepts a request; restock marks `notified` and queues SMS.
- **Deps:** F5.2 (SMS) for actual send; queue stub before that.

---

## Phase 4 — Checkout / Orders backend (the core)

### F4.1 Shipping zones
- **Build:** `ShippingZone` CRUD service + fee lookup. Optional free-ship threshold.
- **Acceptance:** Zone fee resolves correctly at checkout.

### F4.2 Coupons (engine)
- **Build:** `Coupon` schema + validation service (active, window, min-order, usage limit, percent/fixed, max discount). `usedCount` increment guarded.
- **Acceptance:** Valid coupon discounts correctly; invalid/expired/over-limit rejected.

### F4.3 Order placement
- **Build:** `Order` + `OrderItem` + `OrderStatusHistory` schema. Order service:
  1. Validate cart (Zod).
  2. **Server-side recompute** unit prices, subtotal, coupon, shipping → total. Never trust client.
  3. **Transaction:** check + decrement variant stock; reject on insufficient.
  4. Generate `orderNumber`. Snapshot address + item prices.
  5. Persist; write status history `pending`.
- **Acceptance:** Concurrent orders can't oversell; totals match server math; order number unique.
- **Deps:** F4.1, F4.2, F3.1.

### F4.4 Fraud check **[BD]**
- **Build:** Courier fraud-check call in checkout flow → store `fraudScore`/`fraudVerdict`. Fail-open (don't block order if API down; flag for review).
- **Acceptance:** Order carries a risk verdict; API failure degrades gracefully.
- **Deps:** F5.1 adapter (can stub first).

### F4.5 Order status & tracking service
- **Build:** Status transition service (validates allowed transitions, writes history, fires side-effects). Public **track-by-phone+orderNumber** read (rate-limited).
- **Acceptance:** Illegal transitions rejected; guest tracking returns timeline.

---

## Phase 5 — Fulfillment integrations **[BD]**

### F5.1 Courier adapter
- **Build:** `CourierAdapter` interface + Steadfast adapter: `fraudCheck`, `createConsignment`, `getStatus`. Map courier→internal status. Idempotent.
- **Acceptance:** Dispatch creates a real sandbox consignment; tracking code stored.

### F5.2 SMS gateway
- **Build:** SMS adapter (BulkSMSBD/Alpha). Templates: OTP, confirmed, dispatched, delivered, restocked. Rate-limit + logging.
- **Acceptance:** Each lifecycle event sends the right SMS (sandbox).

### F5.3 Status sync job
- **Build:** Vercel Cron + QStash: poll courier for dispatched orders, update status/history, trigger SMS, increment `soldCountReal` + `Coupon.usedCount` appropriately on delivered.
- **Acceptance:** Status changes flow from courier → DB → SMS without manual action.

### F5.4 Meta Conversion API
- **Build:** Server-side CAPI for `Purchase` (+ optionally checkout events), dedup via `metaEventId`.
- **Acceptance:** Purchase event appears in Meta Events Manager, deduped with client pixel.

---

## Phase 6 — Search, polish, analytics

### F6.1 Search & filters
- **Build:** Postgres full-text search on title; filter by subcategory/price/color/size/in-stock; combine with sort + pagination.
- **Acceptance:** Search + multi-filter queries return correct, fast results.

### F6.2 Reporting queries
- **Build:** Aggregations: sales by period, orders by status, top products, low stock, COD collected.
- **Acceptance:** Dashboard endpoints return correct numbers vs hand-checked data.

### F6.3 Hardening
- **Build:** Rate limits (OTP/review/preorder/tracking), webhook signature verification, audit-log coverage, Zod everywhere, error monitoring review.
- **Acceptance:** Abuse endpoints throttled; no unvalidated mutation path.

### F6.4 Contact message capture
- **Build:** `ContactMessage` schema (name, phone, email?, subject, message, isRead, createdAt). Server Action to submit (Zod + rate-limit). Optional admin email/SMS notify on new message.
- **Acceptance:** Contact form submission persists a message; spam-rate-limited.
- **Deps:** Powers storefront **S6.4** and admin **A6.4**.

---

## Phase 7+ — Post-launch backend

- **Payments:** SSLCommerz/aamarPay adapter, `Payment` table, extend `paymentMethod`, advance-charge flow.
- **Accounts:** order history, saved addresses, wishlist service.
- **Returns:** `Return` workflow + stock/refund effects.
- **Sourcing/margin:** `SourcingRecord`, landed-cost calc, profit report.
- **Search upgrade:** Meilisearch/Typesense if FTS outgrown.
- **Campaigns:** `Campaign` records for flash sales / landing pages.
