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
  /** Present only for single-variant products — enables quick add-to-cart from
   *  the card. Multi-variant products link through to the PDP to choose. */
  quickAdd: { variantId: string; price: number; stock: number } | null;
}

export interface ListingResult {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Shared select + mapper so listings and "related products" produce identical
// product cards.
export const productCardSelect = {
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
  variants: { where: { isActive: true }, select: { id: true, price: true, stock: true } },
} satisfies Prisma.ProductSelect;

type ProductCardRow = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export function toProductCard(p: ProductCardRow): ProductCard {
  const prices = p.variants.map((v) => v.price ?? p.basePrice);
  const only = p.variants.length === 1 ? p.variants[0] : null;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    priceFrom: prices.length ? Math.min(...prices) : p.basePrice,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    soldCountDisplay: p.soldCountReal + p.soldCountBoost,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    isFeatured: p.isFeatured,
    inStock: p.variants.some((v) => v.stock > 0),
    image: p.images[0] ?? null,
    quickAdd: only
      ? { variantId: only.id, price: only.price ?? p.basePrice, stock: only.stock }
      : null,
  };
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
      select: productCardSelect,
    }),
  ]);

  const items = rows.map(toProductCard);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Resolve published products by slug, preserving the requested order. Used by
 *  campaign/flash-sale pages whose product set is curated in the admin. */
export async function getProductCardsBySlugs(slugs: string[]): Promise<ProductCard[]> {
  if (slugs.length === 0) return [];
  const rows = await db.product.findMany({
    where: { isPublished: true, slug: { in: slugs } },
    select: productCardSelect,
  });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return slugs.flatMap((s) => {
    const row = bySlug.get(s);
    return row ? [toProductCard(row)] : [];
  });
}
