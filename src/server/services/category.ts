import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { cacheTags, revalidateTags } from "@/lib/cache";
import { conflict, notFound } from "@/lib/errors";
import { uniqueSlug } from "@/lib/slug";
import {
  categoryInputSchema,
  subcategoryInputSchema,
  type CategoryInput,
  type SubcategoryInput,
} from "@/server/validators/catalog";

// Category → Subcategory services. Storefront reads are cached and tagged;
// mutations revalidate the `categories` tag.

/** Active category tree with active subcategories, ordered for display. Cached. */
export const listActiveTree = unstable_cache(
  async () =>
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    }),
  ["category-active-tree"],
  { tags: [cacheTags.categories] },
);

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      subcategories: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function getSubcategoryBySlug(slug: string) {
  return db.subcategory.findUnique({ where: { slug }, include: { category: true } });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createCategory(input: CategoryInput) {
  const data = categoryInputSchema.parse(input);
  const slug = await uniqueSlug(data.slug ?? data.name, async (s) =>
    Boolean(await db.category.findUnique({ where: { slug: s }, select: { id: true } })),
  );

  const category = await db.category.create({
    data: {
      name: data.name,
      slug,
      image: data.image ?? null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
  revalidateTags(cacheTags.categories);
  return category;
}

export async function createSubcategory(input: SubcategoryInput) {
  const data = subcategoryInputSchema.parse(input);

  const parent = await db.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });
  if (!parent) throw notFound("Category not found");

  const slug = await uniqueSlug(data.slug ?? data.name, async (s) =>
    Boolean(await db.subcategory.findUnique({ where: { slug: s }, select: { id: true } })),
  );

  const subcategory = await db.subcategory.create({
    data: {
      categoryId: data.categoryId,
      name: data.name,
      slug,
      image: data.image ?? null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
  revalidateTags(cacheTags.categories);
  return subcategory;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const existing = await db.category.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Category not found");

  const data = categoryInputSchema.partial().parse(input);
  if (data.slug) {
    const clash = await db.category.findFirst({
      where: { slug: data.slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) throw conflict("Slug already in use");
  }

  const category = await db.category.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      image: data.image,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
  revalidateTags(cacheTags.categories);
  return category;
}
