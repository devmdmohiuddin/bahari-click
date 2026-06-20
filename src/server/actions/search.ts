"use server";

import { RATE_LIMITS } from "@/lib/rate-limits";
import { ok, toResult, type Result } from "@/lib/result";
import type { ListingResult } from "@/server/services/listing";
import { clientIp, enforcePolicy } from "@/server/services/rate-limit";
import { searchProducts } from "@/server/services/search";
import { searchQuerySchema, type SearchQuery } from "@/server/validators/search";

// Public product search for client-side use (search box, filter panel).
// Rate-limited to deter scraping.
export async function searchProductsAction(input: SearchQuery): Promise<Result<ListingResult>> {
  try {
    const query = searchQuerySchema.parse(input);
    await enforcePolicy(`search:${await clientIp()}`, RATE_LIMITS.search);
    return ok(await searchProducts(query));
  } catch (error) {
    return toResult(error);
  }
}
