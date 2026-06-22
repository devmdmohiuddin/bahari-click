import { z } from "zod";

export const campaignInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(160),
    slug: z.string().trim().max(160).optional(),
    type: z.enum(["flash", "landing"]),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
    config: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .refine((c) => !c.startsAt || !c.endsAt || c.startsAt <= c.endsAt, {
    message: "End date must be after start date",
    path: ["endsAt"],
  });
export type CampaignInput = z.input<typeof campaignInputSchema>;
