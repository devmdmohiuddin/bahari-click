import { z } from "zod";

// Storefront search + filter query. All fields optional; combine freely with
// sort + pagination.

export const searchSortSchema = z
  .enum(["relevance", "newest", "price_asc", "price_desc", "best_selling"])
  .default("relevance");
export type SearchSort = z.infer<typeof searchSortSchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categorySlug: z.string().trim().optional(),
  subcategorySlug: z.string().trim().optional(),
  color: z.string().trim().max(60).optional(),
  size: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
  sort: searchSortSchema,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type SearchQuery = z.input<typeof searchQuerySchema>;
