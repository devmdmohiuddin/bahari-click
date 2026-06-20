import { bulkSmsBdAdapter } from "./bulksmsbd";
import { mockSmsAdapter } from "./mock";
import type { SmsAdapter } from "./types";

export type { SmsAdapter, SmsMessage, SmsResult, SmsTemplate } from "./types";

// Provider selection. Dev defaults to the free mock (console log). Set
// SMS_PROVIDER=bulksmsbd (+ SMS_API_KEY/SMS_SENDER_ID) to go live.
function resolveSmsAdapter(): SmsAdapter {
  const provider = process.env.SMS_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
      return mockSmsAdapter;
    case "bulksmsbd":
      return bulkSmsBdAdapter;
    default:
      console.warn(`[sms] unknown SMS_PROVIDER "${provider}", falling back to mock`);
      return mockSmsAdapter;
  }
}

export const sms = resolveSmsAdapter();
