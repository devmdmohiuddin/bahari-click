import Link from "next/link";

import { cn } from "@/lib/utils";
import { formatBdt } from "@/lib/format";
import type { ProductCard as ProductCardData } from "@/server/services/listing";
import { ProductImage } from "@/components/storefront/product-image";
import { StarRating } from "@/components/storefront/star-rating";
import { QuickAddButton } from "@/components/storefront/quick-add-button";

export function ProductCard({
  product,
  priority,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  className?: string;
}) {
  const { quickAdd, compareAtPrice, priceFrom, inStock } = product;
  const onSale = compareAtPrice != null && compareAtPrice > priceFrom;
  const discountPct = onSale ? Math.round((1 - priceFrom / compareAtPrice) * 100) : 0;
  const multiVariant = quickAdd == null;

  return (
    <div className={cn("group relative flex flex-col", className)}>
      <Link
        href={`/p/${product.slug}`}
        className="bg-muted relative block aspect-square overflow-hidden rounded-xl"
      >
        <ProductImage
          src={product.image?.url ?? null}
          alt={product.image?.alt ?? product.title}
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5">
          {onSale && (
            <span className="bg-destructive text-brand-foreground rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm">
              -{discountPct}%
            </span>
          )}
          {product.soldCountDisplay > 0 && (
            <span className="bg-brand/95 text-brand-foreground rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur">
              {product.soldCountDisplay.toLocaleString("en-BD")} sold
            </span>
          )}
        </div>

        {!inStock && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
            <span className="bg-foreground/80 text-background rounded-full px-3 py-1 text-xs font-semibold">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      {/* Quick add for single-variant, in-stock products */}
      {inStock && quickAdd && quickAdd.stock > 0 && (
        <QuickAddButton
          className="absolute top-[calc(100%-3rem)] right-2 -translate-y-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
          item={{
            variantId: quickAdd.variantId,
            productId: product.id,
            slug: product.slug,
            name: product.title,
            variantLabel: "",
            price: quickAdd.price,
            image: product.image?.url ?? null,
          }}
        />
      )}

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <Link href={`/p/${product.slug}`} className="hover:text-brand transition-colors">
          <h3 className="line-clamp-2 text-sm leading-snug font-medium">{product.title}</h3>
        </Link>

        {product.ratingCount > 0 && (
          <StarRating value={product.ratingAvg} count={product.ratingCount} />
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-heading text-base font-bold">
            {multiVariant && (
              <span className="text-muted-foreground text-xs font-normal">From </span>
            )}
            {formatBdt(priceFrom)}
          </span>
          {onSale && (
            <span className="text-muted-foreground text-sm line-through">
              {formatBdt(compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
