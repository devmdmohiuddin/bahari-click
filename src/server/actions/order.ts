"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { getSession } from "@/server/auth-session";
import { assessFraud } from "@/server/services/fraud";
import { placeOrder } from "@/server/services/order";
import { clientIp, enforceRateLimit } from "@/server/services/rate-limit";
import { placeOrderSchema, type PlaceOrderInput } from "@/server/validators/order";

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
