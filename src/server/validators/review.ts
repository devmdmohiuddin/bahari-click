import { z } from "zod";

// Review creation input. Either a linked customer (customerId) or a guest name
// identifies the author; the service fills customerId from the session when present.

export const createReviewSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  rating: z.number().int().min(1, "Rating is required").max(5),
  comment: z.string().trim().max(2000).optional(),
  guestName: z.string().trim().min(1).max(80).optional(),
  imageUrls: z.array(z.string().trim().min(1)).max(6).default([]),
});
export type CreateReviewInput = z.input<typeof createReviewSchema>;
