import { OrderStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cacheTags, revalidateTags } from "@/lib/cache";
import { conflict, notFound } from "@/lib/errors";
import { courier } from "@/server/integrations/courier";
import { sendOrderStatusSms } from "@/server/services/notifications";

// Dispatch an order to the courier: create a consignment, store the tracking
// code, and move the order to `dispatched`. Idempotent — if the order already
// has a tracking code we return it without calling the courier again.

export interface DispatchResult {
  orderId: string;
  courierName: string;
  trackingCode: string;
  alreadyDispatched: boolean;
}

export async function dispatchOrder(
  orderId: string,
  adminId?: string | null,
): Promise<DispatchResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      trackingCode: true,
      courierName: true,
      custName: true,
      custPhone: true,
      custAddress: true,
      custArea: true,
      custCity: true,
      total: true,
    },
  });
  if (!order) throw notFound("Order not found");

  // Idempotent: already dispatched → return the existing consignment.
  if (order.trackingCode) {
    return {
      orderId: order.id,
      courierName: order.courierName ?? courier.name,
      trackingCode: order.trackingCode,
      alreadyDispatched: true,
    };
  }

  if (order.status !== OrderStatus.confirmed && order.status !== OrderStatus.packed) {
    throw conflict("Order must be confirmed or packed before dispatch");
  }

  const consignment = await courier.createConsignment({
    orderNumber: order.orderNumber,
    recipientName: order.custName,
    recipientPhone: order.custPhone,
    recipientAddress: [order.custAddress, order.custArea, order.custCity]
      .filter(Boolean)
      .join(", "),
    codAmount: order.total,
  });

  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: {
        courierName: courier.name,
        trackingCode: consignment.trackingCode,
        status: OrderStatus.dispatched,
      },
    }),
    db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: OrderStatus.dispatched,
        note: `Consignment ${consignment.consignmentId || consignment.trackingCode} via ${courier.name}`,
        changedByAdminId: adminId ?? null,
      },
    }),
  ]);

  revalidateTags(cacheTags.products);

  // Dispatch SMS with the tracking code (fail-soft).
  await sendOrderStatusSms(
    {
      orderNumber: order.orderNumber,
      name: order.custName,
      total: order.total,
      trackingCode: consignment.trackingCode,
      custPhone: order.custPhone,
    },
    OrderStatus.dispatched,
  );

  return {
    orderId: order.id,
    courierName: courier.name,
    trackingCode: consignment.trackingCode,
    alreadyDispatched: false,
  };
}
