# 01 — Product Specification

Full feature list for Bahari Click. Items marked **[Launch]** are required for v1. **[Post-launch]** are planned but deferred. **[BD]** marks Bangladesh-specific requirements.

---

## 1. Catalog & browsing

- **[Launch]** Categories with sub-types — e.g. *Bags* → Purse, Handbag, Wallet, Clutch. Two-level taxonomy (Category → Subcategory). Optionally self-referencing for deeper nesting later.
- **[Launch]** Product listing / category pages with pagination or infinite scroll.
- **[Launch]** **Sold count** per product (social proof). Real sold units + an optional manual "base boost" offset controllable from admin.
- **[Launch]** Sorting: newest, price low→high, high→low, best-selling.
- **[Launch]** Filters: category, subcategory, price range, color, size, in-stock only.
- **[Launch]** Search by product name (Postgres full-text to start; upgrade path noted in architecture).
- **[Post-launch]** Faceted search with typo tolerance (Meilisearch/Typesense).

## 2. Product detail page (PDP)

- **[Launch]** **Variants** — color and size. Selecting a variant updates the displayed image. First variant's image shown by default.
- **[Launch]** **Image gallery** — multiple images per product, with variant-linked images. Thumbnail strip + main image + zoom.
- **[Launch]** **Specifications** section (key/value attributes).
- **[Launch]** **Description** section (rich text).
- **[Launch]** **Reviews & ratings** — average rating, star breakdown, individual reviews, with moderation (`approved` flag). Customers submit reviews (guest name + rating + comment; optional photo post-launch).
- **[Launch]** **Stock status** per variant. If out of stock → show **"Notify me / Pre-order"** form instead of Add-to-cart.
- **[Launch]** **Related / suggested products** at the bottom (same-category read-time query to start).
- **[Launch]** Price display in **BDT** (whole taka). Optional compare-at / discount price with strikethrough.
- **[Post-launch]** Product Q&A (customer questions answered by admin).
- **[Post-launch]** Size guide / size chart per category.

## 3. Cart & checkout (COD)

- **[Launch]** Cart (persisted in localStorage for guests; merged to account on login).
- **[Launch]** **Guest checkout default** — name, **phone**, full address, area/zone. Email optional.
- **[Launch] [BD]** **Shipping zones** — Inside Dhaka / Sub-Dhaka / Outside Dhaka, flat-rate per zone (admin-configurable).
- **[Launch] [BD]** **Fraud / COD risk check** on the phone number before order confirmation (courier success-ratio API).
- **[Launch]** Order placement → **order confirmation page** + confirmation SMS.
- **[Launch]** **Order tracking by phone number** (no login required) — current status timeline.
- **[Launch]** **Coupons / vouchers** — percentage or fixed discount, min-order, expiry, usage limit. (Simple version at launch.)
- **[Post-launch]** Abandoned-cart capture + recovery SMS.
- **[Post-launch]** Online payments — bKash, Nagad, cards via SSLCommerz / aamarPay aggregator.

## 4. Accounts & auth

- **[Launch] [BD]** **Phone + OTP** login (SMS OTP). Email/password optional secondary.
- **[Launch]** Guest order tracking without account.
- **[Post-launch]** Customer account area — order history, saved addresses, wishlist.
- **[Launch]** **Admin auth** — role-based (Owner, Manager, Staff). Separate from customer auth.

## 5. Pre-orders & notify-me

- **[Launch]** Out-of-stock variant → capture **PreOrderRequest** (product, variant, phone, optional qty).
- **[Launch]** Admin view of pre-order requests; mark restocked → trigger notify SMS.
- **[Post-launch]** Auto-notify when stock replenished.

## 6. Marketing & growth **[BD]**

- **[Launch] [BD]** **Facebook Pixel + Conversion API** (server-side) — most traffic is paid social; CAPI matters for iOS attribution.
- **[Launch]** Google Analytics 4 / GTM.
- **[Launch]** SEO — per-page meta, Open Graph, JSON-LD product structured data, sitemap.xml, robots.txt.
- **[Post-launch] [BD]** **Single-product landing pages** (FB-ad → landing → 1-click COD form). The dominant BD ad funnel; worth a dedicated template.
- **[Post-launch]** Flash sales / campaign pages with countdown.
- **[Post-launch]** Wishlist, recently viewed.
- **[Post-launch]** WhatsApp order/support button.

## 7. Order operations (admin)

- **[Launch]** Order list with status filter, search by phone/order ID.
- **[Launch]** Order detail → confirm, edit items, cancel, add internal note.
- **[Launch]** Order status flow: `pending → confirmed → packed → dispatched → delivered → returned/cancelled`.
- **[Launch] [BD]** **One-click dispatch to courier** (create consignment via Steadfast/Pathao/RedX API); store tracking ID; sync status via webhook/polling.
- **[Launch]** **Inventory management** — stock per variant, low-stock alerts, stock adjustments with reason.
- **[Launch]** **SMS notifications** on status changes (confirmed, dispatched, delivered).
- **[Post-launch]** Returns / exchange workflow (COD returns are common).
- **[Post-launch]** Purchase / sourcing tracking (China supplier, cost, landed cost, margin).

## 8. Admin catalog management

- **[Launch]** CRUD products with variants, images, specs, description.
- **[Launch]** CRUD categories/subcategories.
- **[Launch]** Image upload (Cloudinary) with reorder + variant linking.
- **[Launch]** Bulk-ish helpers: duplicate product, toggle publish/feature.
- **[Launch]** Coupons CRUD.
- **[Launch]** Review moderation queue.

## 9. Reporting & dashboard (admin)

- **[Launch]** Dashboard: today/7-day/30-day sales (confirmed & delivered), order counts by status, COD collected.
- **[Launch]** Top-selling products, low-stock list.
- **[Post-launch] [BD]** Delivery success rate / return rate by area & by product (key BD COD metric).
- **[Post-launch]** Profit report (revenue − landed cost − shipping − returns).

## 10. Content & legal pages

- **[Launch]** **About**, **Delivery Info** (zones, times, COD explained), **Contact Us** (phone/Facebook/address + contact form).
- **[Launch]** **Returns & Refunds**, **Privacy Policy**, **Terms & Conditions** — also a **prerequisite for Meta/Facebook ad approval + Pixel**, so live before paid ads.
- **[Launch]** All linked in footer + included in sitemap; brand-styled with per-page SEO.
- **[Post-launch]** Admin CMS to edit page content (launch as MDX/constants first).

## 11. Non-functional

- **[Launch]** Mobile-first, fast on 3G/4G. Image optimization, ISR for catalog pages.
- **[Launch]** Bangla + English ready (i18n scaffold; can launch English-first with Bangla labels where it matters).
- **[Launch]** Basic rate-limiting on OTP, review, and pre-order endpoints (anti-abuse).
- **[Launch]** Audit log on admin actions (who changed an order/stock).
- **[Launch]** Backups (managed by DB host) + environment separation (dev / prod).
