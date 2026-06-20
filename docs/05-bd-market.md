# 05 — Bangladesh Market Playbook

The features that separate a BD COD store that **makes money** from one that bleeds it on returns and failed deliveries. Treat this doc as non-optional product requirements, not "nice to have."

---

## 1. COD is the default and the risk

COD is ~80–90% of BD online retail. The risk is **non-serious orders**: fake numbers, customers who refuse delivery, repeat returners. Every returned COD parcel costs you round-trip courier fees + locked inventory.

**Mitigations baked into the build:**
- **Fraud / success-ratio check at checkout** — query the courier API with the buyer's phone to get their historical delivered-vs-cancelled ratio. Surface `fraudScore`/`fraudVerdict` on the order; let admin auto-flag risky orders for a confirmation call before dispatch.
- **OTP-verify the phone** for first-time / high-value orders.
- **Confirmation step** — `pending → confirmed` requires a human (or SMS reply) for risky orders.

## 2. Courier integration

Major couriers with APIs: **Steadfast, Pathao, RedX, eCourier, Paperfly**.

Build a **single courier interface** with provider adapters so you can switch/add couriers without touching order logic:

```
interface CourierAdapter {
  fraudCheck(phone): { totalOrders, delivered, cancelled, ratio }
  createConsignment(order): { trackingCode, consignmentId }
  getStatus(trackingCode): CourierStatus
}
```

- Start with **one** courier (Steadfast is popular for fraud-check coverage and a simple API).
- Store `courierName` + `trackingCode` on the order.
- Sync status via **cron polling** (or webhook if the provider offers it) → update `OrderStatusHistory` → send status SMS.
- Map courier statuses → your `OrderStatus` (`in_review/pending → confirmed`, `delivered → delivered`, `cancelled/returned → returned`).

## 3. Shipping zones (flat-rate, not weight)

BD stores charge by **zone**, configured in admin:

| Zone | Typical fee (BDT) |
|---|---|
| Inside Dhaka | 60–80 |
| Sub-Dhaka (Savar, Keraniganj…) | 100–120 |
| Outside Dhaka | 120–150 |

- `ShippingZone` table, admin-editable.
- Free-shipping threshold optional (e.g. orders ≥ ৳2000).
- Some stores collect **partial advance** (delivery charge via bKash) for risky/outside-Dhaka orders — design `paymentMethod` extensibly to allow this later.

## 4. SMS — the primary channel

Email is near-useless in BD retail; **SMS is how you communicate.** Provider: **BulkSMSBD / Alpha SMS / MIM SMS** (HTTP API, masked/non-masked sender).

Transactional SMS to send:
- **OTP** on login/checkout verification.
- **Order confirmed** — order number + total + items.
- **Dispatched** — courier name + tracking.
- **Delivered** — thank-you + review request link.
- **Pre-order restocked** — notify-me fulfillment.

Keep templates short (Bangla/English), respect masking rules, and rate-limit OTP sends.

## 5. Marketing reality: paid social

Most traffic is **Facebook/Instagram ads**. Build for it:
- **Meta Pixel + Conversion API (server-side)** — fire `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`. CAPI (server) is essential post-iOS for attribution; dedup with `metaEventId`.
- **Single-product landing pages** (post-launch) — FB ad → minimal landing page → embedded 1-step COD order form (name, phone, address, qty). This funnel converts far better than sending ad traffic to a full catalog. Worth a dedicated template + a lightweight `Campaign` record.
- **GA4 + GTM** for general analytics.
- **WhatsApp / Messenger** support button — many buyers want to chat before ordering.

## 6. Payments roadmap (later)

Don't integrate bKash/Nagad directly — use an **aggregator (SSLCommerz or aamarPay)** that exposes bKash, Nagad, Rocket, and cards through one integration + one settlement.
- Add a `Payment` table and extend `paymentMethod` enum.
- First use case is often **advance delivery charge** for risky orders, then full prepay discounts.

## 7. Sourcing-from-China workflow (admin, post-launch)

- `SourcingRecord` per product/batch: supplier name/URL, unit cost (CNY), shipping/import cost, computed **landed cost (BDT)**, batch qty, date.
- Enables a **margin report**: revenue − landed cost − courier − returns.
- Helps decide reorder timing alongside low-stock alerts.

## 8. Localization

- Currency: **BDT only**, symbol `৳`, whole taka, no decimals.
- Timezone: **Asia/Dhaka (UTC+6)** for all admin/customer-facing times.
- Language: launch English-first UI with Bangla where it converts (product titles, SMS). Keep an i18n scaffold so Bangla UI can follow.
- Phone format: normalize to `+8801XXXXXXXXX`; accept `01XXXXXXXXX` input.

## 9. Operational metrics that matter here

Track from early:
- **Delivery success rate** and **return rate** — overall, by area, by product. This is the health metric of a BD COD business.
- COD collected vs dispatched.
- Repeat-customer rate by phone.
- Ad-attributed revenue (via Pixel/CAPI) vs courier-confirmed revenue.
