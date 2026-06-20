# 04 — Data Model

Relational schema. Money is `Int` in **BDT (whole taka)**. Times are UTC. The schema below is the source of truth for Phase-1 migrations; later-phase tables are marked.

---

## Entity overview

```
Category ─┐
          ├─< Subcategory ─< Product ─< Variant ─< VariantImage
          │                    │  │       └─< OrderItem
          │                    │  ├─< ProductImage
          │                    │  ├─< Specification
          │                    │  ├─< Review
          │                    │  └─< PreOrderRequest
Order ─< OrderItem             │
  └─ OrderStatusHistory        │
Customer ─< Order              │
Coupon ─< (applied to Order)   │
ShippingZone ─ (used by Order) │
AdminUser ─ AuditLog ──────────┘
```

- **Related products** = read-time query (same subcategory, exclude self, order by soldCount). No stored join table at launch.
- A product has variants for **color × size**. Images link to a variant (for the variant-switch behaviour) and/or to the product (shared gallery).

---

## Core tables (Launch)

### Category / Subcategory
```
Category      id, name, slug, image, sortOrder, isActive
Subcategory   id, categoryId→Category, name, slug, image, sortOrder, isActive
```
*(Could be one self-referencing `Category` with `parentId`; two explicit tables are simpler to start.)*

### Product
```
Product
  id, title, slug, subcategoryId→Subcategory
  description        Text (rich)
  basePrice          Int (BDT)              # default; variant may override
  compareAtPrice     Int?                   # strikethrough
  soldCountReal      Int  @default(0)       # incremented on delivered orders
  soldCountBoost     Int  @default(0)       # manual social-proof offset
  isPublished        Bool @default(false)
  isFeatured         Bool @default(false)
  ratingAvg          Float @default(0)      # denormalized from approved reviews
  ratingCount        Int   @default(0)
  createdAt, updatedAt
  # display sold = soldCountReal + soldCountBoost
```

### Variant
```
Variant
  id, productId→Product
  sku            String @unique
  color          String?
  size           String?
  price          Int?                 # null → use Product.basePrice
  stock          Int  @default(0)
  isActive       Bool @default(true)
  @@unique([productId, color, size])
```

### Images
```
ProductImage  id, productId→Product, url, alt, sortOrder
VariantImage  id, variantId→Variant, url, alt, sortOrder   # drives variant-switch image
```
*(URLs are Cloudinary public IDs/URLs.)*

### Specification
```
Specification id, productId→Product, key, value, sortOrder   # "Material: PU Leather"
```

### Customer
```
Customer
  id
  phone        String @unique          # +8801XXXXXXXXX, primary identity
  name         String?
  email        String?                 # optional
  isVerified   Bool @default(false)    # phone OTP verified
  createdAt
  # guests may have a Customer row created at checkout without OTP
```

### Address
```
Address
  id, customerId→Customer?
  name, phone, line1, area, city, zoneId→ShippingZone, note
  # checkout may store a snapshot on the Order rather than reference
```

### ShippingZone  **[BD]**
```
ShippingZone
  id, name           # "Inside Dhaka", "Sub-Dhaka", "Outside Dhaka"
  fee  Int (BDT)
  isActive
```

### Order
```
Order
  id
  orderNumber     String @unique        # BC-25061-0042
  customerId→Customer?
  # address snapshot (don't depend on mutable Address):
  custName, custPhone, custAddress, custArea, custCity
  zoneId→ShippingZone, shippingFee Int
  subtotal Int, discount Int, total Int          # all server-computed
  couponId→Coupon?
  paymentMethod   Enum(COD)              # only COD now; extensible
  status          Enum(OrderStatus) @default(pending)
  fraudScore      Int?                   # from courier fraud API
  fraudVerdict    String?                # e.g. "good / risky"
  courierName     String?                # steadfast / pathao / redx
  trackingCode    String?
  internalNote    String?
  metaEventId     String?                # for FB CAPI dedup
  createdAt, updatedAt
```
```
OrderItem
  id, orderId→Order, variantId→Variant?
  productTitle String, variantLabel String   # snapshot for history
  unitPrice Int, qty Int, lineTotal Int       # snapshot
```
```
OrderStatusHistory
  id, orderId→Order, status Enum, note, changedByAdminId→AdminUser?, createdAt
```

**OrderStatus enum:** `pending → confirmed → packed → dispatched → delivered → returned → cancelled`
(`returned`/`cancelled` are terminal; allow `pending → cancelled` directly.)

### PreOrderRequest (notify-me)
```
PreOrderRequest
  id, productId→Product, variantId→Variant?
  phone, name?, qty Int @default(1)
  status   Enum(pending | notified | fulfilled | cancelled)
  createdAt, notifiedAt?
```

### Review
```
Review
  id, productId→Product
  customerId→Customer?  | guestName String
  rating  Int            # 1..5
  comment Text?
  imageUrls String[]     # optional (post-launch)
  isApproved Bool @default(false)    # moderation
  createdAt
  # only verified-buyer reviews can be auto-trusted later
```

### Coupon
```
Coupon
  id, code String @unique
  type     Enum(percent | fixed)
  value    Int                  # percent (0..100) or fixed BDT
  minOrder Int?, maxDiscount Int?
  usageLimit Int?, usedCount Int @default(0)
  startsAt?, endsAt?
  isActive Bool @default(true)
```

### AdminUser & AuditLog
```
AdminUser  id, name, email, passwordHash | authRef, role Enum(OWNER|MANAGER|STAFF), isActive
AuditLog   id, adminId→AdminUser, action, entity, entityId, diff Json, createdAt
```

---

## Post-launch tables

```
Wishlist        id, customerId→Customer, productId→Product, createdAt
ProductQuestion id, productId→Product, phone/name, question, answer?, isPublished
Return          id, orderId→Order, reason, status, refundAmount?, createdAt
SourcingRecord  id, productId→Product, supplierName, supplierUrl, unitCostCNY,
                shippingCost, landedCostBDT, batchQty, purchasedAt   # margin analytics
Payment         id, orderId→Order, provider, txnId, amount, status   # when online pay added
Campaign        id, title, slug, type(flash|landing), startsAt, endsAt, config Json
```

---

## Indexing notes

- `Product`: index `subcategoryId`, `isPublished`, `(isFeatured)`, `slug`. FTS index on `title`.
- `Variant`: `productId`, unique `sku`, unique `(productId,color,size)`.
- `Order`: index `status`, `custPhone`, unique `orderNumber`, `createdAt`.
- `Review`: index `(productId, isApproved)`.
- `PreOrderRequest`: index `(productId, status)`.

## Derived / denormalized fields (keep in sync)

- `Product.ratingAvg` / `ratingCount` — recompute on review approve/delete.
- `Product.soldCountReal` — increment when an order reaches `delivered`.
- `Coupon.usedCount` — increment on order confirm; guard against over-limit.
