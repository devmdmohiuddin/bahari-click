import type { SmsAdapter, SmsMessage, SmsResult } from "./types";

// BulkSMSBD adapter. Used when SMS_PROVIDER=bulksmsbd and SMS_API_KEY/SENDER_ID
// are set. Dev defaults to the mock (৳0). API: https://bulksmsbd.net/api

const BASE_URL = "https://bulksmsbd.net/api/smsapi";

export const bulkSmsBdAdapter: SmsAdapter = {
  name: "bulksmsbd",

  async send(message: SmsMessage): Promise<SmsResult> {
    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID;
    if (!apiKey || !senderId) {
      return { ok: false, error: "SMS provider not configured" };
    }

    // BulkSMSBD expects local numbers (8801XXXXXXXXX, no '+').
    const number = message.to.replace(/^\+/, "");
    const params = new URLSearchParams({
      api_key: apiKey,
      senderid: senderId,
      number,
      message: message.text,
    });

    try {
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const data = (await res.json().catch(() => ({}))) as {
        response_code?: number;
        message_id?: string | number;
        error_message?: string;
      };

      // 202 = accepted by BulkSMSBD.
      if (res.ok && data.response_code === 202) {
        return {
          ok: true,
          providerMessageId: data.message_id ? String(data.message_id) : undefined,
        };
      }
      return { ok: false, error: data.error_message ?? `SMS failed (${res.status})` };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  },
};
