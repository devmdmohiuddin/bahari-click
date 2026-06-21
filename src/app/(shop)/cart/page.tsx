"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { formatBdt } from "@/lib/format";
import { useCartStore, useCartSubtotal } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/storefront/product-image";

export default function CartPage() {
  const hydrated = useCartStore((s) => s.hydrated);
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const subtotal = useCartSubtotal();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
        <span className="bg-brand-tint text-brand flex size-16 items-center justify-center rounded-2xl">
          <ShoppingBag className="size-8" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Your cart is empty</h1>
          <p className="text-muted-foreground">Browse the collection and add something you love.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/products">
            Start shopping
            <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your cart</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* Line items */}
        <ul className="divide-y rounded-2xl border">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-4 p-4">
              <Link
                href={`/p/${item.slug}`}
                className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-xl sm:size-24"
              >
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  sizes="96px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/p/${item.slug}`}
                      className="hover:text-brand line-clamp-2 text-sm font-medium transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel && (
                      <p className="text-muted-foreground mt-0.5 text-xs">{item.variantLabel}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.variantId)}
                    aria-label={`Remove ${item.name}`}
                    className="text-muted-foreground hover:text-destructive h-fit transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border">
                    <button
                      type="button"
                      onClick={() => setQty(item.variantId, item.qty - 1)}
                      aria-label="Decrease quantity"
                      className="hover:text-brand flex size-9 items-center justify-center"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(item.variantId, Math.min(99, item.qty + 1))}
                      aria-label="Increase quantity"
                      className="hover:text-brand flex size-9 items-center justify-center"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-heading text-sm font-bold">
                    {formatBdt(item.price * item.qty)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <div className="h-fit rounded-2xl border p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatBdt(subtotal)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Shipping & discounts are calculated at checkout.
          </p>
          <Button asChild size="lg" className="mt-5 w-full">
            <Link href="/checkout">
              Proceed to checkout
              <ArrowRight />
            </Link>
          </Button>
          <Link
            href="/products"
            className="text-muted-foreground hover:text-brand mt-3 block text-center text-sm"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
