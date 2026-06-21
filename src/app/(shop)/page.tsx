import Link from "next/link";
import { ArrowRight, MousePointerClick } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft brand glow backdrop */}
      <div
        aria-hidden
        className="bg-brand/10 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl"
      />
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <span className="bg-brand-tint text-brand inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <MousePointerClick className="size-3.5" />
          Phase 0 · Foundation
        </span>

        <h1 className="font-heading max-w-2xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          Quality products, <span className="text-brand">delivered</span> across Bangladesh
        </h1>

        <p className="text-muted-foreground max-w-xl text-balance">
          Browse, click, and pay cash on delivery. The full storefront — catalog, product pages, and
          checkout — lands in the next phases. This is the deployable, on-brand skeleton.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/products">
              Shop all products
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/track">Track an order</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
