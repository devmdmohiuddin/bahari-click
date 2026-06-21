import type { Metadata } from "next";
import { Search as SearchIcon } from "lucide-react";

import { searchProducts } from "@/server/services/search";
import { searchSortSchema } from "@/server/validators/search";
import { listActiveTree } from "@/server/services/category";
import { getFilterFacets } from "@/server/services/catalog-options";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SortSelect } from "@/components/storefront/sort-select";
import { Pagination } from "@/components/storefront/pagination";
import { SearchFilters, type SubFilterOption } from "@/components/storefront/search-filters";
import { FilterDrawer } from "@/components/storefront/filter-drawer";

export const metadata: Metadata = {
  title: "Search",
  description: "Search products at Bahari Click.",
  // Search/filter result combinations shouldn't be indexed (canonical lives on
  // category/product pages).
  robots: { index: false },
};

const SEARCH_SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "best_selling", label: "Best selling" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

type SearchParams = {
  q?: string;
  sub?: string;
  color?: string;
  size?: string;
  min?: string;
  max?: string;
  instock?: string;
  sort?: string;
  page?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const sort = searchSortSchema.parse(sp.sort ?? undefined);
  const page = Math.max(1, Number(sp.page) || 1);

  const [result, tree, facets] = await Promise.all([
    searchProducts({
      q: q || undefined,
      subcategorySlug: sp.sub,
      color: sp.color,
      size: sp.size,
      minPrice: sp.min ? Number(sp.min) : undefined,
      maxPrice: sp.max ? Number(sp.max) : undefined,
      inStock: sp.instock === "true" ? true : undefined,
      sort,
      page,
    }),
    listActiveTree(),
    getFilterFacets(),
  ]);

  const subcategories: SubFilterOption[] = tree.flatMap((c) =>
    c.subcategories.map((s) => ({ slug: s.slug, name: s.name, group: c.name })),
  );

  // Preserve all active filters/sort across pagination links.
  const pageParams: Record<string, string | undefined> = {
    q: q || undefined,
    sub: sp.sub,
    color: sp.color,
    size: sp.size,
    min: sp.min,
    max: sp.max,
    instock: sp.instock,
    sort: sort !== "relevance" ? sort : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {q ? <>Results for “{q}”</> : "All products"}
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <SearchFilters subcategories={subcategories} facets={facets} />
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {result.total} {result.total === 1 ? "result" : "results"}
            </p>
            <div className="flex items-center gap-2">
              <FilterDrawer subcategories={subcategories} facets={facets} />
              <SortSelect value={sort} options={SEARCH_SORT_OPTIONS} />
            </div>
          </div>

          {result.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <SearchIcon className="text-muted-foreground/40 size-12" />
              <p className="text-muted-foreground">
                No products match{q ? ` “${q}”` : " your filters"}. Try different keywords or
                filters.
              </p>
            </div>
          ) : (
            <>
              <ProductGrid products={result.items} className="sm:grid-cols-2 xl:grid-cols-3" />
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                pathname="/search"
                params={pageParams}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
