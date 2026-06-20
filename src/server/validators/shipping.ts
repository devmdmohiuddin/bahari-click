import { z } from "zod";

const taka = z.number().int().nonnegative();

export const shippingZoneInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  fee: taka,
  freeShipThreshold: taka.optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type ShippingZoneInput = z.input<typeof shippingZoneInputSchema>;
