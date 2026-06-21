import Link from "next/link";
import { PackageOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { listProducts } from "@/server/services/listing";
import { productSortSchema } from "@/server/validators/catalog";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SortSelect } from "@/components/storefront/sort-select";
import { Pagination } from "@/components/storefront/pagination";

type SubNavItem = { name: string; slug: string };

export async function ListingView({
  title,
  categorySlug,
  subcategorySlug,
  basePath,
  searchParams,
  subNav,
}: {
  title: string;
  categorySlug?: string;
  subcategorySlug?: string;
  basePath: string;
  searchParams: { sort?: string; page?: string };
  /** Subcategory pills for a category page. */
  subNav?: { categorySlug: string; items: SubNavItem[]; activeSlug?: string };
}) {
  const sort = productSortSchema.parse(searchParams.sort ?? undefined);
  const page = Math.max(1, Number(searchParams.page) || 1);

  const result = await listProducts({ categorySlug, subcategorySlug, sort, page });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>

      {subNav && subNav.items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <SubPill href={`/c/${subNav.categorySlug}`} active={!subNav.activeSlug}>
            All
          </SubPill>
          {subNav.items.map((s) => (
            <SubPill
              key={s.slug}
              href={`/c/${subNav.categorySlug}/${s.slug}`}
              active={subNav.activeSlug === s.slug}
            >
              {s.name}
            </SubPill>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {result.total} {result.total === 1 ? "product" : "products"}
        </p>
        <SortSelect value={sort} />
      </div>

      {result.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <PackageOpen className="text-muted-foreground/40 size-12" />
          <p className="text-muted-foreground">No products here yet.</p>
          <Link href="/products" className="text-brand text-sm font-medium hover:underline">
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <ProductGrid products={result.items} />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={basePath}
            sort={sort}
          />
        </div>
      )}
    </div>
  );
}

function SubPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-brand text-brand-foreground border-brand" : "hover:bg-muted text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
