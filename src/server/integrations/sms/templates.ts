import type { SmsTemplate } from "./types";

// SMS copy. Kept short — BD SMS is billed per 160-char segment.

export interface OrderSmsData {
  orderNumber: string;
  name?: string | null;
  total?: number;
  trackingCode?: string | null;
}

export function buildOrderConfirmedSms(d: OrderSmsData): string {
  const who = d.name ? `${d.name}, ` : "";
  return `${who}your Bahari Click order ${d.orderNumber} is confirmed (COD ৳${d.total}). We'll text you when it ships.`;
}

export function buildOrderDispatchedSms(d: OrderSmsData): string {
  const track = d.trackingCode ? ` Tracking: ${d.trackingCode}.` : "";
  return `Your Bahari Click order ${d.orderNumber} has been dispatched.${track}`;
}

export function buildOrderDeliveredSms(d: OrderSmsData): string {
  return `Your Bahari Click order ${d.orderNumber} has been delivered. Thank you for shopping with us!`;
}

export function buildRestockedSms(productTitle: string): string {
  return `Good news! "${productTitle}" is back in stock at Bahari Click. Order now before it sells out.`;
}

// Map an order status to its SMS template (null = no SMS for that status).
export function templateForStatus(status: string): SmsTemplate | null {
  switch (status) {
    case "confirmed":
      return "order_confirmed";
    case "dispatched":
      return "order_dispatched";
    case "delivered":
      return "order_delivered";
    default:
      return null;
  }
}
