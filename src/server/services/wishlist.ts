import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { productCardSelect, toProductCard } from "@/server/services/listing";

// Customer wishlist. Unique per (customer, product); add is idempotent.

export async function listWishlist(customerId: string) {
  const rows = await db.wishlist.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, product: { select: productCardSelect } },
  });
  return rows.map((r) => ({ addedAt: r.createdAt, ...toProductCard(r.product) }));
}

export async function addToWishlist(customerId: string, productId: string) {
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw notFound("Product not found");

  await db.wishlist.upsert({
    where: { customerId_productId: { customerId, productId } },
    create: { customerId, productId },
    update: {},
  });
  return { productId, wishlisted: true };
}

export async function removeFromWishlist(customerId: string, productId: string) {
  await db.wishlist.deleteMany({ where: { customerId, productId } });
  return { productId, wishlisted: false };
}

export async function isWishlisted(customerId: string, productId: string) {
  const row = await db.wishlist.findUnique({
    where: { customerId_productId: { customerId, productId } },
    select: { id: true },
  });
  return Boolean(row);
}
