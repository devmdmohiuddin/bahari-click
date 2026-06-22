import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { sourcingInputSchema, type SourcingInput } from "@/server/validators/sourcing";

// Sourcing records + landed-cost / profit analytics. Per-unit landed cost (BDT):
//   unitCostCNY * cnyRate  +  shippingCost / batchQty

function cnyRate(): number {
  return Number(process.env.SOURCING_CNY_BDT_RATE ?? "17.5") || 17.5;
}

export function landedCostPerUnit(
  unitCostCNY: number,
  shippingCost: number,
  batchQty: number,
): number {
  const perUnitShipping = batchQty > 0 ? shippingCost / batchQty : 0;
  return Math.round(unitCostCNY * cnyRate() + perUnitShipping);
}

export async function createSourcingRecord(input: SourcingInput) {
  const data = sourcingInputSchema.parse(input);
  const product = await db.product.findUnique({
    where: { id: data.productId },
    select: { id: true },
  });
  if (!product) throw notFound("Product not found");

  const landedCostBDT = landedCostPerUnit(data.unitCostCNY, data.shippingCost, data.batchQty);

  return db.sourcingRecord.create({
    data: {
      productId: data.productId,
      supplierName: data.supplierName,
      supplierUrl: data.supplierUrl ? data.supplierUrl : null,
      unitCostCNY: data.unitCostCNY,
      shippingCost: data.shippingCost,
      batchQty: data.batchQty,
      landedCostBDT,
    },
  });
}

export async function listSourcingForProduct(productId: string) {
  return db.sourcingRecord.findMany({ where: { productId }, orderBy: { purchasedAt: "desc" } });
}

/** Latest landed cost per product, as a map. */
async function latestLandedCosts(): Promise<Map<string, number>> {
  const rows = await db.$queryRaw<{ productId: string; landedCostBDT: number }[]>(Prisma.sql`
    SELECT DISTINCT ON ("productId") "productId", "landedCostBDT"
    FROM "sourcing_record"
    ORDER BY "productId", "purchasedAt" DESC
  `);
  return new Map(rows.map((r) => [r.productId, r.landedCostBDT]));
}

export interface ProfitRow {
  productId: string;
  title: string;
  units: number;
  revenue: number;
  landedUnitCost: number;
  cost: number;
  profit: number;
  marginPct: number;
}

/** Profit per product from delivered sales vs latest landed cost. */
export async function profitReport(
  from?: Date,
  to?: Date,
): Promise<{
  rows: ProfitRow[];
  totals: { revenue: number; cost: number; profit: number; marginPct: number };
}> {
  const fromDate = from ?? new Date(Date.now() - 30 * 86_400_000);
  const toDate = to ?? new Date();

  const sales = await db.$queryRaw<
    { productId: string; title: string; units: number; revenue: number }[]
  >(
    Prisma.sql`
      SELECT p.id AS "productId", p.title AS title,
             sum(oi.qty)::int AS units, sum(oi."lineTotal")::int AS revenue
      FROM "order_item" oi
      JOIN "order" o ON o.id = oi."orderId"
      JOIN "variant" v ON v.id = oi."variantId"
      JOIN "product" p ON p.id = v."productId"
      WHERE o.status = 'delivered' AND o."createdAt" >= ${fromDate} AND o."createdAt" <= ${toDate}
      GROUP BY p.id, p.title
      ORDER BY revenue DESC
    `,
  );

  const landed = await latestLandedCosts();

  const rows: ProfitRow[] = sales.map((s) => {
    const landedUnitCost = landed.get(s.productId) ?? 0;
    const cost = landedUnitCost * s.units;
    const profit = s.revenue - cost;
    return {
      productId: s.productId,
      title: s.title,
      units: s.units,
      revenue: s.revenue,
      landedUnitCost,
      cost,
      profit,
      marginPct: s.revenue > 0 ? Math.round((profit / s.revenue) * 100) : 0,
    };
  });

  const revenue = rows.reduce((n, r) => n + r.revenue, 0);
  const cost = rows.reduce((n, r) => n + r.cost, 0);
  const profit = revenue - cost;
  return {
    rows,
    totals: {
      revenue,
      cost,
      profit,
      marginPct: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
    },
  };
}
