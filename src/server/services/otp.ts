import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";

// Domain service: send a login/verification OTP to a BD phone number.
// Delegates to Better Auth, which calls the configured SMS adapter (mock in dev).
// Services own business rules and are the only layer that touches Prisma/integrations.

export async function sendCustomerOtp(phone: string): Promise<{ phone: string }> {
  const result = await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } });

  if (!result || ("status" in result && result.status === false)) {
    throw new AppError("INTEGRATION", "Could not send the verification code. Try again.");
  }

  return { phone };
}
