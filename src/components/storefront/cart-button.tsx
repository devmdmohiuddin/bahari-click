"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCartCount, useCartStore } from "@/lib/cart-store";

// Cart icon with live item-count badge (Zustand). Badge only renders after
// hydration to avoid an SSR/client count mismatch.
export function CartButton({ className }: { className?: string }) {
  const count = useCartCount();
  const hydrated = useCartStore((s) => s.hydrated);
  const show = hydrated && count > 0;

  return (
    <Link
      href="/cart"
      aria-label={show ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
      className={cn(
        "hover:bg-muted relative flex size-10 items-center justify-center rounded-full transition-colors",
        className,
      )}
    >
      <ShoppingBag className="size-[22px]" />
      {show && (
        <span className="bg-brand text-brand-foreground animate-in zoom-in absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-5 font-bold tabular-nums shadow-sm">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
