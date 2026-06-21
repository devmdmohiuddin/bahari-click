import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listActiveTree } from "@/server/services/category";
import { getFeaturedProducts } from "@/server/services/home";
import { CategoryTiles } from "@/components/storefront/category-tiles";
import { ProductGrid } from "@/components/storefront/product-grid";

// ISR — catalog reads are cached + tag-revalidated on admin edits; this caps
// staleness for anything not covered by a tag.
export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured] = await Promise.all([listActiveTree(), getFeaturedProducts()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Hero / banner slot */}
      <section className="from-brand to-brand-hover relative overflow-hidden rounded-3xl bg-linear-to-br px-6 py-12 text-white sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="size-3.5" />
            Cash on delivery · Nationwide
          </span>
          <h1 className="font-heading mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            Quality products, delivered to your door
          </h1>
          <p className="mt-3 max-w-md text-white/90">
            Browse the collection, click to order, and pay cash when it arrives. Simple, all across
            Bangladesh.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link href="/products">
              Shop all products
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Shop by category</h2>
          </div>
          <CategoryTiles categories={categories} />
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Popular picks</h2>
            <Link
              href="/products"
              className="text-brand hover:text-brand-hover inline-flex items-center gap-1 text-sm font-medium"
            >
              View all
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}
    </div>
  );
}
