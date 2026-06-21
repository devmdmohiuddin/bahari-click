// Client analytics: Meta Pixel + GA4 (gtag). Every helper is a no-op when the
// corresponding id isn't configured, so dev stays clean and free. Purchase fires
// with the shared event id (Order.metaEventId) so the client Pixel dedupes
// against the server Conversions API (F5.4 / S5.2).

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

type Params = Record<string, unknown>;

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function fbq(event: string, params?: Params, opts?: { eventID?: string }) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params ?? {}, opts);
  }
}

function gtag(event: string, params?: Params) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, params ?? {});
  }
}

const CURRENCY = "BDT";

export type AnalyticsItem = { id: string; name: string; price: number; quantity?: number };

export function trackPageView(url: string) {
  if (GA_ID) gtag("page_view", { page_path: url });
  // Meta tracks PageView automatically via the base pixel on SPA route changes
  // when fbq is present; fire explicitly to be safe.
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}

export function trackViewContent(item: AnalyticsItem) {
  fbq("ViewContent", {
    content_ids: [item.id],
    content_name: item.name,
    content_type: "product",
    value: item.price,
    currency: CURRENCY,
  });
  gtag("view_item", {
    currency: CURRENCY,
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, price: item.price }],
  });
}

export function trackAddToCart(item: AnalyticsItem) {
  const qty = item.quantity ?? 1;
  fbq("AddToCart", {
    content_ids: [item.id],
    content_name: item.name,
    content_type: "product",
    value: item.price * qty,
    currency: CURRENCY,
  });
  gtag("add_to_cart", {
    currency: CURRENCY,
    value: item.price * qty,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: qty }],
  });
}

export function trackInitiateCheckout(value: number, numItems: number) {
  fbq("InitiateCheckout", { value, currency: CURRENCY, num_items: numItems });
  gtag("begin_checkout", { currency: CURRENCY, value });
}

export function trackPurchase(input: {
  eventId: string | null;
  orderNumber: string;
  value: number;
}) {
  fbq(
    "Purchase",
    { value: input.value, currency: CURRENCY },
    input.eventId ? { eventID: input.eventId } : undefined,
  );
  gtag("purchase", {
    transaction_id: input.orderNumber,
    value: input.value,
    currency: CURRENCY,
  });
}
