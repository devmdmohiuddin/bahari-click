import { NextResponse, type NextRequest } from "next/server";

import { readCallbackParams } from "@/server/integrations/payments/callback";
import { confirmPayment } from "@/server/services/payment";

export const dynamic = "force-dynamic";

// Server-to-server IPN — the authoritative confirmation (independent of the
// buyer's browser redirect). SSLCommerz POSTs here with tran_id + val_id.
export async function POST(request: NextRequest) {
  const params = await readCallbackParams(request);
  const tranId = params.tran_id;
  const valId = params.val_id;
  const status = params.status;

  if (!tranId) return NextResponse.json({ ok: false, error: "missing tran_id" }, { status: 400 });

  try {
    if (status === "VALID" || status === "VALIDATED") {
      const result = await confirmPayment(tranId, valId);
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json({ ok: true, ignored: status });
  } catch (error) {
    console.error("[payments/ipn]", error);
    // Acknowledge to avoid retries; we logged the failure for review.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
