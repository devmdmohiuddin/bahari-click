"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { createSourcingRecord, profitReport } from "@/server/services/sourcing";
import { sourcingInputSchema, type SourcingInput } from "@/server/validators/sourcing";

// Admin: record a sourcing batch (computes landed cost) and read profit reports.

export async function createSourcingRecordAction(
  input: SourcingInput,
): Promise<Result<{ id: string; landedCostBDT: number }>> {
  try {
    const session = await requireAdmin();
    const record = await createSourcingRecord(sourcingInputSchema.parse(input));
    await recordAudit({
      adminId: session.user.id,
      action: "sourcing.create",
      entity: "SourcingRecord",
      entityId: record.id,
      diff: { productId: record.productId, landedCostBDT: record.landedCostBDT },
    });
    return ok({ id: record.id, landedCostBDT: record.landedCostBDT });
  } catch (error) {
    return toResult(error);
  }
}

export async function getProfitReportAction(
  fromIso?: string,
  toIso?: string,
): Promise<Result<Awaited<ReturnType<typeof profitReport>>>> {
  try {
    await requireAdmin();
    const from = fromIso ? new Date(fromIso) : undefined;
    const to = toIso ? new Date(toIso) : undefined;
    return ok(await profitReport(from, to));
  } catch (error) {
    return toResult(error);
  }
}
