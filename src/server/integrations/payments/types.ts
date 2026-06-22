// Payment gateway adapter contract. SSLCommerz (sandbox) is the real impl; the
// mock keeps the online-pay flow testable at ৳0 and offline.

export interface InitiateParams {
  transactionId: string;
  amount: number; // whole BDT
  customer: { name: string; phone: string; email?: string | null; address: string };
  productName: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

export interface InitiateResult {
  gatewayUrl: string; // where to redirect the buyer
  sessionId?: string;
}

export interface ValidationResult {
  valid: boolean;
  status: string; // gateway status string (VALID/VALIDATED/FAILED/…)
  transactionId: string;
  valId?: string;
  amount?: number;
  cardType?: string;
  raw?: unknown;
}

export interface PaymentAdapter {
  readonly name: string;
  initiate(params: InitiateParams): Promise<InitiateResult>;
  validate(input: { valId?: string; transactionId?: string }): Promise<ValidationResult>;
}
