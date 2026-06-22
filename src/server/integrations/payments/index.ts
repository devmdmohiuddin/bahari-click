import { mockPaymentAdapter } from "./mock";
import { sslcommerzAdapter } from "./sslcommerz";
import type { PaymentAdapter } from "./types";

export type { InitiateParams, InitiateResult, PaymentAdapter, ValidationResult } from "./types";

// Provider selection. Dev defaults to the free mock; set PAYMENT_PROVIDER=sslcommerz
// (+ SSLCOMMERZ_* sandbox/live credentials) to use the real gateway.
function resolvePaymentAdapter(): PaymentAdapter {
  const provider = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (provider) {
    case "mock":
      return mockPaymentAdapter;
    case "sslcommerz":
      return sslcommerzAdapter;
    default:
      console.warn(`[payments] unknown PAYMENT_PROVIDER "${provider}", falling back to mock`);
      return mockPaymentAdapter;
  }
}

export const payments = resolvePaymentAdapter();
