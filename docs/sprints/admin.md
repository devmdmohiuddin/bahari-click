# Admin Panel Sprints

Internal tool at `/admin`, same Next.js app, role-gated (OWNER / MANAGER / STAFF). shadcn data-tables + forms, TanStack Query for interactive lists. This is where the business is actually run — prioritize order ops and inventory over prettiness. Feature-by-feature below.

---

## Phase 0 — Foundation

### A0.1 Admin shell & auth
- **Build:** `/admin` layout (sidebar nav with **Bahari Click logo**, topbar, user menu), role-gated middleware, login page. Empty dashboard placeholder. **Reuse the same [brand tokens](../07-brand-guidelines.md)** (orange primary, pill buttons, brand fonts) but a calmer, data-dense layout — orange as accent, neutral surfaces for tables/forms.
- **Acceptance:** Only authenticated admins reach `/admin`; role restricts nav items; UI uses brand tokens (no hard-coded colors).
- **Deps:** Backend F0.3.

---

## Phase 1 — Catalog management

### A1.1 Categories & subcategories
- **Build:** CRUD tables for Category/Subcategory (name, slug, image, sort, active). Reorder.
- **Acceptance:** Create/edit/disable categories; reflected on storefront.

### A1.2 Product editor
- **Build:** Create/edit product form: title, subcategory, description (rich text editor), base price, compare-at, publish/feature toggles, **sold-count boost** field. **Variant matrix** (color × size → sku/price/stock). **Specifications** key/value repeater.
- **Acceptance:** Full product with variants + specs saved in one flow; validation errors clear.
- **Deps:** Backend F1.2.

### A1.3 Image management
- **Build:** Cloudinary upload widget, drag-reorder gallery, **link images to variants** (drives storefront variant-switch). Product-level + variant-level galleries.
- **Acceptance:** Uploaded images appear; variant-linked image shows on storefront variant select.
- **Deps:** Backend F0.4.

### A1.4 Product list
- **Build:** Searchable/filterable product table (status, category, stock), quick toggles (publish/feature), duplicate product.
- **Acceptance:** Manage many products efficiently from one table.

---

## Phase 2 — Reviews

### A2.1 Review moderation
- **Build:** Queue of pending reviews; approve/reject; view product context. Bulk approve.
- **Acceptance:** Approving a review publishes it and updates the product rating.
- **Deps:** Backend F2.2.

---

## Phase 3 — Inventory & pre-orders

### A3.1 Inventory
- **Build:** Stock view per variant, **low-stock alert list**, stock adjustment with reason (audit-logged).
- **Acceptance:** Adjustments change stock and appear in audit log; low-stock list accurate.
- **Deps:** Backend F3.1.

### A3.2 Pre-order request queue
- **Build:** Table of PreOrderRequests (product, variant, phone, qty, status). Mark restocked → trigger notify; status transitions.
- **Acceptance:** Restock action flips status and queues notify SMS.
- **Deps:** Backend F3.2 / F5.2.

---

## Phase 4 — Order management (core)

### A4.1 Order list
- **Build:** Orders table: filter by status, search by phone/order number, date range. Status badges, total, zone, **fraud verdict** indicator.
- **Acceptance:** Find any order fast; risky orders visibly flagged.
- **Deps:** Backend F4.3.

### A4.2 Order detail & actions
- **Build:** Order view: items, customer/address snapshot, totals, coupon, fraud score, status history. Actions: **confirm / cancel**, edit items/qty (recompute), add internal note. Allowed-transition enforcement.
- **Acceptance:** Status changes write history; edits recompute totals; illegal transitions blocked.
- **Deps:** Backend F4.5.

---

## Phase 5 — Fulfillment **[BD]**

### A5.1 One-click courier dispatch
- **Build:** From an order, choose courier → **create consignment**; store tracking code; status → dispatched. Show tracking link. Re-run fraud check button.
- **Acceptance:** Dispatch creates a sandbox consignment and records tracking.
- **Deps:** Backend F5.1.

### A5.2 Courier status & SMS visibility
- **Build:** Show synced courier status on order; SMS log per order (what was sent/when). Manual "resend SMS" action.
- **Acceptance:** Synced status + SMS history visible; manual resend works.
- **Deps:** Backend F5.2 / F5.3.

---

## Phase 6 — Dashboard, coupons, reports

### A6.1 Dashboard
- **Build:** Today / 7-day / 30-day sales (confirmed & delivered), orders by status, COD collected, top products, low-stock widget.
- **Acceptance:** Numbers match hand-checked data; loads fast.
- **Deps:** Backend F6.2.

### A6.2 Coupons
- **Build:** Coupon CRUD (code, percent/fixed, min-order, max discount, usage limit, window, active). Usage stats.
- **Acceptance:** Created coupon validates correctly at checkout; usage tracked.
- **Deps:** Backend F4.2.

### A6.3 Settings & roles
- **Build:** Shipping zones CRUD (fees), store settings (banner, contact, free-ship threshold), **admin user/role management**, audit-log viewer.
- **Acceptance:** Zone fee edits reflect at checkout; roles restrict actions; audit log searchable.

---

## Phase 7+ — Post-launch admin

- **Returns/exchange** workflow (reason, refund, restock effects).
- **Sourcing & margin:** SourcingRecord entry (supplier, CNY cost, landed cost), **profit report** (revenue − landed − courier − returns).
- **Delivery analytics:** success/return rate by area and product (key BD COD metric).
- **Campaign manager:** flash sales / landing pages.
- **Payment reconciliation** view once online payments are live.
- **Bulk import/export** (CSV) for products.
