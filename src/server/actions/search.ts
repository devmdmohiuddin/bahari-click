"use server";

import { ok, toResult, type Result } from "@/lib/result";
import type { ListingResult } from "@/server/services/listing";
import { clientIp, enforceRateLimit } from "@/server/services/rate-limit";
import { searchProducts } from "@/server/services/search";
import { searchQuerySchema, type SearchQuery } from "@/server/validators/search";

// Public product search for client-side use (search box, filter panel).
// Rate-limited to deter scraping.
export async function searchProductsAction(input: SearchQuery): Promise<Result<ListingResult>> {
  try {
    const query = searchQuerySchema.parse(input);
    await enforceRateLimit(`search:${await clientIp()}`, 120, 60 * 60);
    return ok(await searchProducts(query));
  } catch (error) {
    return toResult(error);
  }
}
