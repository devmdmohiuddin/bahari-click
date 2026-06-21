"use server";

import type { OrderStatus } from "@/generated/prisma/client";
import { RATE_LIMITS } from "@/lib/rate-limits";
import { ok, toResult, type Result } from "@/lib/result";
import { getSession, requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { sendPurchaseEvent } from "@/server/integrations/meta/capi";
import { assessFraud } from "@/server/services/fraud";
import {
  editOrderItems,
  placeOrder,
  setOrderNote,
  transitionOrderStatus,
  trackOrder,
  type OrderItemEdit,
} from "@/server/services/order";
import { clientIp, enforcePolicy } from "@/server/services/rate-limit";
import {
  placeOrderSchema,
  trackOrderSchema,
  type PlaceOrderInput,
  type TrackOrderInput,
} from "@/server/validators/order";

export interface PlacedOrder {
  orderNumber: string;
  total: number;
  status: string;
  /** Shared with the client Pixel so the Purchase event dedupes against CAPI. */
  metaEventId: string | null;
}

// Public COD checkout. Rate-limited per IP; totals/stock are recomputed in the
// service (client values are never trusted).
export async function placeOrderAction(input: PlaceOrderInput): Promise<Result<PlacedOrder>> {
  try {
    const data = placeOrderSchema.parse(input);
    await enforcePolicy(`order:place:${await clientIp()}`, RATE_LIMITS.orderPlace);

    const session = await getSession();

    // COD fraud check (fail-open — never blocks the order; flagged for review).
    const fraud = await assessFraud(data.customer.phone);

    const order = await placeOrder(data, {
      customerId: session?.user.id ?? null,
      fraud,
    });

    // Server-side Purchase event (deduped with the client Pixel via metaEventId).
    if (order.metaEventId) {
      await sendPurchaseEvent({
        eventId: order.metaEventId,
        value: order.total,
        phone: order.custPhone,
        contents: order.items.map((i) => ({ id: i.variantId ?? "", quantity: i.qty })),
      });
    }

    return ok({
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      metaEventId: order.metaEventId,
    });
  } catch (error) {
    return toResult(error);
  }
}

// Admin: advance an order's status (validated transition + history + side-effects).
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  note?: string,
): Promise<Result<{ id: string; status: OrderStatus }>> {
  try {
    const session = await requireAdmin();
    const order = await transitionOrderStatus(orderId, status, { note, adminId: session.user.id });
    await recordAudit({
      adminId: session.user.id,
      action: "order.status_change",
      entity: "Order",
      entityId: orderId,
      diff: { status, note },
    });
    return ok({ id: order.id, status: order.status });
  } catch (error) {
    return toResult(error);
  }
}

// Admin: set/clear an order's internal note.
export async function setOrderNoteAction(
  orderId: string,
  note: string | null,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const result = await setOrderNote(orderId, note);
    await recordAudit({
      adminId: session.user.id,
      action: "order.note",
      entity: "Order",
      entityId: orderId,
    });
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}

// Admin: edit order line quantities (recompute totals + adjust stock).
export async function editOrderItemsAction(
  orderId: string,
  edits: OrderItemEdit[],
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const order = await editOrderItems(orderId, edits, session.user.id);
    await recordAudit({
      adminId: session.user.id,
      action: "order.edit_items",
      entity: "Order",
      entityId: orderId,
      diff: { edits, total: order.total },
    });
    return ok({ id: order.id });
  } catch (error) {
    return toResult(error);
  }
}

// Public: track an order by number + phone. Rate-limited.
export async function trackOrderAction(
  input: TrackOrderInput,
): Promise<Result<Awaited<ReturnType<typeof trackOrder>>>> {
  try {
    const { orderNumber, phone } = trackOrderSchema.parse(input);
    await enforcePolicy(`order:track:${await clientIp()}`, RATE_LIMITS.orderTrack);
    const order = await trackOrder(orderNumber, phone);
    return ok(order);
  } catch (error) {
    return toResult(error);
  }
}
