import { z } from "zod";

import { normalizeBdPhone } from "@/lib/phone";

// Shared Zod schemas (client + server). Phone is normalized to +8801XXXXXXXXX.

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform((value, ctx) => {
    const normalized = normalizeBdPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a valid Bangladeshi phone number" });
      return z.NEVER;
    }
    return normalized;
  });

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export type RequestOtpInput = z.input<typeof requestOtpSchema>;
