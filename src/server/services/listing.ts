import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  listingQuerySchema,
  type ListingQuery,
  type ProductSort,
} from "@/server/validators/catalog";

// Storefront product listing: published products by category/subcategory with
// sort + pagination. Returns lightweight cards (one image, price-from, in-stock).

export interface ProductCard {
  id: string;
  title: string;
  slug: string;
  priceFrom: number; // min effective price (variant price ?? basePrice), whole BDT
  basePrice: number;
  compareAtPrice: number | null;
  soldCountDisplay: number;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  inStock: boolean;
  image: { url: string; alt: string | null } | null;
}

export interface ListingResult {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function orderByFor(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ basePrice: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ basePrice: "desc" }, { createdAt: "desc" }];
    case "best_selling":
      // Ordered by real sales (the authentic signal); the boost offset only
      // affects the displayed count, not ranking.
      return [{ soldCountReal: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function listProducts(query: ListingQuery): Promise<ListingResult> {
  const { categorySlug, subcategorySlug, sort, page, pageSize } = listingQuerySchema.parse(query);

  const where: Prisma.ProductWhereInput = {
    isPublished: true,
    ...(subcategorySlug
      ? { subcategory: { slug: subcategorySlug } }
      : categorySlug
        ? { subcategory: { category: { slug: categorySlug } } }
        : {}),
  };

  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: orderByFor(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        basePrice: true,
        compareAtPrice: true,
        soldCountReal: true,
        soldCountBoost: true,
        ratingAvg: true,
        ratingCount: true,
        isFeatured: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
        variants: { where: { isActive: true }, select: { price: true, stock: true } },
      },
    }),
  ]);

  const items: ProductCard[] = rows.map((p) => {
    const prices = p.variants.map((v) => v.price ?? p.basePrice);
    const priceFrom = prices.length ? Math.min(...prices) : p.basePrice;
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      priceFrom,
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      soldCountDisplay: p.soldCountReal + p.soldCountBoost,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      isFeatured: p.isFeatured,
      inStock: p.variants.some((v) => v.stock > 0),
      image: p.images[0] ?? null,
    };
  });

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
