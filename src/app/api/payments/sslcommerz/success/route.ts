import { NextResponse, type NextRequest } from "next/server";

import { readCallbackParams } from "@/server/integrations/payments/callback";
import { confirmPayment } from "@/server/services/payment";

export const dynamic = "force-dynamic";

// Buyer is redirected here after a successful gateway payment. We confirm
// server-side (don't trust the redirect alone) and then bounce to the storefront.
async function handle(request: NextRequest) {
  const base = process.env.APP_URL ?? new URL(request.url).origin;
  const params = await readCallbackParams(request);
  const tranId = params.tran_id;
  const valId = params.val_id;

  try {
    if (tranId) await confirmPayment(tranId, valId);
    return NextResponse.redirect(`${base}/?payment=success&tran=${tranId ?? ""}`, { status: 303 });
  } catch (error) {
    console.error("[payments/success]", error);
    return NextResponse.redirect(`${base}/?payment=review&tran=${tranId ?? ""}`, { status: 303 });
  }
}

export const GET = handle;
export const POST = handle;
