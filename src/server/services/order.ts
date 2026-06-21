import { OrderStatus, type Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cacheTags, revalidateTags } from "@/lib/cache";
import { conflict, notFound, validationError } from "@/lib/errors";
import { normalizeBdPhone } from "@/lib/phone";
import { EDITABLE_STATUSES, ORDER_TRANSITIONS } from "@/lib/orders";
import { incrementCouponUsage, validateCoupon } from "@/server/services/coupon";
import { assessFraud } from "@/server/services/fraud";
import { sendOrderStatusSms } from "@/server/services/notifications";
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
  /** Optional fraud verdict attached by the checkout flow (F4.4). Score may be
   *  null when the courier API is unavailable (fail-open). */
  fraud?: { score: number | null; verdict: string } | null;
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
        // Shared with the client Pixel for CAPI dedup (F5.4).
        metaEventId: crypto.randomUUID(),
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

// ── Status transitions ───────────────────────────────────────────────────────
// Allowed forward transitions live in @/lib/orders (shared with the admin UI).

export interface TransitionOptions {
  note?: string;
  adminId?: string | null;
}

/**
 * Move an order to a new status: validates the transition, writes history, and
 * fires side-effects — increment soldCountReal on delivery; restock on
 * cancel/return. (SMS notifications are added in Phase 5.)
 */
export async function transitionOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  options: TransitionOptions = {},
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      items: { select: { qty: true, variant: { select: { id: true, productId: true } } } },
    },
  });
  if (!order) throw notFound("Order not found");
  if (order.status === newStatus) return order;

  if (!ORDER_TRANSITIONS[order.status].includes(newStatus)) {
    throw conflict(`Cannot move order from ${order.status} to ${newStatus}`);
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: newStatus } });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: newStatus,
        note: options.note ?? null,
        changedByAdminId: options.adminId ?? null,
      },
    });

    if (newStatus === OrderStatus.delivered) {
      // Count real sales per product.
      const perProduct = new Map<string, number>();
      for (const item of order.items) {
        const pid = item.variant?.productId;
        if (pid) perProduct.set(pid, (perProduct.get(pid) ?? 0) + item.qty);
      }
      for (const [productId, qty] of perProduct) {
        await tx.product.update({
          where: { id: productId },
          data: { soldCountReal: { increment: qty } },
        });
      }
    }

    if (newStatus === OrderStatus.cancelled || newStatus === OrderStatus.returned) {
      // Return reserved stock to inventory.
      for (const item of order.items) {
        if (!item.variant) continue;
        const updated = await tx.variant.update({
          where: { id: item.variant.id },
          data: { stock: { increment: item.qty } },
          select: { stock: true },
        });
        await tx.stockAdjustment.create({
          data: {
            variantId: item.variant.id,
            delta: item.qty,
            newStock: updated.stock,
            reason: `${newStatus}:${order.orderNumber}`,
          },
        });
      }
    }
  });

  revalidateTags(cacheTags.products);

  const updated = await getOrderById(orderId);

  // Lifecycle SMS (fail-soft — never blocks the transition).
  await sendOrderStatusSms(
    {
      orderNumber: updated.orderNumber,
      name: updated.custName,
      total: updated.total,
      trackingCode: updated.trackingCode,
      custPhone: updated.custPhone,
    },
    newStatus,
  );

  return updated;
}

/** Map a raw courier delivery status to an internal order status (null = ignore). */
export function deliveryStatusToOrderStatus(raw: string): OrderStatus | null {
  switch (raw.toLowerCase()) {
    case "delivered":
    case "partial_delivered":
      return OrderStatus.delivered;
    case "returned":
    case "return":
    case "cancelled":
    case "canceled":
      return OrderStatus.returned;
    default:
      return null;
  }
}

/**
 * Apply a courier-reported status to the order with that tracking code. Used by
 * the courier webhook and status-sync. Out-of-order/illegal transitions are
 * ignored (changed:false) rather than throwing, so webhooks stay idempotent.
 */
export async function applyCourierStatus(trackingCode: string, rawStatus: string) {
  const order = await db.order.findFirst({
    where: { trackingCode },
    select: { id: true, status: true },
  });
  if (!order) throw notFound("Order not found for tracking code");

  const next = deliveryStatusToOrderStatus(rawStatus);
  if (!next || next === order.status) {
    return { id: order.id, status: order.status, changed: false };
  }

  try {
    const updated = await transitionOrderStatus(order.id, next, {
      note: `courier:${rawStatus}`,
    });
    return { id: updated.id, status: updated.status, changed: true };
  } catch {
    // Illegal transition for the current state — ignore (idempotent webhook).
    return { id: order.id, status: order.status, changed: false };
  }
}

// ── Admin: list, notes, item edits ─────────────────────────────────────────────

