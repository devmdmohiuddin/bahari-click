"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { getDashboard } from "@/server/services/reports";

// Admin dashboard data. Guarded so report numbers are never exposed publicly.
export async function getDashboardAction(
  fromIso?: string,
  toIso?: string,
): Promise<Result<Awaited<ReturnType<typeof getDashboard>>>> {
  try {
    await requireAdmin();
    const from = fromIso ? new Date(fromIso) : undefined;
    const to = toIso ? new Date(toIso) : undefined;
    return ok(await getDashboard(from, to));
  } catch (error) {
    return toResult(error);
  }
}
