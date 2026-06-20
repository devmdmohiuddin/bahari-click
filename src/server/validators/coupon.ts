import { z } from "zod";

const taka = z.number().int().nonnegative();

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .transform((c) => c.toUpperCase()),
    type: z.enum(["percent", "fixed"]),
    value: z.number().int().positive(),
    minOrder: taka.optional().nullable(),
    maxDiscount: taka.optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.type !== "percent" || c.value <= 100, {
    message: "Percent value must be between 1 and 100",
    path: ["value"],
  })
  .refine((c) => !c.startsAt || !c.endsAt || c.startsAt <= c.endsAt, {
    message: "End date must be after start date",
    path: ["endsAt"],
  });
export type CouponInput = z.input<typeof couponInputSchema>;

export const validateCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .transform((c) => c.toUpperCase()),
  subtotal: taka,
});
export type ValidateCouponInput = z.input<typeof validateCouponSchema>;
