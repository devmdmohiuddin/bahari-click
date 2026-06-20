import type { Coupon, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { conflict, notFound, validationError } from "@/lib/errors";
import { couponInputSchema, type CouponInput } from "@/server/validators/coupon";

// Coupon engine: validate a code against an order subtotal and compute the
// discount. usedCount is incremented under a guard at order time so a coupon
// can't exceed its usage limit under concurrency.

/** Pure discount math (no DB). Discount never exceeds the subtotal. */
export function computeDiscount(
  coupon: Pick<Coupon, "type" | "value" | "maxDiscount">,
  subtotal: number,
): number {
  let discount =
    coupon.type === "percent" ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }
  return Math.min(discount, subtotal);
}

/**
 * Validate a coupon for a given subtotal. Throws a typed AppError for every
 * rejection reason (unknown / inactive / not-started / expired / min-order /
 * over-limit). Returns the coupon and computed discount when valid.
 */
export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw notFound("Coupon not found");

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    throw validationError("This coupon is not active yet");
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    throw validationError("This coupon has expired");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw conflict("This coupon has reached its usage limit");
  }
  if (coupon.minOrder !== null && subtotal < coupon.minOrder) {
    throw validationError(`Minimum order of ${coupon.minOrder} BDT required for this coupon`);
  }

  const discount = computeDiscount(coupon, subtotal);
  if (discount <= 0) throw validationError("This coupon does not apply to your order");

  return { coupon, discount };
}

/**
 * Atomically increment usedCount, respecting usageLimit. Returns true on
 * success, false if the limit was hit (caller should reject/roll back).
 * Pass a transaction client when used inside order placement.
 */
export async function incrementCouponUsage(
  couponId: string,
  client: Prisma.TransactionClient | typeof db = db,
): Promise<boolean> {
  const result = await client.coupon.updateMany({
    where: {
      id: couponId,
      OR: [{ usageLimit: null }, { usedCount: { lt: db.coupon.fields.usageLimit } }],
    },
    data: { usedCount: { increment: 1 } },
  });
  return result.count > 0;
}

export async function createCoupon(input: CouponInput) {
  const data = couponInputSchema.parse(input);
  const existing = await db.coupon.findUnique({ where: { code: data.code }, select: { id: true } });
  if (existing) throw conflict("A coupon with this code already exists");

  return db.coupon.create({
    data: {
      code: data.code,
      type: data.type,
      value: data.value,
      minOrder: data.minOrder ?? null,
      maxDiscount: data.maxDiscount ?? null,
      usageLimit: data.usageLimit ?? null,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
      isActive: data.isActive,
    },
  });
}

export async function updateCoupon(id: string, input: Partial<CouponInput>) {
  const existing = await db.coupon.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Coupon not found");

  const data = couponInputSchema.partial().parse(input);
  if (data.code) {
    const clash = await db.coupon.findFirst({
      where: { code: data.code, NOT: { id } },
      select: { id: true },
    });
    if (clash) throw conflict("A coupon with this code already exists");
  }

  return db.coupon.update({
    where: { id },
    data: {
      code: data.code,
      type: data.type,
      value: data.value,
      minOrder: data.minOrder,
      maxDiscount: data.maxDiscount,
      usageLimit: data.usageLimit,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: data.isActive,
    },
  });
}

export async function listCoupons() {
  return db.coupon.findMany({ orderBy: { createdAt: "desc" } });
}
