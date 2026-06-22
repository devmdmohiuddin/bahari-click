import Link from "next/link";
import { Heart } from "lucide-react";

import { getSession } from "@/server/auth-session";
import { listWishlist } from "@/server/services/wishlist";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/product-grid";

export default async function WishlistPage() {
  const session = await getSession();
  const items = session ? await listWishlist(session.user.id) : [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border py-16 text-center">
        <Heart className="text-muted-foreground/40 size-12" />
        <p className="text-muted-foreground">Your wishlist is empty.</p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return <ProductGrid products={items} className="grid-cols-2 sm:grid-cols-3" />;
}
