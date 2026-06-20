# Sprint Roadmap — Overview

Phased delivery across three surfaces: **Backend**, **Frontend (storefront)**, **Admin Panel**. Sprints are ~2 weeks. Each phase ends with a **shippable, demoable** increment. The cardinal rule: get the **COD happy path** working end-to-end (browse → order → dispatch → deliver) before polishing anything.

Per-surface detail:
- [Backend sprints](./backend.md)
- [Frontend sprints](./frontend.md)
- [Admin sprints](./admin.md)

---

## Phase map

| Phase | Theme | Backend | Frontend | Admin | Outcome |
|---|---|---|---|---|---|
| **0** | Foundation | Repo, DB, Prisma, auth scaffold, CI, Cloudinary | App shell, layout, design tokens | Admin shell + auth | Deployable skeleton |
| **1** | Catalog | Category/Product/Variant schema + services | Listing + category pages, sold count | Product & category CRUD, image upload | Browse real products |
| **2** | Product detail | Reviews/specs read APIs | PDP: variant switch, gallery, specs, description, reviews, related | Review moderation | Full PDP |
| **3** | Stock & pre-order | Stock logic, PreOrderRequest service, notify job | Out-of-stock → notify-me form | Pre-order request queue, restock notify | Pre-orders live |
| **4** | Checkout (COD) | Order service, shipping zones, fraud check, stock txn | Cart, COD checkout, confirmation, track-by-phone | Order management, status flow | **Orders happen** |
| **5** | Fulfillment (BD) | Courier adapter, SMS, status sync cron, Meta CAPI | Order tracking timeline, SMS-linked review | One-click dispatch, courier status | **End-to-end COD ops** |
| **6** | Polish & growth | Search/filter APIs, coupons, analytics events | Search, filters, coupons at checkout, SEO | Dashboard/reports, coupons CRUD | Launch-ready |
| **7+** | Post-launch | Payments aggregator, accounts, wishlist, returns, sourcing/margin, landing pages | Customer accounts, wishlist, landing pages | Returns, sourcing, profit reports | Scale features |

**MVP launch = Phases 0–6.** Phase 7+ is iterative after go-live.

---

## Definition of Done (every sprint)

- Zod-validated inputs; server-side recompute of anything money/stock related.
- Prisma migration committed; no schema drift.
- Mobile-first responsive; tested on a mid-range device viewport.
- Error states + loading states handled (no raw exceptions to users).
- Admin actions audit-logged where they mutate orders/stock.
- Deployed to a preview env and smoke-tested.

## Sequencing dependencies

- Frontend Phase 1 needs Backend Phase 1 schema/services.
- Checkout (Phase 4) is the integration point — backend order service + frontend cart + admin order view land together.
- Courier/SMS (Phase 5) depends on Phase 4 orders existing.
- Don't start Phase 6 polish until the Phase 5 happy path is verified with a real test order through a courier sandbox.

## Team split suggestion (small team)

- If solo: go strictly phase-by-phase, full-stack per phase.
- If 2–3 devs: one owns backend/services, one owns storefront, admin shared. Sync at each phase's checkout/fulfillment integration points.
