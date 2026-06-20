// Courier adapter contract (BD). Real implementation (Steadfast) lands in
// Phase 5; the mock keeps checkout/fraud-check flows working at ৳0 in dev.

export type FraudVerdict = "good" | "risky" | "unknown";

export interface FraudCheckResult {
  score: number; // 0..100, higher = riskier
  verdict: FraudVerdict;
}

export interface CreateConsignmentInput {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number; // whole BDT
  note?: string;
}

export interface ConsignmentResult {
  trackingCode: string;
  consignmentId: string;
}

export type CourierStatus =
  | "pending"
  | "in_review"
  | "dispatched"
  | "delivered"
  | "returned"
  | "cancelled";

export interface CourierAdapter {
  readonly name: string;
  fraudCheck(phone: string): Promise<FraudCheckResult>;
  createConsignment(input: CreateConsignmentInput): Promise<ConsignmentResult>;
  getStatus(trackingCode: string): Promise<CourierStatus>;
}
