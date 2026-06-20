"use server";

import type { CouponType } from "@/generated/prisma/client";
import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { createCoupon, updateCoupon, validateCoupon } from "@/server/services/coupon";
import { RATE_LIMITS } from "@/lib/rate-limits";
import { clientIp, enforcePolicy } from "@/server/services/rate-limit";
import {
  couponInputSchema,
  validateCouponSchema,
  type CouponInput,
  type ValidateCouponInput,
} from "@/server/validators/coupon";

export interface CouponPreview {
  code: string;
  type: CouponType;
  discount: number;
}

// Public: preview a coupon at checkout. Rate-limited to deter code guessing.
export async function validateCouponAction(
  input: ValidateCouponInput,
): Promise<Result<CouponPreview>> {
  try {
    const { code, subtotal } = validateCouponSchema.parse(input);
    await enforcePolicy(`coupon:validate:${await clientIp()}`, RATE_LIMITS.couponValidate);
    const { coupon, discount } = await validateCoupon(code, subtotal);
    return ok({ code: coupon.code, type: coupon.type, discount });
  } catch (error) {
    return toResult(error);
  }
}

// Admin: create / update coupons.
export async function createCouponAction(input: CouponInput): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const coupon = await createCoupon(couponInputSchema.parse(input));
    await recordAudit({
      adminId: session.user.id,
      action: "coupon.create",
      entity: "Coupon",
      entityId: coupon.id,
      diff: { code: coupon.code, type: coupon.type, value: coupon.value },
    });
    return ok({ id: coupon.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function updateCouponAction(
  id: string,
  input: Partial<CouponInput>,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const coupon = await updateCoupon(id, input);
    await recordAudit({
      adminId: session.user.id,
      action: "coupon.update",
      entity: "Coupon",
      entityId: coupon.id,
      diff: input,
    });
    return ok({ id: coupon.id });
  } catch (error) {
    return toResult(error);
  }
}
