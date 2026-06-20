import type { SmsAdapter, SmsMessage, SmsResult } from "./types";

// Free dev adapter: logs to the server console instead of sending real SMS.
// OTP codes appear here in development (docs/06-cost-and-free-tiers.md).
export const mockSmsAdapter: SmsAdapter = {
  name: "mock",
  async send(message: SmsMessage): Promise<SmsResult> {
    console.info(
      `\n📱 [mock-sms] → ${message.to}\n   template: ${message.template}\n   text: ${message.text}\n`,
    );
    return { ok: true, providerMessageId: `mock_${Date.now()}` };
  },
};
