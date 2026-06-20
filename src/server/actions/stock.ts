"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { adjustStock, setStock, type StockChange } from "@/server/services/stock";
import {
  adjustStockSchema,
  setStockSchema,
  type AdjustStockInput,
  type SetStockInput,
} from "@/server/validators/stock";

// Admin stock mutations: requireAdmin → service (logs adjustment) → audit → Result.

export async function adjustStockAction(input: AdjustStockInput): Promise<Result<StockChange>> {
  try {
    const session = await requireAdmin();
    const { variantId, delta, reason } = adjustStockSchema.parse(input);
    const change = await adjustStock(variantId, delta, reason, session.user.id);
    await recordAudit({
      adminId: session.user.id,
      action: "stock.adjust",
      entity: "Variant",
      entityId: variantId,
      diff: change,
    });
    return ok(change);
  } catch (error) {
    return toResult(error);
  }
}

export async function setStockAction(input: SetStockInput): Promise<Result<StockChange>> {
  try {
    const session = await requireAdmin();
    const { variantId, stock, reason } = setStockSchema.parse(input);
    const change = await setStock(variantId, stock, reason, session.user.id);
    await recordAudit({
      adminId: session.user.id,
      action: "stock.set",
      entity: "Variant",
      entityId: variantId,
      diff: change,
    });
    return ok(change);
  } catch (error) {
    return toResult(error);
  }
}
