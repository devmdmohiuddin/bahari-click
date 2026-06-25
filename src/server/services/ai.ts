import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { cacheTags, revalidateTags } from "@/lib/cache";
import { notFound } from "@/lib/errors";
import { ai, type GeneratedProductContent, type ReviewSummary } from "@/server/integrations/ai";
import { productCardSelect, toProductCard, type ProductCard } from "@/server/services/listing";
import {
  generateProductContentSchema,
  type GenerateProductContentInput,
} from "@/server/validators/ai";

// Glue between the AI adapter and our data. Two one-shot+cached features
// (docs/08-ai-features.md): AI-1 product content (returned to the admin editor)
// and AI-2 review summary (stored on the product, shown on the PDP).

/** Only summarize once there is a meaningful number of approved reviews. */
const MIN_REVIEWS_FOR_SUMMARY = 3;
/** Cap how many reviews we feed the model — keeps the prompt small/cheap. */
const MAX_REVIEWS_IN_PROMPT = 60;

// ── AI-1: product content generation ─────────────────────────────────────────

/** Generate clean copy for the admin editor. Human-in-the-loop: not persisted. */
export async function generateProductContent(
  input: GenerateProductContentInput,
): Promise<GeneratedProductContent> {
  const data = generateProductContentSchema.parse(input);
  return ai.generateProductContent(data);
}

// ── AI-2: review summary ─────────────────────────────────────────────────────

/**
 * Regenerate and cache a product's review summary from its approved reviews.
 * Returns the stored summary, or null when there aren't enough reviews yet.
 */
export async function regenerateReviewSummary(productId: string): Promise<ReviewSummary | null> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) throw notFound("Product not found");

  const reviews = await db.review.findMany({
    where: { productId, isApproved: true, comment: { not: null } },
    orderBy: { createdAt: "desc" },
    take: MAX_REVIEWS_IN_PROMPT,
    select: { rating: true, comment: true },
  });

  if (reviews.length < MIN_REVIEWS_FOR_SUMMARY) {
    // Clear any stale summary so the PDP falls back to the plain review list.
    await db.product.update({
      where: { id: productId },
      data: { reviewSummary: undefined, reviewSummaryAt: null },
    });
    revalidateProduct(productId, product.slug);
    return null;
  }

  const summary = await ai.summarizeReviews(
    reviews.map((r) => ({ rating: r.rating, comment: r.comment ?? "" })),
  );

  await db.product.update({
    where: { id: productId },
    data: {
      reviewSummary: summary as unknown as Prisma.InputJsonValue,
      reviewSummaryAt: new Date(),
    },
  });
  revalidateProduct(productId, product.slug);
  return summary;
}

/**
 * Best-effort refresh after reviews are approved. Never throws — if the AI
 * provider is down/over quota the summary just stays stale (graceful fallback).
 */
export async function refreshReviewSummarySafe(productId: string): Promise<void> {
  try {
    await regenerateReviewSummary(productId);
  } catch (error) {
    console.warn(`[ai] review summary refresh failed for ${productId}:`, (error as Error).message);
  }
}

function revalidateProduct(productId: string, slug: string): void {
  revalidateTags(cacheTags.product(productId), cacheTags.productSlug(slug));
}

/** Narrow the Product.reviewSummary Json column to our shape for the PDP. */
export function parseReviewSummary(value: unknown): ReviewSummary | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.sentiment !== "string" || !Array.isArray(v.pros) || !Array.isArray(v.cons)) {
    return null;
  }
  return {
    sentiment: v.sentiment,
    pros: v.pros.filter((x): x is string => typeof x === "string"),
    cons: v.cons.filter((x): x is string => typeof x === "string"),
  };
}

// ── AI-3 / AI-6: embeddings (semantic search + recommendations) ───────────────
// Vectors are stored as JSON on Product and compared in-app with cosine
// similarity — no pgvector needed, stays on the free tier. Embeddings are
// regenerated on product create/update/publish (best-effort).

/** Cap how many products we score in memory per query — fine for this catalog. */
const EMBED_SCAN_LIMIT = 1000;
/** Ignore weak semantic matches so unrelated products don't leak in. */
const SEMANTIC_MIN_SCORE = 0.55;

