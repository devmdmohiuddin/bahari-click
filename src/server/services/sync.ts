import { JobStatus, OrderStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { courier, type CourierStatus } from "@/server/integrations/courier";
import { sendRestockedSms } from "@/server/services/notifications";
import { transitionOrderStatus } from "@/server/services/order";

// Background sync, run by the cron route (F5.3). Two jobs:
//  1) drain the NotifyJob queue (restock SMS), and
//  2) poll the courier for dispatched orders and apply status changes
//     (which themselves fire lifecycle SMS + soldCountReal via the order service).
//
// Free dev/launch: DB-backed queue + Vercel Cron, no QStash needed.

const BATCH = 25;

interface RestockPayload {
  preOrderRequestId: string;
  phone: string;
  productId: string;
  variantId: string;
}

export async function drainNotifyJobs(limit = BATCH) {
  const jobs = await db.notifyJob.findMany({
    where: { status: JobStatus.pending, type: "preorder_restock", runAt: { lte: new Date() } },
    orderBy: { runAt: "asc" },
    take: limit,
  });

  let processed = 0;
  for (const job of jobs) {
    // Atomic claim so concurrent runs don't double-send.
    const claim = await db.notifyJob.updateMany({
      where: { id: job.id, status: JobStatus.pending },
      data: { status: JobStatus.processing, attempts: { increment: 1 } },
    });
    if (claim.count === 0) continue;

    try {
      const payload = job.payload as unknown as RestockPayload;
      const product = await db.product.findUnique({
        where: { id: payload.productId },
        select: { title: true },
      });
      await sendRestockedSms(payload.phone, product?.title ?? "an item you wanted");
      await db.notifyJob.update({ where: { id: job.id }, data: { status: JobStatus.done } });
      processed += 1;
    } catch (error) {
      await db.notifyJob.update({
        where: { id: job.id },
        data: { status: JobStatus.failed, lastError: (error as Error).message },
      });
    }
  }
  return { found: jobs.length, processed };
}

// Map a courier status to an internal order status (null = no change).
function courierToOrderStatus(status: CourierStatus): OrderStatus | null {
  switch (status) {
    case "delivered":
      return OrderStatus.delivered;
    case "returned":
    case "cancelled":
      return OrderStatus.returned;
    default:
      return null; // still in transit
  }
}

export async function syncCourierStatuses(limit = BATCH) {
  const orders = await db.order.findMany({
    where: { status: OrderStatus.dispatched, trackingCode: { not: null } },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: { id: true, trackingCode: true },
  });

  let updated = 0;
  for (const order of orders) {
    try {
      const courierStatus = await courier.getStatus(order.trackingCode!);
      const next = courierToOrderStatus(courierStatus);
      if (next) {
        await transitionOrderStatus(order.id, next, { note: `courier:${courierStatus}` });
        updated += 1;
      }
    } catch (error) {
      console.error(`[sync] courier status failed for ${order.id}`, error);
    }
  }
  return { checked: orders.length, updated };
}

export async function runSync() {
  const notify = await drainNotifyJobs();
  const courierSync = await syncCourierStatuses();
  return { notify, courier: courierSync };
}
