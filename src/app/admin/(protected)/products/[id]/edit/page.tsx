import { notFound } from "next/navigation";

import { getProductById } from "@/server/services/product";
import { getSubcategoryOptions } from "@/server/services/catalog-options";
import { ProductForm } from "@/components/admin/products/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, subcategoryOptions] = await Promise.all([
    getProductById(id),
    getSubcategoryOptions(),
  ]);

  if (!product) notFound();

  return <ProductForm subcategoryOptions={subcategoryOptions} product={product} />;
}
