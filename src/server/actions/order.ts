"use server";

import type { OrderStatus } from "@/generated/prisma/client";
import { ok, toResult, type Result } from "@/lib/result";
import { getSession, requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { assessFraud } from "@/server/services/fraud";
import { placeOrder, transitionOrderStatus, trackOrder } from "@/server/services/order";
import { clientIp, enforceRateLimit } from "@/server/services/rate-limit";
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
}

// Public COD checkout. Rate-limited per IP; totals/stock are recomputed in the
// service (client values are never trusted).
export async function placeOrderAction(input: PlaceOrderInput): Promise<Result<PlacedOrder>> {
  try {
    const data = placeOrderSchema.parse(input);
    await enforceRateLimit(`order:place:${await clientIp()}`, 10, 60 * 60);

    const session = await getSession();

    // COD fraud check (fail-open — never blocks the order; flagged for review).
    const fraud = await assessFraud(data.customer.phone);

    const order = await placeOrder(data, {
      customerId: session?.user.id ?? null,
      fraud,
    });

    return ok({ orderNumber: order.orderNumber, total: order.total, status: order.status });
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

// Public: track an order by number + phone. Rate-limited.
export async function trackOrderAction(
  input: TrackOrderInput,
): Promise<Result<Awaited<ReturnType<typeof trackOrder>>>> {
  try {
    const { orderNumber, phone } = trackOrderSchema.parse(input);
    await enforceRateLimit(`order:track:${await clientIp()}`, 30, 60 * 60);
    const order = await trackOrder(orderNumber, phone);
    return ok(order);
  } catch (error) {
    return toResult(error);
  }
}
