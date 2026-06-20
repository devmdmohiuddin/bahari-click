import { listProductsAdmin } from "@/server/services/product";
import { ProductsTable } from "@/components/admin/products/products-table";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listProductsAdmin();
  return <ProductsTable products={products} />;
}
