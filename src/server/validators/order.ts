import { z } from "zod";

import { phoneSchema } from "@/server/validators/auth";

// Checkout cart input. The client proposes items + address + zone + coupon;
// the server recomputes every price/total — nothing money-related is trusted.

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  qty: z.number().int().min(1).max(99),
});

export const placeOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Your cart is empty"),
  customer: z.object({
    name: z.string().trim().min(1, "Name is required").max(120),
    phone: phoneSchema,
    address: z.string().trim().min(1, "Address is required").max(400),
    area: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
  }),
  zoneId: z.string().min(1, "Delivery area is required"),
  couponCode: z.string().trim().optional(),
});
export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
});
export type TrackOrderInput = z.input<typeof trackOrderSchema>;
