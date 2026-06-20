"use server";

import type { Result } from "@/lib/result";
import { ok, toResult } from "@/lib/result";
import { sendCustomerOtp } from "@/server/services/otp";
import { requestOtpSchema, type RequestOtpInput } from "@/server/validators/auth";

// Sample Server Action demonstrating the F0.5 convention:
//   validate (Zod) → call a service → return a typed Result.
// Actions stay thin; all business logic lives in the service layer.
export async function requestOtpAction(input: RequestOtpInput): Promise<Result<{ phone: string }>> {
  try {
    const { phone } = requestOtpSchema.parse(input);
    const data = await sendCustomerOtp(phone);
    return ok(data);
  } catch (error) {
    return toResult(error);
  }
}
