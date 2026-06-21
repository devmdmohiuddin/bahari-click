import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { cacheTags } from "@/lib/cache";
import { listCategoriesAdmin } from "@/server/services/category";

export type SubcategoryOption = { id: string; label: string; group: string };

/** Flat subcategory list grouped by parent category, for product editor selects. */
export async function getSubcategoryOptions(): Promise<SubcategoryOption[]> {
  const categories = await listCategoriesAdmin();
  return categories.flatMap((c) =>
    c.subcategories.map((s) => ({ id: s.id, label: s.name, group: c.name })),
  );
}

export type FilterFacets = {
  colors: string[];
  sizes: string[];
  priceMin: number;
  priceMax: number;
};

/** Distinct color/size options + price range across published products, for the
 *  storefront filter panel. Cached + tagged so admin catalog edits refresh it. */
export const getFilterFacets = unstable_cache(
  async (): Promise<FilterFacets> => {
    const variantWhere = { isActive: true, product: { isPublished: true } } as const;
    const [colorRows, sizeRows, priceAgg] = await Promise.all([
      db.variant.findMany({
        where: { ...variantWhere, color: { not: null } },
        distinct: ["color"],
        select: { color: true },
        orderBy: { color: "asc" },
      }),
      db.variant.findMany({
        where: { ...variantWhere, size: { not: null } },
        distinct: ["size"],
        select: { size: true },
        orderBy: { size: "asc" },
      }),
      db.product.aggregate({
        where: { isPublished: true },
        _min: { basePrice: true },
        _max: { basePrice: true },
      }),
    ]);

    return {
      colors: colorRows.map((r) => r.color!).filter(Boolean),
      sizes: sizeRows.map((r) => r.size!).filter(Boolean),
      priceMin: priceAgg._min.basePrice ?? 0,
      priceMax: priceAgg._max.basePrice ?? 0,
    };
  },
  ["filter-facets"],
  { tags: [cacheTags.products] },
);
