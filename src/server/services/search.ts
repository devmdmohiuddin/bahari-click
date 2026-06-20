import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { productCardSelect, toProductCard, type ListingResult } from "@/server/services/listing";
import { searchQuerySchema, type SearchQuery, type SearchSort } from "@/server/validators/search";

// Search + multi-filter over published products. Title uses Postgres full-text
// search; structured filters (subcategory, price, color, size, in-stock) combine
// with sort + pagination.

/** Convert free text into a prefix tsquery: "red wallet" → "red:* & wallet:*". */
function toTsQuery(input: string): string | null {
  const terms = input
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((t) => `${t}:*`);
  return terms.length ? terms.join(" & ") : null;
}

function orderByFor(
  sort: SearchSort,
  hasQuery: boolean,
): Prisma.ProductOrderByWithRelationInput[] | undefined {
  switch (sort) {
    case "price_asc":
      return [{ basePrice: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ basePrice: "desc" }, { createdAt: "desc" }];
    case "best_selling":
      return [{ soldCountReal: "desc" }, { createdAt: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "relevance":
    default:
      // With a text query, _relevance ranks by match; without one, fall back to newest.
      return hasQuery ? undefined : [{ createdAt: "desc" }];
  }
}

export async function searchProducts(query: SearchQuery): Promise<ListingResult> {
  const {
    q,
    categorySlug,
    subcategorySlug,
    color,
    size,
    minPrice,
    maxPrice,
    inStock,
    sort,
    page,
    pageSize,
  } = searchQuerySchema.parse(query);

  const tsquery = q ? toTsQuery(q) : null;

  // Variant-level filters (color/size/price/in-stock) must be satisfied by a
  // single active variant via `some`.
  const variantSome: Prisma.VariantWhereInput = {
    isActive: true,
    ...(color ? { color: { equals: color, mode: "insensitive" } } : {}),
    ...(size ? { size: { equals: size, mode: "insensitive" } } : {}),
    ...(inStock ? { stock: { gt: 0 } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const hasVariantFilter = Boolean(
    color || size || inStock || minPrice !== undefined || maxPrice !== undefined,
  );

  const where: Prisma.ProductWhereInput = {
    isPublished: true,
    ...(tsquery ? { title: { search: tsquery } } : {}),
    ...(subcategorySlug
      ? { subcategory: { slug: subcategorySlug } }
      : categorySlug
        ? { subcategory: { category: { slug: categorySlug } } }
        : {}),
    ...(hasVariantFilter ? { variants: { some: variantSome } } : {}),
  };

  const orderBy =
    sort === "relevance" && tsquery
      ? ({
          _relevance: { fields: ["title"], search: tsquery, sort: "desc" },
        } satisfies Prisma.ProductOrderByWithRelationInput)
      : orderByFor(sort, Boolean(tsquery));

  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: productCardSelect,
    }),
  ]);

  return {
    items: rows.map(toProductCard),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
