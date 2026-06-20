import { PreOrderStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { conflict, notFound, validationError } from "@/lib/errors";
import { createPreOrderSchema, type CreatePreOrderInput } from "@/server/validators/preorder";

// Pre-order / notify-me requests. Created `pending`; on restock the request is
// flipped to `notified` and a NotifyJob is enqueued (SMS send is Phase 5).
// This module does NOT import the stock service (stock calls notifyRestock here),
// so there is no import cycle.

export async function createPreOrder(input: CreatePreOrderInput) {
  const data = createPreOrderSchema.parse(input);

  const product = await db.product.findUnique({
    where: { id: data.productId },
    select: { id: true },
  });
  if (!product) throw notFound("Product not found");

  if (data.variantId) {
    const variant = await db.variant.findFirst({
      where: { id: data.variantId, productId: data.productId },
      select: { id: true },
    });
    if (!variant) throw validationError("Variant does not belong to this product");
  }

  return db.preOrderRequest.create({
    data: {
      productId: data.productId,
      variantId: data.variantId ?? null,
      phone: data.phone,
      name: data.name ?? null,
      qty: data.qty,
      status: PreOrderStatus.pending,
    },
  });
}

/**
 * Called by the stock service when a variant transitions out-of-stock → in-stock.
 * Marks pending requests `notified` and enqueues one restock notification each.
 * Returns the number of requests notified.
 */
export async function notifyRestock(variantId: string): Promise<number> {
  const pending = await db.preOrderRequest.findMany({
    where: { variantId, status: PreOrderStatus.pending },
    select: { id: true, phone: true, productId: true },
  });
  if (pending.length === 0) return 0;

  const now = new Date();
  await db.$transaction([
    db.preOrderRequest.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { status: PreOrderStatus.notified, notifiedAt: now },
    }),
    ...pending.map((p) =>
      db.notifyJob.create({
        data: {
          type: "preorder_restock",
          payload: { preOrderRequestId: p.id, phone: p.phone, productId: p.productId, variantId },
        },
      }),
    ),
  ]);

  return pending.length;
}

/**
 * Admin "mark restocked" for a single pending request: flip it to `notified`
 * and enqueue one restock SMS job (the cron worker drains NotifyJob in Phase 5).
 */
export async function notifyPreOrder(id: string) {
  const req = await db.preOrderRequest.findUnique({
    where: { id },
    select: { id: true, status: true, phone: true, productId: true, variantId: true },
  });
  if (!req) throw notFound("Pre-order request not found");
  if (req.status !== PreOrderStatus.pending) {
    throw conflict("Only pending requests can be notified");
  }

  await db.$transaction([
    db.preOrderRequest.update({
      where: { id },
      data: { status: PreOrderStatus.notified, notifiedAt: new Date() },
    }),
    db.notifyJob.create({
      data: {
        type: "preorder_restock",
        payload: {
          preOrderRequestId: req.id,
          phone: req.phone,
          productId: req.productId,
          variantId: req.variantId,
        },
      },
    }),
  ]);

  return { id: req.id, status: PreOrderStatus.notified };
}

// Allowed admin status transitions.
const TRANSITIONS: Record<PreOrderStatus, PreOrderStatus[]> = {
  pending: [PreOrderStatus.notified, PreOrderStatus.cancelled],
  notified: [PreOrderStatus.fulfilled, PreOrderStatus.cancelled],
  fulfilled: [],
  cancelled: [],
};

export async function setPreOrderStatus(id: string, status: PreOrderStatus) {
  const request = await db.preOrderRequest.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!request) throw notFound("Pre-order request not found");

  if (request.status === status) return request;
  if (!TRANSITIONS[request.status].includes(status)) {
    throw conflict(`Cannot move pre-order from ${request.status} to ${status}`);
  }

  return db.preOrderRequest.update({
    where: { id },
    data: {
      status,
      notifiedAt: status === PreOrderStatus.notified ? new Date() : undefined,
    },
  });
}

export async function listPreOrders(status?: PreOrderStatus) {
  return db.preOrderRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { title: true, slug: true } },
      variant: { select: { sku: true, color: true, size: true } },
    },
  });
}

export type PreOrderListItem = Awaited<ReturnType<typeof listPreOrders>>[number];

export { PreOrderStatus };
