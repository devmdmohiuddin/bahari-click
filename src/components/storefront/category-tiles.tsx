import Link from "next/link";
import { Tag } from "lucide-react";

import { ProductImage } from "@/components/storefront/product-image";

type CategoryTile = { id: string; name: string; slug: string; image: string | null };

export function CategoryTiles({ categories }: { categories: CategoryTile[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {categories.map((c) => (
        <Link key={c.id} href={`/c/${c.slug}`} className="group flex flex-col items-center gap-2">
          <div className="bg-brand-tint relative aspect-square w-full overflow-hidden rounded-2xl">
            {c.image ? (
              <ProductImage
                src={c.image}
                alt={c.name}
                sizes="(max-width: 640px) 33vw, 16vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="text-brand flex h-full items-center justify-center">
                <Tag className="size-7" />
              </div>
            )}
          </div>
          <span className="group-hover:text-brand line-clamp-1 text-center text-xs font-medium transition-colors sm:text-sm">
            {c.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
