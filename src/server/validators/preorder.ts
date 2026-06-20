import { z } from "zod";

import { phoneSchema } from "@/server/validators/auth";

// Notify-me / pre-order request input. Phone is normalized to +8801XXXXXXXXX.

export const createPreOrderSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  variantId: z.string().min(1).optional().nullable(),
  phone: phoneSchema,
  name: z.string().trim().max(80).optional(),
  qty: z.number().int().min(1).max(99).default(1),
});
export type CreatePreOrderInput = z.input<typeof createPreOrderSchema>;
