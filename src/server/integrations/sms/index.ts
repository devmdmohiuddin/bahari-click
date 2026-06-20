import { mockSmsAdapter } from "./mock";
import type { SmsAdapter } from "./types";

export type { SmsAdapter, SmsMessage, SmsResult, SmsTemplate } from "./types";

// Provider selection. Dev defaults to the free mock (console log).
// Real providers (bulksmsbd / alpha) plug in here once their adapters exist.
function resolveSmsAdapter(): SmsAdapter {
  const provider = process.env.SMS_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
      return mockSmsAdapter;
    default:
      console.warn(`[sms] unknown SMS_PROVIDER "${provider}", falling back to mock`);
      return mockSmsAdapter;
  }
}

export const sms = resolveSmsAdapter();
