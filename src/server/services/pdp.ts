import { db } from "@/lib/db";
import { withDisplaySold } from "@/server/services/product";
import { productCardSelect, toProductCard, type ProductCard } from "@/server/services/listing";
import {
  getRatingBreakdown,
  listApprovedReviews,
  type RatingBreakdown,
} from "@/server/services/review";

// F2.1: a single service that returns everything the PDP renders — the full
// product (variants + product/variant images + specs), approved reviews with a
// rating breakdown, and related products. Published products only.

const RELATED_LIMIT = 8;

const pdpInclude = {
  subcategory: { include: { category: true } },
  variants: {
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  },
  images: { orderBy: { sortOrder: "asc" } },
  specs: { orderBy: { sortOrder: "asc" } },
} as const;

export async function getProductDetailBySlug(slug: string) {
  const product = await db.product.findFirst({
    where: { slug, isPublished: true },
    include: pdpInclude,
  });
  if (!product) return null;

  const [relatedRows, reviews, ratingBreakdown] = await Promise.all([
    db.product.findMany({
      where: {
        isPublished: true,
        subcategoryId: product.subcategoryId,
        NOT: { id: product.id },
      },
      orderBy: [{ soldCountReal: "desc" }, { createdAt: "desc" }],
      take: RELATED_LIMIT,
      select: productCardSelect,
    }),
    listApprovedReviews(product.id),
    getRatingBreakdown(product.id),
  ]);

  const related: ProductCard[] = relatedRows.map(toProductCard);

  return {
    product: withDisplaySold(product),
    related,
    reviews,
    ratingBreakdown,
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetailBySlug>>>;
export type { RatingBreakdown };
