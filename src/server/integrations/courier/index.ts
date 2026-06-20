import { mockCourierAdapter } from "./mock";
import type { CourierAdapter } from "./types";

export type {
  ConsignmentResult,
  CourierAdapter,
  CourierStatus,
  CreateConsignmentInput,
  FraudCheckResult,
  FraudVerdict,
} from "./types";

// Provider selection. Dev defaults to the free mock; Steadfast plugs in here
// in Phase 5 once STEADFAST_* credentials are set.
function resolveCourierAdapter(): CourierAdapter {
  const provider = process.env.COURIER_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
      return mockCourierAdapter;
    default:
      console.warn(`[courier] unknown COURIER_PROVIDER "${provider}", falling back to mock`);
      return mockCourierAdapter;
  }
}

export const courier = resolveCourierAdapter();
