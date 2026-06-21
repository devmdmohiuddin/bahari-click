import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { ChevronRight } from "lucide-react";

import { cacheTags } from "@/lib/cache";
import { getProductDetailBySlug } from "@/server/services/pdp";
import { ProductDetail, type PdpProduct } from "@/components/storefront/product-detail";
import { ProductInfoTabs } from "@/components/storefront/product-info-tabs";
import { RelatedProducts } from "@/components/storefront/related-products";

// Cache the PDP read tagged by product slug so admin edits / review approvals
// (which call revalidateTags(productSlug)) refresh this page on demand.
function loadProduct(slug: string) {
  return unstable_cache(() => getProductDetailBySlug(slug), ["pdp", slug], {
    tags: [cacheTags.productSlug(slug), cacheTags.products],
  })();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await loadProduct(slug);
  if (!detail) return { title: "Product not found · Bahari Click" };

  const { product } = detail;
  const image = product.images[0]?.url ?? product.variants[0]?.images[0]?.url;
  return {
    title: `${product.title} · Bahari Click`,
    description: product.description.replace(/<[^>]+>/g, "").slice(0, 160) || product.title,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await loadProduct(slug);
  if (!detail) notFound();

  const { product, related, reviews, ratingBreakdown } = detail;
  const { category } = product.subcategory;

  const pdp: PdpProduct = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    compareAtPrice: product.compareAtPrice,
    soldCountDisplay: product.soldCountDisplay,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    gallery: product.images.map((im) => ({ url: im.url, alt: im.alt })),
    variants: product.variants.map((v) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      price: v.price ?? product.basePrice,
      stock: v.stock,
      images: v.images.map((im) => ({ url: im.url, alt: im.alt })),
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-muted-foreground mb-6 flex flex-wrap items-center gap-1 text-sm">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/c/${category.slug}`} className="hover:text-brand">
          {category.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/c/${category.slug}/${product.subcategory.slug}`} className="hover:text-brand">
          {product.subcategory.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground line-clamp-1 font-medium">{product.title}</span>
      </nav>

      <ProductDetail product={pdp} />

      <div className="mt-12">
        <ProductInfoTabs
          productId={product.id}
          description={product.description}
          specs={product.specs.map((s) => ({ id: s.id, key: s.key, value: s.value }))}
          reviews={reviews}
          breakdown={ratingBreakdown}
        />
      </div>

      <RelatedProducts products={related} />
    </div>
  );
}
