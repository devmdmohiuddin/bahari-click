import { getSubcategoryOptions } from "@/server/services/catalog-options";
import { ProductForm } from "@/components/admin/products/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const subcategoryOptions = await getSubcategoryOptions();
  return <ProductForm subcategoryOptions={subcategoryOptions} />;
}