/** Build the text we embed for a product: title + clean description + taxonomy. */
function productEmbeddingText(p: {
  title: string;
  description: string;
  subcategory: { name: string; category: { name: string } };
  specs: { key: string; value: string }[];
}): string {
  const plainDescription = p.description
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const specs = p.specs.map((s) => `${s.key}: ${s.value}`).join(", ");
  return [p.title, p.subcategory.category.name, p.subcategory.name, plainDescription, specs]
    .filter(Boolean)
    .join(". ")
    .slice(0, 4000);
}

function parseEmbedding(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value.every((x) => typeof x === "number") ? (value as number[]) : null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

/** Regenerate and cache a product's embedding vector. */
export async function regenerateProductEmbedding(productId: string): Promise<void> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      title: true,
      description: true,
      subcategory: { select: { name: true, category: { select: { name: true } } } },
      specs: { select: { key: true, value: true } },
    },
  });
  if (!product) throw notFound("Product not found");

  const [vector] = await ai.embed([productEmbeddingText(product)]);
  await db.product.update({
    where: { id: productId },
    data: { embedding: vector as unknown as Prisma.InputJsonValue },
  });
}

/** Best-effort embedding refresh — never throws (provider may be down/unsupported). */
export async function refreshProductEmbeddingSafe(productId: string): Promise<void> {
  try {
    await regenerateProductEmbedding(productId);
  } catch (error) {
    console.warn(`[ai] embedding refresh failed for ${productId}:`, (error as Error).message);
  }
}

/** Embed a free-text query, or null if the provider can't embed (graceful). */
async function embedQuery(text: string): Promise<number[] | null> {
  try {
    const [vector] = await ai.embed([text]);
    return parseEmbedding(vector);
  } catch (error) {
    console.warn("[ai] query embed failed:", (error as Error).message);
    return null;
  }
}

/**
 * AI-3: score published products against a query by embedding similarity.
 * Returns id → score for matches above the threshold, or an empty map when
 * embeddings are unavailable (callers then fall back to keyword search).
 */
export async function semanticProductScores(query: string): Promise<Map<string, number>> {
  const queryVec = await embedQuery(query);
  const scores = new Map<string, number>();
  if (!queryVec) return scores;

  const rows = await db.product.findMany({
    where: { isPublished: true, embedding: { not: Prisma.DbNull } },
    select: { id: true, embedding: true },
    take: EMBED_SCAN_LIMIT,
  });
  for (const row of rows) {
    const vec = parseEmbedding(row.embedding);
    if (!vec) continue;
    const score = cosineSimilarity(queryVec, vec);
    if (score >= SEMANTIC_MIN_SCORE) scores.set(row.id, score);
  }
  return scores;
}

/**
 * AI-6: "you may also like" — products most similar to the given one by
 * embedding, across categories. Empty when embeddings aren't available.
 */
export async function recommendProducts(productId: string, limit = 6): Promise<ProductCard[]> {
  const self = await db.product.findUnique({
    where: { id: productId },
    select: { embedding: true },
  });
  const selfVec = self && parseEmbedding(self.embedding);
  if (!selfVec) return [];

  const rows = await db.product.findMany({
    where: { isPublished: true, embedding: { not: Prisma.DbNull }, NOT: { id: productId } },
    select: { id: true, embedding: true },
    take: EMBED_SCAN_LIMIT,
  });

  const ranked = rows
    .map((r) => ({ id: r.id, score: cosineSimilarity(selfVec, parseEmbedding(r.embedding) ?? []) }))
    .filter((r) => r.score >= SEMANTIC_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  if (ranked.length === 0) return [];

  const cards = await db.product.findMany({
    where: { id: { in: ranked.map((r) => r.id) } },
    select: productCardSelect,
  });
  // Preserve similarity order (findMany doesn't guarantee it).
  const byId = new Map(cards.map((c) => [c.id, c]));
  return ranked
    .map((r) => byId.get(r.id))
    .filter(Boolean)
    .map((c) => toProductCard(c!));
}
