import { db } from "@/lib/db";
import { cacheTags, revalidateTags } from "@/lib/cache";
import { notFound, validationError } from "@/lib/errors";
import { notifyRestock } from "@/server/services/preorder";

// Variant.stock is authoritative. All changes flow through adjustStock/setStock,
// which record a StockAdjustment with a reason. Concurrent order decrements in
// Phase 4 will use a conditional update to prevent oversell; manual admin
// adjustments here run inside a transaction.

export interface StockChange {
  variantId: string;
  previousStock: number;
  newStock: number;
}

export async function getVariantAvailability(variantId: string) {
  const variant = await db.variant.findUnique({
    where: { id: variantId },
    select: { id: true, stock: true, isActive: true, productId: true },
  });
  if (!variant) throw notFound("Variant not found");
  return { ...variant, inStock: variant.isActive && variant.stock > 0 };
}

/** Apply a signed delta to a variant's stock, recording the reason. */
export async function adjustStock(
  variantId: string,
  delta: number,
  reason = "manual",
  adminId?: string | null,
): Promise<StockChange> {
  if (delta === 0) throw validationError("Delta must be non-zero");

  const change = await db.$transaction(async (tx) => {
    const variant = await tx.variant.findUnique({
      where: { id: variantId },
      select: { stock: true, productId: true },
    });
    if (!variant) throw notFound("Variant not found");

    const newStock = variant.stock + delta;
    if (newStock < 0) throw validationError("Insufficient stock for this adjustment");

    await tx.variant.update({ where: { id: variantId }, data: { stock: newStock } });
    await tx.stockAdjustment.create({
      data: { variantId, delta, newStock, reason, adminId: adminId ?? null },
    });

    return {
      variantId,
      previousStock: variant.stock,
      newStock,
      productId: variant.productId,
    };
  });

  revalidateTags(cacheTags.products, cacheTags.product(change.productId));

  // Out-of-stock → in-stock: notify anyone waiting (marks requests + enqueues SMS jobs).
  if (change.previousStock === 0 && change.newStock > 0) {
    await notifyRestock(variantId);
  }

  return { variantId, previousStock: change.previousStock, newStock: change.newStock };
}

/** Set stock to an absolute value, recording the implied delta. */
export async function setStock(
  variantId: string,
  stock: number,
  reason = "manual",
  adminId?: string | null,
): Promise<StockChange> {
  if (stock < 0) throw validationError("Stock cannot be negative");

  const variant = await db.variant.findUnique({
    where: { id: variantId },
    select: { stock: true },
  });
  if (!variant) throw notFound("Variant not found");

  if (variant.stock === stock) {
    return { variantId, previousStock: stock, newStock: stock };
  }
  return adjustStock(variantId, stock - variant.stock, reason, adminId);
}

/** Active variants at or below the threshold, for the admin low-stock view. */
export async function lowStockVariants(threshold = 5) {
  return db.variant.findMany({
    where: { isActive: true, stock: { lte: threshold } },
    orderBy: { stock: "asc" },
    select: {
      id: true,
      sku: true,
      color: true,
      size: true,
      stock: true,
      product: { select: { id: true, title: true, slug: true } },
    },
  });
}
