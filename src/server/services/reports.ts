import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { lowStockVariants } from "@/server/services/stock";

// Admin reporting aggregations. "Sales"/"COD collected" count delivered orders
// (realized revenue); pipeline metrics count all orders by status.

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

export interface SalesPoint {
  day: string; // ISO date
  orders: number;
  revenue: number; // whole BDT
}

/** Daily delivered-order revenue over a window (default last 30 days). */
export async function salesByPeriod(from = daysAgo(30), to = new Date()): Promise<SalesPoint[]> {
  const rows = await db.$queryRaw<{ day: Date; orders: number; revenue: number }[]>(Prisma.sql`
    SELECT date_trunc('day', "createdAt") AS day,
           count(*)::int AS orders,
           coalesce(sum(total), 0)::int AS revenue
    FROM "order"
    WHERE status = 'delivered' AND "createdAt" >= ${from} AND "createdAt" <= ${to}
    GROUP BY 1
    ORDER BY 1
  `);
  return rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    orders: r.orders,
    revenue: r.revenue,
  }));
}

export interface StatusCount {
  status: OrderStatus;
  count: number;
  total: number;
}

/** Order counts + value grouped by status (whole pipeline). */
export async function ordersByStatus(): Promise<StatusCount[]> {
  const grouped = await db.order.groupBy({
    by: ["status"],
    _count: { _all: true },
    _sum: { total: true },
  });
  return grouped.map((g) => ({
    status: g.status,
    count: g._count._all,
    total: g._sum.total ?? 0,
  }));
}

export interface TopProduct {
  productId: string;
  title: string;
  units: number;
  revenue: number;
}

/** Best sellers by units from delivered orders. */
export async function topProducts(
  limit = 10,
  from = daysAgo(30),
  to = new Date(),
): Promise<TopProduct[]> {
  return db.$queryRaw<TopProduct[]>(Prisma.sql`
    SELECT p.id AS "productId",
           p.title AS title,
           sum(oi.qty)::int AS units,
           sum(oi."lineTotal")::int AS revenue
    FROM "order_item" oi
    JOIN "order" o ON o.id = oi."orderId"
    JOIN "variant" v ON v.id = oi."variantId"
    JOIN "product" p ON p.id = v."productId"
    WHERE o.status = 'delivered' AND o."createdAt" >= ${from} AND o."createdAt" <= ${to}
    GROUP BY p.id, p.title
    ORDER BY units DESC
    LIMIT ${limit}
  `);
}

/** Total COD value collected from delivered orders in a window. */
export async function codCollected(from = daysAgo(30), to = new Date()) {
  const agg = await db.order.aggregate({
    where: {
      status: OrderStatus.delivered,
      paymentMethod: "COD",
      createdAt: { gte: from, lte: to },
    },
    _sum: { total: true },
    _count: { _all: true },
  });
  return { total: agg._sum.total ?? 0, orders: agg._count._all };
}

/** Dashboard bundle for a rolling window of N days (keeps time math off the RSC). */
export async function getDashboardForDays(days = 30) {
  const to = new Date();
  const from = daysAgo(days);
  const data = await getDashboard(from, to);
  return { ...data, todayIso: to.toISOString().slice(0, 10) };
}

/**
 * Report bundle for an explicit (optional) date range. Defaults to the last
 * 30 days. Echoes the resolved range as yyyy-mm-dd for the filter inputs, and
 * adds the average delivered-order value. Date math lives here, not in the RSC.
 */
export async function getReport(fromIso?: string, toIso?: string) {
  const to = toIso ? new Date(`${toIso}T23:59:59.999`) : new Date();
  const from = fromIso ? new Date(`${fromIso}T00:00:00`) : daysAgo(30);
  const data = await getDashboard(from, to);
  const avgOrderValue = data.deliveredOrders ? Math.round(data.revenue / data.deliveredOrders) : 0;
  return {
    ...data,
    avgOrderValue,
    fromInput: from.toISOString().slice(0, 10),
    toInput: to.toISOString().slice(0, 10),
  };
}

/** One-call dashboard bundle. */
export async function getDashboard(from = daysAgo(30), to = new Date()) {
  const [sales, statuses, top, lowStock, cod] = await Promise.all([
    salesByPeriod(from, to),
    ordersByStatus(),
    topProducts(10, from, to),
    lowStockVariants(5),
    codCollected(from, to),
  ]);

  const revenue = sales.reduce((sum, p) => sum + p.revenue, 0);
  const deliveredOrders = sales.reduce((sum, p) => sum + p.orders, 0);

  return {
    window: { from: from.toISOString(), to: to.toISOString() },
    revenue,
    deliveredOrders,
    codCollected: cod,
    salesByPeriod: sales,
    ordersByStatus: statuses,
    topProducts: top,
    lowStock,
  };
}
