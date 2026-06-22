"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { initiatePayment, type InitiatePaymentResult } from "@/server/services/payment";

// Public: start an online payment for an order and get the gateway redirect URL.
export async function initiatePaymentAction(
  orderId: string,
  amount?: number,
): Promise<Result<InitiatePaymentResult>> {
  try {
    const result = await initiatePayment(orderId, amount);
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}
