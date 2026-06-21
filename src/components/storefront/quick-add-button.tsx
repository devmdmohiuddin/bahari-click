"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { trackAddToCart } from "@/lib/analytics";
import { useCartStore, type CartItem } from "@/lib/cart-store";

// Single-variant quick add. Circular brand button with a brief spark/confirm
// micro-interaction (docs/07-brand-guidelines.md §6 — light, not gimmicky).
export function QuickAddButton({
  item,
  className,
}: {
  item: Omit<CartItem, "qty">;
  className?: string;
}) {
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    // Card is wrapped in a link — don't navigate when adding.
    e.preventDefault();
    e.stopPropagation();
    add(item, 1);
    trackAddToCart({ id: item.productId, name: item.name, price: item.price, quantity: 1 });
    toast.success("Added to cart", item.name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-label={`Add ${item.name} to cart`}
      className={cn(
        "bg-brand text-brand-foreground hover:bg-brand-hover focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-full shadow-md transition-all focus-visible:ring-3 focus-visible:outline-none active:scale-90",
        added && "scale-110",
        className,
      )}
    >
      {added ? <Check className="animate-in zoom-in size-4" /> : <Plus className="size-4" />}
    </button>
  );
}
