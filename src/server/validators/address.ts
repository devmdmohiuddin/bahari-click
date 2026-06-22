import { z } from "zod";

import { phoneSchema } from "@/server/validators/auth";

export const addressInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: phoneSchema,
  line1: z.string().trim().min(1, "Address is required").max(400),
  area: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  zoneId: z.string().min(1).optional().nullable(),
  note: z.string().trim().max(400).optional(),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.input<typeof addressInputSchema>;
