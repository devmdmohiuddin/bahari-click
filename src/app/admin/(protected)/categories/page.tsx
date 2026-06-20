import { listCategoriesAdmin } from "@/server/services/category";
import { CategoriesManager } from "@/components/admin/categories/categories-manager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategoriesAdmin();
  return <CategoriesManager categories={categories} />;
}
