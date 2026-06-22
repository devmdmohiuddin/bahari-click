import { z } from "zod";

export const sourcingInputSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  supplierName: z.string().trim().min(1, "Supplier is required").max(160),
  supplierUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  unitCostCNY: z.number().int().positive(),
  shippingCost: z.number().int().nonnegative().default(0), // BDT, per batch
  batchQty: z.number().int().positive(),
});
export type SourcingInput = z.input<typeof sourcingInputSchema>;
