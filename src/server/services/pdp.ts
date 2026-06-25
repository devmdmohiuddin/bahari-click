import { db } from "@/lib/db";
import { withDisplaySold } from "@/server/services/product";
import { parseReviewSummary, recommendProducts } from "@/server/services/ai";
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

  const [relatedRows, reviews, ratingBreakdown, recommended] = await Promise.all([
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
    // AI-6: cross-category "you may also like" by embedding similarity.
    recommendProducts(product.id, RELATED_LIMIT),
  ]);

  const related: ProductCard[] = relatedRows.map(toProductCard);
  // Drop recommendations already shown in the same-subcategory related row.
  const relatedIds = new Set(related.map((p) => p.id));
  const recommends = recommended.filter((p) => !relatedIds.has(p.id));

  return {
    product: withDisplaySold(product),
    related,
    recommended: recommends,
    reviews,
    ratingBreakdown,
    // AI-2: cached pros/cons summary (null until enough approved reviews exist).
    reviewSummary: parseReviewSummary(product.reviewSummary),
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetailBySlug>>>;
export type { RatingBreakdown };
