import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategoryBySlug, getSubcategoryBySlug } from "@/server/services/category";
import { ListingView } from "@/components/storefront/listing-view";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}): Promise<Metadata> {
  const { category, subcategory } = await params;
  const sub = await getSubcategoryBySlug(subcategory);
  if (!sub) return { title: "Not found" };
  return {
    title: sub.name,
    description: `Shop ${sub.name}. Cash on delivery across Bangladesh.`,
    alternates: { canonical: `/c/${category}/${sub.slug}` },
  };
}

export default async function SubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; subcategory: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { category, subcategory } = await params;
  const sp = await searchParams;

  const [sub, cat] = await Promise.all([
    getSubcategoryBySlug(subcategory),
    getCategoryBySlug(category),
  ]);
  if (!sub || !sub.isActive || !cat || sub.category.slug !== category) notFound();

  return (
    <ListingView
      title={sub.name}
      subcategorySlug={sub.slug}
      basePath={`/c/${category}/${sub.slug}`}
      searchParams={sp}
      subNav={{
        categorySlug: cat.slug,
        items: cat.subcategories.map((s) => ({ name: s.name, slug: s.slug })),
        activeSlug: sub.slug,
      }}
    />
  );
}
