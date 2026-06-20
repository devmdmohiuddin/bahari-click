# Bahari Click — Project Documentation

E-commerce storefront for products sourced from China and sold in the Bangladesh (BD) market.
**Cash on Delivery (COD) only** for launch. Currency: **BDT only**.

---

## Document index

| Doc | What it covers |
|---|---|
| [01 — Product Spec](./01-product-spec.md) | Full feature list (storefront, admin, BD-specific) |
| [02 — Tech Stack](./02-tech-stack.md) | Recommended stack + rationale + rejected alternatives |
| [03 — System Architecture](./03-architecture.md) | How the pieces fit, request flows, deployment |
| [04 — Data Model](./04-data-model.md) | Entities, relationships, Prisma schema |
| [05 — BD Market Playbook](./05-bd-market.md) | Couriers, fraud check, shipping zones, SMS, FB pixel |
| [06 — Cost & Free Tiers](./06-cost-and-free-tiers.md) | What's free, free-tier limits, zero-cost dev setup |
| [Sprints — Overview](./sprints/README.md) | Phased roadmap across all three surfaces |
| [Sprints — Backend](./sprints/backend.md) | Backend sprints, feature by feature |
| [Sprints — Frontend](./sprints/frontend.md) | Storefront sprints, feature by feature |
| [Sprints — Admin Panel](./sprints/admin.md) | Admin sprints, feature by feature |

---

## TL;DR

- **Build custom.** No Medusa/Shopify. Needs are simple now but the data model (variants, pre-orders, China-sourcing, BD courier flow) is custom enough that a generic platform fights you.
- **One codebase.** Next.js (App Router) handles storefront, admin, and API (Server Actions + Route Handlers). No separate NestJS service yet.
- **Phone-first.** Phone/OTP is the primary identity. Guest checkout is the default. Email is optional.
- **BD-native from day one.** Courier integration, fraud check, shipping zones, and SMS are not "later" — they are core to COD profitability.

## The three surfaces

1. **Storefront** (`/`) — public buyers. Browse, product detail, cart, COD checkout, order tracking by phone.
2. **Admin Panel** (`/admin`) — internal staff. Products, inventory, orders, courier dispatch, pre-orders, reviews, reports.
3. **Backend** — Server Actions + Route Handlers + Prisma + Postgres. Shared by both surfaces; also exposes webhooks for couriers/SMS.

## Guiding principles

- Ship the **happy COD path** end-to-end before polishing.
- Every order must be **dispatchable to a courier** and **trackable by the customer's phone**.
- **Fraud check before confirm** — protect margin on COD.
- Mobile-first. Most BD buyers arrive from a Facebook/Instagram ad on a mid-range phone.
