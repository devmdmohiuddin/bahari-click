import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { ChevronRight } from "lucide-react";

import { cacheTags } from "@/lib/cache";
import { absoluteUrl } from "@/lib/site";
import { getSession } from "@/server/auth-session";
import { isWishlisted } from "@/server/services/wishlist";
import { getProductDetailBySlug } from "@/server/services/pdp";
import { ProductDetail, type PdpProduct } from "@/components/storefront/product-detail";
import { ProductInfoTabs } from "@/components/storefront/product-info-tabs";
import { RelatedProducts } from "@/components/storefront/related-products";
import { RecentlyViewed, RecordRecentlyViewed } from "@/components/storefront/recently-viewed";

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
  if (!detail) return { title: "Product not found" };

  const { product } = detail;
  const image = product.images[0]?.url ?? product.variants[0]?.images[0]?.url;
  // AI-5: prefer the admin-reviewed SEO meta; fall back to title/description.
  const title = product.seoTitle?.trim() || product.title;
  const description =
    product.seoDescription?.trim() ||
    product.description.replace(/<[^>]+>/g, "").slice(0, 160) ||
    product.title;
  const canonical = `/p/${product.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const { slug } = await params;
  const { review } = await searchParams;
  const detail = await loadProduct(slug);
  if (!detail) notFound();

  const { product, related, recommended, reviews, ratingBreakdown, reviewSummary } = detail;
  const { category } = product.subcategory;

  const session = await getSession();
  const wishlisted = session ? await isWishlisted(session.user.id, product.id) : false;

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

  // JSON-LD Product structured data for rich results (S6.2).
  const prices = pdp.variants.map((v) => v.price);
  const inStock = pdp.variants.some((v) => v.stock > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description.replace(/<[^>]+>/g, "").slice(0, 500) || product.title,
    image: pdp.gallery[0]?.url ?? pdp.variants[0]?.images[0]?.url,
    sku: product.id,
    category: category.name,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BDT",
      lowPrice: prices.length ? Math.min(...prices) : product.basePrice,
      highPrice: prices.length ? Math.max(...prices) : product.basePrice,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/p/${product.slug}`),
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

      <ProductDetail product={pdp} initialWishlisted={wishlisted} />

      <div className="mt-12">
        <ProductInfoTabs
          productId={product.id}
          description={product.description}
          specs={product.specs.map((s) => ({ id: s.id, key: s.key, value: s.value }))}
          reviews={reviews}
          breakdown={ratingBreakdown}
          reviewSummary={reviewSummary}
          openReview={review === "1"}
        />
      </div>

      {recommended.length > 0 && (
        <RelatedProducts products={recommended} title="You may also like" />
      )}
      <RelatedProducts products={related} title="More in this category" />
      <RecentlyViewed excludeId={product.id} />

      <RecordRecentlyViewed
        item={{
          id: product.id,
          slug: product.slug,
          title: product.title,
          image: pdp.gallery[0]?.url ?? pdp.variants[0]?.images[0]?.url ?? null,
          price: prices.length ? Math.min(...prices) : product.basePrice,
        }}
      />
    </div>
  );
}
