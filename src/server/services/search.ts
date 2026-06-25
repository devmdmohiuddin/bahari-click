import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { semanticProductScores } from "@/server/services/ai";
import { productCardSelect, toProductCard, type ListingResult } from "@/server/services/listing";
import { searchQuerySchema, type SearchQuery, type SearchSort } from "@/server/validators/search";

// Search + multi-filter over published products. Title uses Postgres full-text
// search; structured filters (subcategory, price, color, size, in-stock) combine
// with sort + pagination. On relevance sort with a query, AI-3 blends embedding
// similarity on top so semantically-related products surface even without a
// keyword match (no dead-end "no results") — falls back to keyword-only when
// embeddings are unavailable.

/** Cap candidate ids fetched for in-app semantic ranking. */
const SEMANTIC_CANDIDATE_LIMIT = 1000;

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

  // Structured filters (everything except the title text match).
  const baseWhere: Prisma.ProductWhereInput = {
    isPublished: true,
    ...(subcategorySlug
      ? { subcategory: { slug: subcategorySlug } }
      : categorySlug
        ? { subcategory: { category: { slug: categorySlug } } }
        : {}),
    ...(hasVariantFilter ? { variants: { some: variantSome } } : {}),
  };

  const where: Prisma.ProductWhereInput = {
    ...baseWhere,
    ...(tsquery ? { title: { search: tsquery } } : {}),
  };

  // AI-3: semantic-blended ranking for relevance sort with a query.
  if (q && tsquery && sort === "relevance") {
    const semantic = await semanticProductScores(q);
    if (semantic.size > 0) {
      return rankBlended(q, tsquery, baseWhere, semantic, page, pageSize);
    }
    // No embeddings → fall through to keyword-only relevance below.
  }

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

/**
 * Combine keyword matches with embedding-similarity scores, then paginate the
 * ranked id list in app. A keyword title match is weighted above semantic
 * similarity so exact matches still lead.
 */
async function rankBlended(
  q: string,
  tsquery: string,
  baseWhere: Prisma.ProductWhereInput,
  semantic: Map<string, number>,
  page: number,
  pageSize: number,
): Promise<ListingResult> {
  // Keyword matches within the structured filters.
  const keywordRows = await db.product.findMany({
    where: { ...baseWhere, title: { search: tsquery } },
    select: { id: true },
    take: SEMANTIC_CANDIDATE_LIMIT,
  });
  const keywordIds = new Set(keywordRows.map((r) => r.id));

  // Semantic matches restricted to the structured filters.
  const semanticRows = await db.product.findMany({
    where: { ...baseWhere, id: { in: [...semantic.keys()] } },
    select: { id: true },
    take: SEMANTIC_CANDIDATE_LIMIT,
  });
  const allowedSemantic = new Set(semanticRows.map((r) => r.id));

  const candidateIds = new Set<string>([
    ...keywordIds,
    ...[...semantic.keys()].filter((id) => allowedSemantic.has(id)),
  ]);

  const ranked = [...candidateIds]
    .map((id) => ({ id, score: (keywordIds.has(id) ? 1 : 0) + (semantic.get(id) ?? 0) }))
    .sort((a, b) => b.score - a.score);

  const total = ranked.length;
  const pageIds = ranked.slice((page - 1) * pageSize, page * pageSize).map((r) => r.id);

  const cards = await db.product.findMany({
    where: { id: { in: pageIds } },
    select: productCardSelect,
  });
  const byId = new Map(cards.map((c) => [c.id, c]));
  const items = pageIds
    .map((id) => byId.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map(toProductCard);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
