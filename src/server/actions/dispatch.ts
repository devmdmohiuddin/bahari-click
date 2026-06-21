"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { dispatchOrder, type DispatchResult } from "@/server/services/dispatch";
import { reassessOrderFraud, resendOrderSms } from "@/server/services/order";
import { syncOrderCourier } from "@/server/services/sync";

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

// Admin: re-run the COD fraud check for an order.
export async function reassessFraudAction(
  orderId: string,
): Promise<Result<{ score: number | null; verdict: string }>> {
  try {
    const session = await requireAdmin();
    const fraud = await reassessOrderFraud(orderId);
    await recordAudit({
      adminId: session.user.id,
      action: "order.fraud_recheck",
      entity: "Order",
      entityId: orderId,
      diff: fraud,
    });
    return ok(fraud);
  } catch (error) {
    return toResult(error);
  }
}

// Admin: pull the latest courier status for one order and apply any change.
export async function syncOrderCourierAction(
  orderId: string,
): Promise<Result<{ courierStatus: string; applied: boolean }>> {
  try {
    await requireAdmin();
    const result = await syncOrderCourier(orderId);
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}

// Admin: manually resend the lifecycle SMS for an order's current status.
export async function resendOrderSmsAction(
  orderId: string,
): Promise<Result<{ sent: boolean; reason?: string }>> {
  try {
    const session = await requireAdmin();
    const result = await resendOrderSms(orderId);
    await recordAudit({
      adminId: session.user.id,
      action: "order.sms_resend",
      entity: "Order",
      entityId: orderId,
      diff: result,
    });
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}
