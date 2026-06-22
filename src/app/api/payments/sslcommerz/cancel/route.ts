import { NextResponse, type NextRequest } from "next/server";

import { PaymentStatus } from "@/generated/prisma/client";
import { readCallbackParams } from "@/server/integrations/payments/callback";
import { markPaymentFailed } from "@/server/services/payment";

export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  const base = process.env.APP_URL ?? new URL(request.url).origin;
  const params = await readCallbackParams(request);
  const tranId = params.tran_id;

  try {
    if (tranId) await markPaymentFailed(tranId, PaymentStatus.cancelled);
  } catch (error) {
    console.error("[payments/cancel]", error);
  }
  return NextResponse.redirect(`${base}/?payment=cancelled&tran=${tranId ?? ""}`, { status: 303 });
}

export const GET = handle;
export const POST = handle;
