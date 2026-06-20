import { NextResponse, type NextRequest } from "next/server";

import { verifyHmacSignature } from "@/lib/webhook";
import { applyCourierStatus } from "@/server/services/order";
import { courierWebhookSchema } from "@/server/validators/webhook";

// Inbound courier status webhook. Verifies an HMAC-SHA256 signature over the raw
// body (COURIER_WEBHOOK_SECRET) before doing anything, then applies the status.
// Returns 200 even for ignored/illegal transitions so the provider doesn't retry.

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.COURIER_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature =
    request.headers.get("x-webhook-signature") ?? request.headers.get("x-signature");

  if (!verifyHmacSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = courierWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await applyCourierStatus(parsed.data.trackingCode, parsed.data.status);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[webhook/courier]", error);
    // Unknown tracking code etc. — acknowledge to avoid retry storms.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
