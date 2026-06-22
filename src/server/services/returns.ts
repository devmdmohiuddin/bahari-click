import { OrderStatus, PaymentStatus, ReturnStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { conflict, notFound, validationError } from "@/lib/errors";
import { transitionOrderStatus } from "@/server/services/order";

// Returns workflow. A return can only be raised on a delivered order. Completing
// it restocks inventory (via the order → returned transition), reverses the sale
// count, and refunds any successful online payment.

export async function requestReturn(orderId: string, reason: string, customerId?: string | null) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, customerId: true, total: true },
  });
  if (!order) throw notFound("Order not found");
  if (customerId && order.customerId !== customerId) throw notFound("Order not found");
  if (order.status !== OrderStatus.delivered) {
    throw validationError("Only delivered orders can be returned");
  }

  const open = await db.return.findFirst({
    where: { orderId, status: { in: [ReturnStatus.requested, ReturnStatus.approved] } },
    select: { id: true },
  });
  if (open) throw conflict("A return is already in progress for this order");

  return db.return.create({ data: { orderId, reason: reason.trim() } });
}

const TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: [ReturnStatus.approved, ReturnStatus.rejected],
  approved: [ReturnStatus.completed, ReturnStatus.rejected],
  rejected: [],
  completed: [],
};

async function loadReturn(returnId: string) {
  const ret = await db.return.findUnique({
    where: { id: returnId },
    select: { id: true, status: true, orderId: true },
  });
  if (!ret) throw notFound("Return not found");
  return ret;
}

function assertTransition(from: ReturnStatus, to: ReturnStatus) {
  if (!TRANSITIONS[from].includes(to)) {
    throw conflict(`Cannot move return from ${from} to ${to}`);
  }
}

export async function approveReturn(returnId: string, refundAmount?: number) {
  const ret = await loadReturn(returnId);
  assertTransition(ret.status, ReturnStatus.approved);
  return db.return.update({
    where: { id: returnId },
    data: { status: ReturnStatus.approved, refundAmount: refundAmount ?? undefined },
  });
}

export async function rejectReturn(returnId: string, note?: string) {
  const ret = await loadReturn(returnId);
  assertTransition(ret.status, ReturnStatus.rejected);
  return db.return.update({
    where: { id: returnId },
    data: { status: ReturnStatus.rejected, note: note ?? undefined },
  });
}

/** Complete an approved return: order → returned (restock), reverse sold count, refund payment. */
export async function completeReturn(returnId: string, adminId?: string | null) {
  const ret = await db.return.findUnique({
    where: { id: returnId },
    select: { id: true, status: true, orderId: true, refundAmount: true },
  });
  if (!ret) throw notFound("Return not found");
  assertTransition(ret.status, ReturnStatus.completed);

  const order = await db.order.findUnique({
    where: { id: ret.orderId },
    select: {
      status: true,
      total: true,
      items: { select: { qty: true, variant: { select: { productId: true } } } },
      payments: { where: { status: PaymentStatus.success }, select: { id: true } },
    },
  });
  if (!order) throw notFound("Order not found");

  // Move the order to returned — this restocks the items (see order service).
  if (order.status === OrderStatus.delivered) {
    await transitionOrderStatus(ret.orderId, OrderStatus.returned, {
      note: `return:${returnId}`,
      adminId,
    });
  }

  // Reverse realized sales count + refund any online payment, and finalize the return.
  const refund = ret.refundAmount ?? order.total;
  await db.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.variant?.productId) {
        await tx.product.update({
          where: { id: item.variant.productId },
          data: { soldCountReal: { decrement: item.qty } },
        });
      }
    }
    for (const p of order.payments) {
      await tx.payment.update({ where: { id: p.id }, data: { status: PaymentStatus.refunded } });
    }
    await tx.return.update({
      where: { id: returnId },
      data: { status: ReturnStatus.completed, refundAmount: refund },
    });
  });

  return { id: returnId, status: ReturnStatus.completed };
}

export async function listReturns(status?: ReturnStatus) {
  return db.return.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true, custPhone: true, total: true } } },
  });
}

export { ReturnStatus };
