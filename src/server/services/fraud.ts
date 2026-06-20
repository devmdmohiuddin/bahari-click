import { courier } from "@/server/integrations/courier";

// COD fraud assessment via the courier adapter (mock in dev, Steadfast in
// Phase 5). Fail-open: if the courier API errors we do NOT block the order —
// we record an "unknown" verdict and flag it for manual review.

export interface FraudAssessment {
  score: number | null;
  verdict: string;
}

export async function assessFraud(phone: string): Promise<FraudAssessment> {
  try {
    const result = await courier.fraudCheck(phone);
    return { score: result.score, verdict: result.verdict };
  } catch (error) {
    console.error("[fraud] check failed — failing open", error);
    return { score: null, verdict: "unknown" };
  }
}
