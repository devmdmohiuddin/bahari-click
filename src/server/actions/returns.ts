"use server";

import { z } from "zod";

import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin, requireUser } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import {
  approveReturn,
  completeReturn,
  rejectReturn,
  requestReturn,
} from "@/server/services/returns";

const requestReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(1, "Reason is required").max(1000),
});

// Customer: request a return for their own delivered order.
export async function requestReturnAction(input: {
  orderId: string;
  reason: string;
}): Promise<Result<{ id: string }>> {
  try {
    const session = await requireUser();
    const { orderId, reason } = requestReturnSchema.parse(input);
    const ret = await requestReturn(orderId, reason, session.user.id);
    return ok({ id: ret.id });
  } catch (error) {
    return toResult(error);
  }
}

// Admin: approve / reject / complete returns.
export async function approveReturnAction(
  returnId: string,
  refundAmount?: number,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const ret = await approveReturn(returnId, refundAmount);
    await recordAudit({
      adminId: session.user.id,
      action: "return.approve",
      entity: "Return",
      entityId: returnId,
      diff: { refundAmount },
    });
    return ok({ id: ret.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function rejectReturnAction(
  returnId: string,
  note?: string,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const ret = await rejectReturn(returnId, note);
    await recordAudit({
      adminId: session.user.id,
      action: "return.reject",
      entity: "Return",
      entityId: returnId,
    });
    return ok({ id: ret.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function completeReturnAction(returnId: string): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const result = await completeReturn(returnId, session.user.id);
    await recordAudit({
      adminId: session.user.id,
      action: "return.complete",
      entity: "Return",
      entityId: returnId,
    });
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}
