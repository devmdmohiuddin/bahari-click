"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBdt } from "@/lib/format";
import { useCartStore } from "@/lib/cart-store";
import { trackAddToCart, trackViewContent } from "@/lib/analytics";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/storefront/star-rating";
import { ProductGallery, type GalleryImage } from "@/components/storefront/product-gallery";
import { NotifyMeForm } from "@/components/storefront/notify-me-form";

export type PdpVariant = {
  id: string;
  color: string | null;
  size: string | null;
  price: number; // effective whole-BDT price
  stock: number;
  images: GalleryImage[];
};

export type PdpProduct = {
  id: string;
  slug: string;
  title: string;
  compareAtPrice: number | null;
  soldCountDisplay: number;
  ratingAvg: number;
  ratingCount: number;
  gallery: GalleryImage[];
  variants: PdpVariant[];
};

function uniqueOrdered(values: (string | null)[]): string[] {
  const out: string[] = [];
  for (const v of values) if (v && !out.includes(v)) out.push(v);
  return out;
}

export function ProductDetail({ product }: { product: PdpProduct }) {
  const { variants } = product;
  const colors = useMemo(() => uniqueOrdered(variants.map((v) => v.color)), [variants]);
  const sizes = useMemo(() => uniqueOrdered(variants.map((v) => v.size)), [variants]);
  const hasColor = colors.length > 0;
  const hasSize = sizes.length > 0;

  const first = variants[0];
  const [color, setColor] = useState<string | null>(first?.color ?? null);
  const [size, setSize] = useState<string | null>(first?.size ?? null);
  const [qty, setQty] = useState(1);

  const add = useCartStore((s) => s.add);

  // Fire ViewContent once per product view (S5.2).
  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    trackViewContent({ id: product.id, name: product.title, price: first?.price ?? 0 });
  }, [product.id, product.title, first]);

  const selected = useMemo(
    () =>
      variants.find((v) => (!hasColor || v.color === color) && (!hasSize || v.size === size)) ??
      null,
    [variants, color, size, hasColor, hasSize],
  );

  const colorAvailable = (c: string) =>
    variants.some((v) => v.color === c && (!hasSize || v.size === size));
  const sizeAvailable = (s: string) =>
    variants.some((v) => v.size === s && (!hasColor || v.color === color));

  function pickColor(c: string) {
    setColor(c);
    // Keep size valid for the new color; otherwise jump to its first in-stock size.
    if (hasSize && !variants.some((v) => v.color === c && v.size === size)) {
      const next = variants.find((v) => v.color === c);
      setSize(next?.size ?? null);
    }
    setQty(1);
  }

  function pickSize(s: string) {
    setSize(s);
    setQty(1);
  }

  const price = selected?.price ?? first?.price ?? 0;
  const onSale = product.compareAtPrice != null && product.compareAtPrice > price;
  const stock = selected?.stock ?? 0;
  const inStock = stock > 0;
  const variantLabel = [selected?.color, selected?.size].filter(Boolean).join(" · ");

  const galleryImages = useMemo(() => {
    const imgs = selected && selected.images.length > 0 ? selected.images : product.gallery;
    return imgs.length > 0 ? imgs : product.gallery;
  }, [selected, product.gallery]);

  function handleAdd() {
    if (!selected || !inStock) return;
    add(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.title,
        variantLabel,
        price,
        image: galleryImages[0]?.url ?? null,
      },
      qty,
    );
    trackAddToCart({ id: product.id, name: product.title, price, quantity: qty });
    toast.success("Added to cart", `${product.title}${variantLabel ? ` · ${variantLabel}` : ""}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ProductGallery images={galleryImages} title={product.title} />

      <div className="flex flex-col">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {product.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {product.ratingCount > 0 && (
            <StarRating value={product.ratingAvg} count={product.ratingCount} size="md" />
          )}
          {product.soldCountDisplay > 0 && (
            <span className="text-muted-foreground text-sm">
              {product.soldCountDisplay.toLocaleString("en-BD")} sold
            </span>
          )}
        </div>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-heading text-3xl font-extrabold">{formatBdt(price)}</span>
          {onSale && (
            <>
              <span className="text-muted-foreground text-lg line-through">
                {formatBdt(product.compareAtPrice!)}
              </span>
              <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-bold">
                Save {formatBdt(product.compareAtPrice! - price)}
              </span>
            </>
          )}
        </div>

        {/* Color selector */}
        {hasColor && (
          <div className="mt-6">
            <p className="text-sm font-medium">
              Color: <span className="text-muted-foreground font-normal">{color}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((c) => {
                const available = colorAvailable(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => pickColor(c)}
                    disabled={!available}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      c === color
                        ? "border-brand bg-brand-tint text-brand"
                        : "hover:border-foreground/30",
                      !available && "cursor-not-allowed line-through opacity-40",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size selector */}
        {hasSize && (
          <div className="mt-5">
            <p className="text-sm font-medium">
              Size: <span className="text-muted-foreground font-normal">{size}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => {
                const available = sizeAvailable(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => pickSize(s)}
                    disabled={!available}
                    className={cn(
                      "min-w-12 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      s === size
                        ? "border-brand bg-brand-tint text-brand"
                        : "hover:border-foreground/30",
                      !available && "cursor-not-allowed line-through opacity-40",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stock status */}
        <p className="mt-5 text-sm">
          {inStock ? (
            stock <= 5 ? (
              <span className="text-warning font-medium">Only {stock} left in stock</span>
            ) : (
              <span className="text-success font-medium">In stock</span>
            )
          ) : (
            <span className="text-destructive font-medium">Out of stock</span>
          )}
        </p>

        {/* In stock → quantity + add to cart. Out of stock → notify-me (S3.1). */}
        {inStock ? (
          <div className="mt-5 flex items-stretch gap-3">
            <div className="flex items-center rounded-full border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                className="hover:text-brand flex size-11 items-center justify-center disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(stock || 1, q + 1))}
                disabled={qty >= stock}
                aria-label="Increase quantity"
                className="hover:text-brand flex size-11 items-center justify-center disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button size="lg" onClick={handleAdd} disabled={!selected} className="h-11 flex-1">
              <ShoppingBag />
              Add to cart
            </Button>
          </div>
        ) : (
          <div className="mt-5">
            <NotifyMeForm
              key={selected?.id ?? "none"}
              productId={product.id}
              variantId={selected?.id ?? null}
              variantLabel={variantLabel}
            />
          </div>
        )}

        {/* Trust row */}
        <div className="text-muted-foreground mt-6 flex flex-col gap-2 border-t pt-6 text-sm">
          <span className="flex items-center gap-2">
            <Truck className="text-brand size-4" /> Cash on delivery across Bangladesh
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="text-brand size-4" /> Easy returns within 7 days
          </span>
        </div>
      </div>
    </div>
  );
}
