import { db } from "@/lib/db";
import { sms, type SmsTemplate } from "@/server/integrations/sms";
import {
  buildOrderConfirmedSms,
  buildOrderDeliveredSms,
  buildOrderDispatchedSms,
  buildRestockedSms,
  templateForStatus,
  type OrderSmsData,
} from "@/server/integrations/sms/templates";
import { rateLimit } from "@/server/services/rate-limit";

// SMS notifications: builds the right copy per event, sends via the configured
// adapter, rate-limits per recipient, and logs every attempt. Fail-soft — a
// failed/limited SMS never throws (it must not break order processing).

const PER_PHONE_LIMIT = 20; // messages
const PER_PHONE_WINDOW = 60 * 60; // 1 hour

async function sendSms(to: string, template: SmsTemplate, text: string) {
  const limit = await rateLimit(`sms:${to}`, PER_PHONE_LIMIT, PER_PHONE_WINDOW);
  if (!limit.ok) {
    await logSms(to, template, text, { ok: false, error: "rate_limited" });
    return { ok: false as const, error: "rate_limited" };
  }

  let result;
  try {
    result = await sms.send({ to, template, text });
  } catch (error) {
    result = { ok: false, error: (error as Error).message };
  }
  await logSms(to, template, text, result);
  return result;
}

async function logSms(
  to: string,
  template: SmsTemplate,
  text: string,
  result: { ok: boolean; providerMessageId?: string; error?: string },
) {
  try {
    await db.smsLog.create({
      data: {
        to,
        template,
        text,
        provider: sms.name,
        ok: result.ok,
        providerMessageId: result.providerMessageId ?? null,
        error: result.error ?? null,
      },
    });
  } catch (error) {
    console.error("[sms] failed to log", error);
  }
}

export interface OrderForSms extends OrderSmsData {
  custPhone: string;
}

/** Send the lifecycle SMS for a given order status (no-op for statuses without one). */
export async function sendOrderStatusSms(order: OrderForSms, status: string) {
  const template = templateForStatus(status);
  if (!template) return;

  const data: OrderSmsData = {
    orderNumber: order.orderNumber,
    name: order.name,
    total: order.total,
    trackingCode: order.trackingCode,
  };

  const text =
    template === "order_confirmed"
      ? buildOrderConfirmedSms(data)
      : template === "order_dispatched"
        ? buildOrderDispatchedSms(data)
        : buildOrderDeliveredSms(data);

  return sendSms(order.custPhone, template, text);
}

export async function sendRestockedSms(phone: string, productTitle: string) {
  return sendSms(phone, "restocked", buildRestockedSms(productTitle));
}
