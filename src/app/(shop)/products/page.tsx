import type { Metadata } from "next";

import { ListingView } from "@/components/storefront/listing-view";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All products · Bahari Click",
  description: "Browse all products. Cash on delivery across Bangladesh.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  return <ListingView title="All products" basePath="/products" searchParams={sp} />;
}
