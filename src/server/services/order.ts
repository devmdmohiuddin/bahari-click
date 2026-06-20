import { OrderStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cacheTags, revalidateTags } from "@/lib/cache";
import { conflict, notFound, validationError } from "@/lib/errors";
import { incrementCouponUsage, validateCoupon } from "@/server/services/coupon";
import { resolveShippingFee } from "@/server/services/shipping";
import { placeOrderSchema, type PlaceOrderInput } from "@/server/validators/order";

// Order placement — the core write path. Everything money/stock is recomputed
// server-side; stock is decremented atomically inside a transaction so
// concurrent checkouts can't oversell. See docs/03-architecture.md.

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayOfYear(d: Date) {
  const diff = d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor(diff / 86_400_000);
}

/** Human-friendly, unique order number e.g. BC-26171-0042 (yy + day-of-year + seq). */
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const prefix = `BC-${String(now.getUTCFullYear()).slice(-2)}${String(dayOfYear(now)).padStart(3, "0")}`;
  const todayCount = await db.order.count({ where: { createdAt: { gte: startOfUtcDay(now) } } });

  let seq = todayCount + 1;
  // The @unique constraint is the hard guarantee; this loop avoids obvious clashes.
  for (;;) {
    const candidate = `${prefix}-${String(seq).padStart(4, "0")}`;
    const exists = await db.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    seq += 1;
  }
}

export interface PlaceOrderOptions {
  customerId?: string | null;
  /** Optional fraud verdict attached by the checkout flow (F4.4). */
  fraud?: { score: number; verdict: string } | null;
}

export async function placeOrder(input: PlaceOrderInput, options: PlaceOrderOptions = {}) {
  const data = placeOrderSchema.parse(input);

  // 1. Load the referenced variants (active only) with their product price/title.
  const variantIds = [...new Set(data.items.map((i) => i.variantId))];
  const variants = await db.variant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    select: {
      id: true,
      price: true,
      color: true,
      size: true,
      product: { select: { id: true, title: true, basePrice: true } },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  // 2. Server-side recompute of unit prices, line totals, subtotal.
  let subtotal = 0;
  const lines = data.items.map((item) => {
    const v = byId.get(item.variantId);
    if (!v) throw validationError("A selected item is no longer available");
    const unitPrice = v.price ?? v.product.basePrice;
    const lineTotal = unitPrice * item.qty;
    subtotal += lineTotal;
    return {
      variantId: v.id,
      productTitle: v.product.title,
      variantLabel: [v.color, v.size].filter(Boolean).join(" / ") || "Default",
      unitPrice,
      qty: item.qty,
      lineTotal,
    };
  });

  // 3. Shipping fee by zone (server-resolved) + 4. coupon discount (server-validated).
  const { zone, fee: shippingFee } = await resolveShippingFee(data.zoneId, subtotal);

  let discount = 0;
  let couponId: string | null = null;
  if (data.couponCode) {
    const result = await validateCoupon(data.couponCode, subtotal);
    discount = result.discount;
    couponId = result.coupon.id;
  }

  const total = subtotal - discount + shippingFee;
  const orderNumber = await generateOrderNumber();

  // 5. Transaction: decrement stock (guarded), guard coupon usage, persist order.
  const order = await db.$transaction(async (tx) => {
    for (const item of data.items) {
      const dec = await tx.variant.updateMany({
        where: { id: item.variantId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (dec.count === 0) throw conflict("Insufficient stock for one of the items");

      const after = await tx.variant.findUnique({
        where: { id: item.variantId },
        select: { stock: true },
      });
      await tx.stockAdjustment.create({
        data: {
          variantId: item.variantId,
          delta: -item.qty,
          newStock: after!.stock,
          reason: `order:${orderNumber}`,
        },
      });
    }

    if (couponId) {
      const incremented = await incrementCouponUsage(couponId, tx);
      if (!incremented) throw conflict("This coupon has reached its usage limit");
    }

    return tx.order.create({
      data: {
        orderNumber,
        customerId: options.customerId ?? null,
        custName: data.customer.name,
        custPhone: data.customer.phone,
        custAddress: data.customer.address,
        custArea: data.customer.area ?? null,
        custCity: data.customer.city ?? null,
        zoneId: zone.id,
        shippingFee,
        subtotal,
        discount,
        total,
        couponId,
        fraudScore: options.fraud?.score ?? null,
        fraudVerdict: options.fraud?.verdict ?? null,
        status: OrderStatus.pending,
        items: { create: lines },
        statusHistory: { create: { status: OrderStatus.pending, note: "Order placed" } },
      },
      include: { items: true },
    });
  });

  revalidateTags(cacheTags.products);
  return order;
}

const orderInclude = {
  items: true,
  zone: true,
  coupon: { select: { code: true } },
  statusHistory: { orderBy: { createdAt: "asc" } },
} as const;

export async function getOrderByNumber(orderNumber: string) {
  return db.order.findUnique({ where: { orderNumber }, include: orderInclude });
}

export async function getOrderById(id: string) {
  const order = await db.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw notFound("Order not found");
  return order;
}

export { OrderStatus };
