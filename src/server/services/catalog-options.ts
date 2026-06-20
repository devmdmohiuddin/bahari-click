import { listCategoriesAdmin } from "@/server/services/category";

export type SubcategoryOption = { id: string; label: string; group: string };

/** Flat subcategory list grouped by parent category, for product editor selects. */
export async function getSubcategoryOptions(): Promise<SubcategoryOption[]> {
  const categories = await listCategoriesAdmin();
  return categories.flatMap((c) =>
    c.subcategories.map((s) => ({ id: s.id, label: s.name, group: c.name })),
  );
}
