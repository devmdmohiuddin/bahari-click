"use server";

import type { PreOrderStatus } from "@/generated/prisma/client";
import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { createPreOrder, setPreOrderStatus } from "@/server/services/preorder";
import { RATE_LIMITS } from "@/lib/rate-limits";
import { clientIp, enforcePolicy } from "@/server/services/rate-limit";
import { createPreOrderSchema, type CreatePreOrderInput } from "@/server/validators/preorder";

// Public: register a notify-me / pre-order request. Rate-limited per IP.
export async function createPreOrderAction(
  input: CreatePreOrderInput,
): Promise<Result<{ id: string; status: PreOrderStatus }>> {
  try {
    const data = createPreOrderSchema.parse(input);
    await enforcePolicy(`preorder:create:${await clientIp()}`, RATE_LIMITS.preorderCreate);
    const request = await createPreOrder(data);
    return ok({ id: request.id, status: request.status });
  } catch (error) {
    return toResult(error);
  }
}

// Admin: advance a pre-order request through its lifecycle.
export async function setPreOrderStatusAction(
  id: string,
  status: PreOrderStatus,
): Promise<Result<{ id: string; status: PreOrderStatus }>> {
  try {
    const session = await requireAdmin();
    const request = await setPreOrderStatus(id, status);
    await recordAudit({
      adminId: session.user.id,
      action: "preorder.status_change",
      entity: "PreOrderRequest",
      entityId: id,
      diff: { status },
    });
    return ok({ id: request.id, status: request.status });
  } catch (error) {
    return toResult(error);
  }
}
