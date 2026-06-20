import { headers } from "next/headers";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

// Postgres-backed fixed-window rate limiter. No Upstash needed for dev/launch
// (docs/06-cost-and-free-tiers.md). Atomic via INSERT ... ON CONFLICT so
// concurrent requests increment the same window safely.

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: Date;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const reset = new Date(Date.now() + windowSec * 1000);

  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>(Prisma.sql`
    INSERT INTO rate_limit (key, count, "resetAt")
    VALUES (${key}, 1, ${reset})
    ON CONFLICT (key) DO UPDATE
    SET count = CASE WHEN rate_limit."resetAt" < now() THEN 1 ELSE rate_limit.count + 1 END,
        "resetAt" = CASE WHEN rate_limit."resetAt" < now() THEN ${reset} ELSE rate_limit."resetAt" END
    RETURNING count, "resetAt"
  `);

  const { count, resetAt } = rows[0];
  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt };
}

/** Throws a RATE_LIMITED AppError when the limit is exceeded. */
export async function enforceRateLimit(key: string, limit: number, windowSec: number) {
  const result = await rateLimit(key, limit, windowSec);
  if (!result.ok) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please try again later.", {
      resetAt: result.resetAt,
    });
  }
  return result;
}

/** Best-effort client IP for rate-limit keys (behind Vercel/proxies). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
