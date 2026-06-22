"use client";

import { useEffect } from "react";
import Link from "next/link";

import { formatBdt } from "@/lib/format";
import { useRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";
import { ProductImage } from "@/components/storefront/product-image";

// Records the current product into the recently-viewed store (PDP mounts this).
export function RecordRecentlyViewed({ item }: { item: RecentItem }) {
  const record = useRecentlyViewed((s) => s.record);
  useEffect(() => {
    record(item);
  }, [item, record]);
  return null;
}

// Horizontal strip of recently-viewed products, excluding the given id.
export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const hydrated = useRecentlyViewed((s) => s.hydrated);
  const items = useRecentlyViewed((s) => s.items);

  const shown = items.filter((i) => i.id !== excludeId);
  if (!hydrated || shown.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="heading-accent mb-6 text-xl sm:text-2xl">Recently viewed</h2>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {shown.map((p) => (
          <Link
            key={p.id}
            href={`/p/${p.slug}`}
            className="group card-lift bg-card w-36 shrink-0 overflow-hidden rounded-2xl border shadow-sm sm:w-44"
          >
            <div className="bg-muted relative aspect-square overflow-hidden">
              <ProductImage
                src={p.image}
                alt={p.title}
                sizes="176px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-medium">{p.title}</h3>
              <p className="font-heading text-brand mt-1 text-sm font-extrabold">
                {formatBdt(p.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
