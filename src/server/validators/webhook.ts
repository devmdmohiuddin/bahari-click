import { z } from "zod";

// Inbound courier status webhook payload (provider-agnostic shape we normalize to).
export const courierWebhookSchema = z.object({
  trackingCode: z.string().trim().min(1),
  status: z.string().trim().min(1), // raw courier delivery status
});
export type CourierWebhookInput = z.infer<typeof courierWebhookSchema>;
