import { z } from "zod";

// Shared catalog validators. Money is whole BDT (Int). See docs/04-data-model.md.

const taka = z.number().int().nonnegative();

// ── Category / Subcategory ───────────────────────────────────────────────────

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z.string().trim().min(1).max(120).optional(),
  image: z.string().trim().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.input<typeof categoryInputSchema>;

export const subcategoryInputSchema = categoryInputSchema.extend({
  categoryId: z.string().min(1, "Category is required"),
});
export type SubcategoryInput = z.input<typeof subcategoryInputSchema>;

// ── Product (with nested variants / images / specs) ──────────────────────────

const imageInputSchema = z.object({
  url: z.string().trim().min(1),
  alt: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const variantInputSchema = z.object({
  sku: z.string().trim().min(1).max(64).optional(),
  color: z.string().trim().max(60).optional().nullable(),
  size: z.string().trim().max(60).optional().nullable(),
  price: taka.optional().nullable(), // null → use Product.basePrice
  stock: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  images: z.array(imageInputSchema).default([]),
});

const specInputSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(400),
  sortOrder: z.number().int().default(0),
});

export const productCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().max(120).optional(),
  subcategoryId: z.string().min(1, "Subcategory is required"),
  description: z.string().default(""),
  basePrice: taka,
  compareAtPrice: taka.optional().nullable(),
  // AI-5 SEO meta (optional; blank → falls back to title/description on the PDP).
  seoTitle: z.string().trim().max(70).optional().nullable(),
  seoDescription: z.string().trim().max(180).optional().nullable(),
  isFeatured: z.boolean().default(false),
  soldCountBoost: z.number().int().nonnegative().default(0),
  variants: z.array(variantInputSchema).min(1, "At least one variant is required"),
  images: z.array(imageInputSchema).default([]),
  specs: z.array(specInputSchema).default([]),
});
export type ProductCreateInput = z.input<typeof productCreateSchema>;

// Update: same shape, all top-level fields optional except none required here;
// nested collections, when provided, replace the existing set.
export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.string().min(1),
});
export type ProductUpdateInput = z.input<typeof productUpdateSchema>;

// ── Listing query ────────────────────────────────────────────────────────────

export const productSortSchema = z
  .enum(["newest", "price_asc", "price_desc", "best_selling"])
  .default("newest");
export type ProductSort = z.infer<typeof productSortSchema>;

export const listingQuerySchema = z.object({
  categorySlug: z.string().trim().optional(),
  subcategorySlug: z.string().trim().optional(),
  sort: productSortSchema,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type ListingQuery = z.input<typeof listingQuerySchema>;