export interface AdminOrderFilters {
  status?: OrderStatus;
  search?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

/** Paginated admin order list with status / phone+number search / date range. */
export async function listOrdersAdmin(filters: AdminOrderFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const search = filters.search?.trim();

  const where: Prisma.OrderWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { custPhone: { contains: search } },
            { custName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        custName: true,
        custPhone: true,
        fraudScore: true,
        fraudVerdict: true,
        createdAt: true,
        zone: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export type AdminOrderRow = Awaited<ReturnType<typeof listOrdersAdmin>>["items"][number];

/** Set/clear the internal note on an order. */
export async function setOrderNote(orderId: string, note: string | null) {
  const exists = await db.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!exists) throw notFound("Order not found");
  await db.order.update({ where: { id: orderId }, data: { internalNote: note?.trim() || null } });
  return { id: orderId };
}

export interface OrderItemEdit {
  orderItemId: string;
  qty: number; // 0 removes the line
}

/**
 * Edit order line quantities (and remove lines) before dispatch. Stock is
 * adjusted by the delta (guarded against oversell), line totals + subtotal +
 * total are recomputed, and any discount is clamped to the new subtotal.
 */
export async function editOrderItems(
  orderId: string,
  edits: OrderItemEdit[],
  adminId?: string | null,
) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw notFound("Order not found");
  if (!EDITABLE_STATUSES.includes(order.status)) {
    throw conflict(
      `Items can only be edited while pending or confirmed (order is ${order.status})`,
    );
  }

  const editMap = new Map(edits.map((e) => [e.orderItemId, e.qty]));
  const known = new Set(order.items.map((i) => i.id));
  for (const id of editMap.keys()) {
    if (!known.has(id)) throw validationError("Edit refers to an item not on this order");
  }

  const remainingCount = order.items.filter((it) => (editMap.get(it.id) ?? it.qty) > 0).length;
  if (remainingCount === 0) throw validationError("An order must keep at least one item");

  await db.$transaction(async (tx) => {
    let subtotal = 0;
    for (const it of order.items) {
      const newQty = editMap.has(it.id) ? editMap.get(it.id)! : it.qty;
      const delta = newQty - it.qty; // +ve → more units leave inventory

      if (delta !== 0 && it.variantId) {
        if (delta > 0) {
          const dec = await tx.variant.updateMany({
            where: { id: it.variantId, stock: { gte: delta } },
            data: { stock: { decrement: delta } },
          });
          if (dec.count === 0) throw conflict(`Insufficient stock for ${it.productTitle}`);
        } else {
          await tx.variant.update({
            where: { id: it.variantId },
            data: { stock: { increment: -delta } },
          });
        }
        const after = await tx.variant.findUnique({
          where: { id: it.variantId },
          select: { stock: true },
        });
        await tx.stockAdjustment.create({
          data: {
            variantId: it.variantId,
            delta: -delta,
            newStock: after!.stock,
            reason: `edit:${order.orderNumber}`,
            adminId: adminId ?? null,
          },
        });
      }

      if (newQty === 0) {
        await tx.orderItem.delete({ where: { id: it.id } });
      } else {
        if (delta !== 0) {
          await tx.orderItem.update({
            where: { id: it.id },
            data: { qty: newQty, lineTotal: it.unitPrice * newQty },
          });
        }
        subtotal += it.unitPrice * newQty;
      }
    }

    const discount = Math.min(order.discount, subtotal);
    await tx.order.update({
      where: { id: orderId },
      data: { subtotal, discount, total: subtotal - discount + order.shippingFee },
    });
  });

  revalidateTags(cacheTags.products);
  return getOrderById(orderId);
}

export type AdminOrderDetail = Awaited<ReturnType<typeof getOrderById>>;

/** Re-run the COD fraud check for an order and persist the new verdict. */
export async function reassessOrderFraud(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, custPhone: true },
  });
  if (!order) throw notFound("Order not found");

  const fraud = await assessFraud(order.custPhone);
  await db.order.update({
    where: { id: orderId },
    data: { fraudScore: fraud.score, fraudVerdict: fraud.verdict },
  });
  return fraud;
}

/** Resend the lifecycle SMS for the order's current status (manual admin action). */
export async function resendOrderSms(orderId: string) {
  const order = await getOrderById(orderId);
  const res = await sendOrderStatusSms(
    {
      orderNumber: order.orderNumber,
      name: order.custName,
      total: order.total,
      trackingCode: order.trackingCode,
      custPhone: order.custPhone,
    },
    order.status,
  );
  if (!res) return { sent: false, reason: "No SMS is defined for this status" };
  if (res.ok === false) return { sent: false, reason: res.error };
  return { sent: true };
}

// ── Public tracking ──────────────────────────────────────────────────────────

/** Guest order tracking by order number + phone (rate-limited at the action). */
export async function trackOrder(orderNumber: string, phone: string) {
  const normalized = normalizeBdPhone(phone);
  if (!normalized) throw validationError("Enter a valid Bangladeshi phone number");

  const order = await db.order.findFirst({
    where: { orderNumber, custPhone: normalized },
    select: {
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      custName: true,
      trackingCode: true,
      courierName: true,
      items: {
        select: {
          productTitle: true,
          variantLabel: true,
          qty: true,
          lineTotal: true,
          // Product slug (when the variant/product still exists) so a delivered
          // order can deep-link to the product's review form (S5.1).
          variant: { select: { product: { select: { slug: true } } } },
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { status: true, note: true, createdAt: true },
      },
    },
  });
  if (!order) {
    throw notFound("Order not found. Please check your order number and phone number.");
  }
  return order;
}

export { OrderStatus };
