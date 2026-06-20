import { NextResponse, type NextRequest } from "next/server";

import { runSync } from "@/server/services/sync";

// Status-sync worker. Invoked by Vercel Cron (see vercel.json). Drains the
// restock-notify queue and polls the courier for dispatched orders.
//
// Auth: when CRON_SECRET is set, the request must carry `Authorization:
// Bearer <CRON_SECRET>` (Vercel Cron sends this). In dev with no secret it is open.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/sync] failed", error);
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}
