import Link from "next/link";
import { Tag } from "lucide-react";

import { ProductImage } from "@/components/storefront/product-image";

type CategoryTile = { id: string; name: string; slug: string; image: string | null };

export function CategoryTiles({ categories }: { categories: CategoryTile[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/c/${c.slug}`}
          className="group card-lift relative block aspect-4/5 overflow-hidden rounded-2xl border shadow-sm sm:aspect-square"
        >
          {c.image ? (
            <ProductImage
              src={c.image}
              alt={c.name}
              sizes="(max-width: 640px) 50vw, 16vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="from-brand to-brand-hover flex h-full items-center justify-center bg-linear-to-br text-white">
              <Tag className="size-8 opacity-80" />
            </div>
          )}
          {/* Readability gradient + label overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/20 to-transparent p-3 pt-8">
            <span className="line-clamp-1 text-sm font-semibold text-white drop-shadow-sm">
              {c.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
