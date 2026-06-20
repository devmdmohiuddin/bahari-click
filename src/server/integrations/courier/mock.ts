import type {
  ConsignmentResult,
  CourierAdapter,
  CourierStatus,
  CreateConsignmentInput,
  FraudCheckResult,
} from "./types";

// Free dev adapter: deterministic, no network. Returns a "good" verdict for
// most numbers and flags a small slice as risky so the fraud-check UI is
// exercisable. Replace with the Steadfast adapter in Phase 5.
export const mockCourierAdapter: CourierAdapter = {
  name: "mock",

  async fraudCheck(phone: string): Promise<FraudCheckResult> {
    const lastDigit = Number(phone.slice(-1)) || 0;
    const score = lastDigit >= 8 ? 70 : 10;
    return { score, verdict: score >= 50 ? "risky" : "good" };
  },

  async createConsignment(input: CreateConsignmentInput): Promise<ConsignmentResult> {
    return {
      trackingCode: `MOCK-${input.orderNumber}`,
      consignmentId: `cns_${Date.now()}`,
    };
  },

  async getStatus(): Promise<CourierStatus> {
    return "dispatched";
  },
};
