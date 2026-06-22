"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { toggleWishlistAction } from "@/server/actions/account";

// Heart toggle backed by the customer wishlist. Sends guests to sign in.
export function WishlistButton({
  productId,
  initialWishlisted = false,
  className,
}: {
  productId: string;
  initialWishlisted?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await toggleWishlistAction(productId);
      if (res.ok) {
        setWishlisted(res.data.wishlisted);
        toast.success(res.data.wishlisted ? "Saved to wishlist" : "Removed from wishlist");
      } else if (res.error.code === "UNAUTHORIZED") {
        toast.info("Sign in to save items");
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else {
        toast.error("Couldn’t update wishlist", res.error.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
        wishlisted
          ? "border-brand bg-brand-tint text-brand"
          : "hover:border-foreground/30 hover:text-brand",
        className,
      )}
    >
      <Heart className={cn("size-5", wishlisted && "fill-current")} />
    </button>
  );
}
