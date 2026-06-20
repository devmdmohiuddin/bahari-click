import { db } from "@/lib/db";

// DB-backed job queue (free dev/launch — docs/06-cost-and-free-tiers.md).
// Producers call enqueueJob; a Vercel Cron worker drains pending jobs in Phase 5.

export type NotifyJobType = "preorder_restock";

export async function enqueueJob(type: NotifyJobType, payload: object, runAt?: Date) {
  return db.notifyJob.create({
    data: { type, payload, runAt: runAt ?? new Date() },
  });
}
