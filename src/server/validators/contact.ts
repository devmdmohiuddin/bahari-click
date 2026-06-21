import { z } from "zod";

import { phoneSchema } from "@/server/validators/auth";

// Storefront contact-form input. Phone normalized to +8801XXXXXXXXX; email optional.
export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: phoneSchema,
  email: z.string().trim().email("Enter a valid email").max(160).optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Subject is required").max(160),
  message: z.string().trim().min(1, "Message is required").max(4000),
});
export type ContactMessageInput = z.input<typeof contactMessageSchema>;
