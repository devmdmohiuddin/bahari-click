import { createHash } from "node:crypto";

// Meta (Facebook) Conversions API — server-side Purchase events for accurate ad
// attribution. Deduplicated with the client Pixel via a shared event_id
// (Order.metaEventId). No-op without NEXT_PUBLIC_META_PIXEL_ID +
// META_CAPI_ACCESS_TOKEN, so dev stays free and unblocked.

const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export interface PurchaseEventInput {
  eventId: string; // == Order.metaEventId, shared with the client pixel for dedup
  value: number; // order total, whole BDT
  phone: string; // +8801XXXXXXXXX
  contents: { id: string; quantity: number }[];
  eventSourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
}

export function isMetaConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CAPI_ACCESS_TOKEN);
}

export async function sendPurchaseEvent(input: PurchaseEventInput): Promise<void> {
  if (!isMetaConfigured()) return;

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID!;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN!;

  // Meta requires PII (phone) normalized + SHA-256 hashed. Strip the leading '+'.
  const normalizedPhone = input.phone.replace(/^\+/, "");

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: {
          ph: [sha256(normalizedPhone)],
          ...(input.clientIp ? { client_ip_address: input.clientIp } : {}),
          ...(input.userAgent ? { client_user_agent: input.userAgent } : {}),
        },
        custom_data: {
          currency: "BDT",
          value: input.value,
          content_type: "product",
          contents: input.contents.map((c) => ({ id: c.id, quantity: c.quantity })),
        },
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, access_token: accessToken }),
    });
    if (!res.ok) {
      console.error("[meta-capi] purchase event rejected", res.status, await res.text());
    }
  } catch (error) {
    // Fail-open: ad tracking must never break checkout.
    console.error("[meta-capi] purchase event failed", error);
  }
}
