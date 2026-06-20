import { mockCourierAdapter } from "./mock";
import { steadfastAdapter } from "./steadfast";
import type { CourierAdapter } from "./types";

export type {
  ConsignmentResult,
  CourierAdapter,
  CourierStatus,
  CreateConsignmentInput,
  FraudCheckResult,
  FraudVerdict,
} from "./types";

// Provider selection. Dev defaults to the free mock; set COURIER_PROVIDER=steadfast
// (+ STEADFAST_* credentials) to go live.
function resolveCourierAdapter(): CourierAdapter {
  const provider = process.env.COURIER_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
      return mockCourierAdapter;
    case "steadfast":
      return steadfastAdapter;
    default:
      console.warn(`[courier] unknown COURIER_PROVIDER "${provider}", falling back to mock`);
      return mockCourierAdapter;
  }
}

export const courier = resolveCourierAdapter();
