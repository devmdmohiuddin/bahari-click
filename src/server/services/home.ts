import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { cacheTags } from "@/lib/cache";
import { productCardSelect, toProductCard, type ProductCard } from "@/server/services/listing";

// Home-page reads. Cached + tagged so admin catalog edits revalidate on demand.

const FEATURED_LIMIT = 8;

/**
 * Products for the home grid: flagged-featured first, topped up with the
 * best-selling published products so the section is never empty even before any
 * product is marked featured.
 */
export const getFeaturedProducts = unstable_cache(
  async (): Promise<ProductCard[]> => {
    const featured = await db.product.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: [{ soldCountReal: "desc" }, { createdAt: "desc" }],
      take: FEATURED_LIMIT,
      select: productCardSelect,
    });

    if (featured.length >= FEATURED_LIMIT) return featured.map(toProductCard);

    const fillers = await db.product.findMany({
      where: {
        isPublished: true,
        NOT: { id: { in: featured.map((p) => p.id) } },
      },
      orderBy: [{ soldCountReal: "desc" }, { createdAt: "desc" }],
      take: FEATURED_LIMIT - featured.length,
      select: productCardSelect,
    });

    return [...featured, ...fillers].map(toProductCard);
  },
  ["home-featured-products"],
  { tags: [cacheTags.products] },
);
