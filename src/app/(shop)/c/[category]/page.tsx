import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategoryBySlug } from "@/server/services/category";
import { ListingView } from "@/components/storefront/listing-view";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return { title: "Category not found" };
  return {
    title: cat.name,
    description: `Shop ${cat.name}. Cash on delivery across Bangladesh.`,
    alternates: { canonical: `/c/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { category } = await params;
  const sp = await searchParams;

  const cat = await getCategoryBySlug(category);
  if (!cat || !cat.isActive) notFound();

  return (
    <ListingView
      title={cat.name}
      categorySlug={cat.slug}
      basePath={`/c/${cat.slug}`}
      searchParams={sp}
      subNav={{
        categorySlug: cat.slug,
        items: cat.subcategories.map((s) => ({ name: s.name, slug: s.slug })),
      }}
    />
  );
}
