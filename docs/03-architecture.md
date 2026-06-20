# 03 — System Architecture

One Next.js application serving three surfaces (storefront, admin, API), backed by Postgres via Prisma, with BD integration adapters (courier, SMS, payments-later) behind a clean service layer.

---

## High-level diagram

```
                         ┌──────────────────────────────────────┐
                         │            Next.js (Vercel)           │
   Buyers ──────────────▶│  Storefront  (/)      RSC + ISR       │
   (mobile, FB ads)      │  Admin Panel (/admin) RSC + client    │
                         │  API/Webhooks (/api/*) Route Handlers │
   Staff ───────────────▶│  Server Actions (mutations)          │
                         └───────┬───────────────┬───────────────┘
                                 │               │
                      ┌──────────▼─────┐   ┌──────▼───────────────┐
                      │  Service layer │   │  Integration adapters│
                      │  (domain logic)│   │  Courier / SMS / FB  │
                      └──────────┬─────┘   │  CAPI / Payments(L)  │
                                 │         └──────┬───────────────┘
                      ┌──────────▼─────┐          │
                      │ Prisma + Postgres│   external APIs:
                      │ (Neon/Supabase)  │   Steadfast/Pathao/RedX,
                      └──────────────────┘   BulkSMS, Meta, Cloudinary

   Images: Cloudinary (upload + transform + CDN)
   Jobs:   Vercel Cron + Upstash QStash (notify, status sync, reports)
```

---

## Layering (keep domain logic out of components)

```
app/                      # routes (storefront + admin + api)
  (shop)/...              # storefront route group
  admin/...               # admin route group (auth-guarded)
  api/                    # Route Handlers: webhooks, public endpoints
components/               # UI (shadcn-based)
lib/
  db.ts                   # Prisma client singleton
  auth.ts                 # auth config (phone OTP, admin roles)
server/
  services/               # domain logic: orders, inventory, pricing, reviews…
  actions/                # Server Actions (thin: validate → call service)
  integrations/
    courier/              # steadfast.ts, pathao.ts (common interface)
    sms/                  # provider adapter
    meta/                 # Pixel + Conversion API
    payments/             # (later) sslcommerz adapter
  validators/             # Zod schemas (shared client/server)
prisma/
  schema.prisma
  migrations/
```

**Rule:** Server Actions and Route Handlers stay thin — validate input with Zod, then delegate to a **service** function. Services own business rules and are the only thing that touches Prisma + integrations. This keeps the door open to later extract a standalone API.

---

## Key request flows

### Browse → PDP
RSC fetches category/product data (cached via ISR + tag-based revalidation). Variant switch is client-side from data already hydrated; image swaps to the selected variant's first image.

### Checkout (COD)
1. Client posts cart + customer (name, phone, address, zone) to a **Server Action**.
2. Service: validate (Zod) → recompute prices/stock **server-side** (never trust client totals) → apply coupon → compute shipping by zone.
3. **Fraud check**: call courier fraud API with the phone → attach risk score to order.
4. Create `Order` (`pending`), decrement stock atomically (transaction), clear cart.
5. Fire **Meta CAPI** purchase event + **confirmation SMS**.
6. Return order number → confirmation page.

### Out of stock → notify-me
Variant `stock = 0` → PDP shows pre-order form → Server Action creates `PreOrderRequest`. Admin restock flips stock and triggers notify SMS (job).

### Dispatch to courier (admin)
Admin clicks dispatch → service calls courier adapter → creates consignment → stores `trackingCode` → order `dispatched`. A **cron job** (or webhook if provider supports it) syncs delivery status back and sends status SMS.

### Order tracking (guest)
Public page: enter phone + order number → service returns the status timeline. Rate-limited.

---

## Data integrity & correctness

- **Stock decrement** inside a DB transaction; reject if insufficient (prevents oversell on concurrent checkout).
- **Prices/totals** always recomputed server-side from DB at order time; snapshot unit price into `OrderItem` (so later price edits don't rewrite history).
- **Idempotency** on webhooks (courier/SMS/payment) via event IDs.
- **Audit log** for admin mutations on orders/stock.

## Caching & performance

- Catalog + PDP: **ISR** with on-demand revalidation tags (`revalidateTag('product:<id>')`) on admin edits.
- Cloudinary handles image format/size; use Next `<Image>` with their loader.
- Mobile-first budgets; lazy-load below-the-fold gallery + reviews.

## Security

- Admin routes behind role-checked middleware (Owner/Manager/Staff).
- OTP, review, pre-order, tracking endpoints rate-limited (Upstash Ratelimit).
- All mutations validated with Zod; no client-trusted prices or stock.
- Webhook signatures verified per provider.
- Secrets only in env; least-privilege DB user.

## Scaling path (when/if needed)

1. Search outgrows Postgres FTS → add **Meilisearch/Typesense**.
2. Need a mobile app / many clients → extract **NestJS API** from the service layer (schema unchanged).
3. Heavy media/traffic → already on Cloudinary CDN; add read replicas on the DB host.
