import type { InitiateParams, InitiateResult, PaymentAdapter, ValidationResult } from "./types";

// Free dev adapter: simulates the SSLCommerz sandbox without network. "Paying"
// redirects straight to the success URL with a mock val_id, and validate()
// always succeeds — enough to exercise the full online-pay flow at ৳0.
export const mockPaymentAdapter: PaymentAdapter = {
  name: "mock",

  async initiate(params: InitiateParams): Promise<InitiateResult> {
    const url = new URL(params.successUrl);
    url.searchParams.set("tran_id", params.transactionId);
    url.searchParams.set("val_id", `mock_${params.transactionId}`);
    url.searchParams.set("status", "VALID");
    return { gatewayUrl: url.toString(), sessionId: `mock_sess_${params.transactionId}` };
  },

  async validate(input): Promise<ValidationResult> {
    return {
      valid: true,
      status: "VALID",
      transactionId: input.transactionId ?? "",
      valId: input.valId ?? `mock_${input.transactionId}`,
      cardType: "MOCK",
    };
  },
};
