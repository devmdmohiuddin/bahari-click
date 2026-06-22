import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Sparkles, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listActiveTree } from "@/server/services/category";
import { getFeaturedProducts } from "@/server/services/home";
import { CategoryTiles } from "@/components/storefront/category-tiles";
import { ProductGrid } from "@/components/storefront/product-grid";

// ISR — catalog reads are cached + tag-revalidated on admin edits; this caps
// staleness for anything not covered by a tag.
export const revalidate = 300;

const HERO_STATS = [
  { icon: Banknote, label: "Cash on delivery" },
  { icon: Truck, label: "Nationwide shipping" },
  { icon: BadgeCheck, label: "7-day easy returns" },
];

export default async function HomePage() {
  const [categories, featured] = await Promise.all([listActiveTree(), getFeaturedProducts()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Hero / banner slot */}
      <section className="from-brand via-brand to-brand-hover relative overflow-hidden rounded-3xl bg-linear-to-br px-6 py-14 text-white shadow-lg sm:px-12 sm:py-20">
        {/* Decorative dot grid + glow blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,white_1.2px,transparent_1.2px)] [background-size:22px_22px] opacity-[0.12]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25 backdrop-blur">
            <Sparkles className="size-3.5" />
            Shop smart · Pay on delivery
          </span>
          <h1 className="font-heading mt-5 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Quality products, <br className="hidden sm:block" />
            delivered to your door
          </h1>
          <p className="mt-4 max-w-md text-base text-white/90 sm:text-lg">
            Browse the collection, click to order, and pay cash when it arrives — anywhere in
            Bangladesh.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="shadow-md">
              <Link href="/products">
                Shop all products
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/track">Track an order</Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {HERO_STATS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-sm font-medium text-white/90"
              >
                <Icon className="size-4" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mt-14">
          <div className="mb-6">
            <h2 className="heading-accent text-xl sm:text-2xl">Shop by category</h2>
          </div>
          <CategoryTiles categories={categories} />
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="heading-accent text-xl sm:text-2xl">Popular picks</h2>
            <Link
              href="/products"
              className="text-brand hover:text-brand-hover inline-flex shrink-0 items-center gap-1 text-sm font-semibold"
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
