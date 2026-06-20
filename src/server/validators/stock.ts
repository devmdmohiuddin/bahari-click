import { z } from "zod";

// Stock mutation inputs. Money/stock are recomputed server-side; the client
// only proposes a delta or an absolute target.

export const adjustStockSchema = z.object({
  variantId: z.string().min(1),
  delta: z
    .number()
    .int()
    .refine((n) => n !== 0, "Delta must be non-zero"),
  reason: z.string().trim().min(1).max(120).default("manual"),
});
export type AdjustStockInput = z.input<typeof adjustStockSchema>;

export const setStockSchema = z.object({
  variantId: z.string().min(1),
  stock: z.number().int().nonnegative(),
  reason: z.string().trim().min(1).max(120).default("manual"),
});
export type SetStockInput = z.input<typeof setStockSchema>;
