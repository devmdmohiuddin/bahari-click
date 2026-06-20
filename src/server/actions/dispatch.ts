"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { dispatchOrder, type DispatchResult } from "@/server/services/dispatch";

// Admin: one-click dispatch to the courier.
export async function dispatchOrderAction(orderId: string): Promise<Result<DispatchResult>> {
  try {
    const session = await requireAdmin();
    const result = await dispatchOrder(orderId, session.user.id);
    if (!result.alreadyDispatched) {
      await recordAudit({
        adminId: session.user.id,
        action: "order.dispatch",
        entity: "Order",
        entityId: orderId,
        diff: { courierName: result.courierName, trackingCode: result.trackingCode },
      });
    }
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}
