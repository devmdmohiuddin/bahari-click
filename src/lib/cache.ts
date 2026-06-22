import { revalidateTag } from "next/cache";

// Cache-tag helpers for catalog reads. Storefront reads are wrapped in
// unstable_cache with these tags; admin mutations call revalidateTags(...) so
// ISR/data-cache refreshes on demand (docs/03-architecture.md → Caching).

export const cacheTags = {
  categories: "categories",
  products: "products",
  product: (id: string) => `product:${id}`,
  productSlug: (slug: string) => `product:slug:${slug}`,
  shippingZones: "shipping-zones",
  campaigns: "campaigns",
} as const;

/**
 * Revalidate one or more tags, tolerating calls made outside a Next.js request
 * context (e.g. seed scripts / background jobs). Cache revalidation must never
 * break the DB mutation that triggered it.
 */
export function revalidateTags(...tags: string[]): void {
  for (const tag of tags) {
    try {
      // Next 16: the "max" cache profile expires the tag immediately (the old
      // single-arg behaviour, now explicit).
      revalidateTag(tag, "max");
    } catch {
      // No request store (script/job context) — safe to ignore.
    }
  }
}
