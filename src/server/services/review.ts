import { db } from "@/lib/db";
import { cacheTags, revalidateTags } from "@/lib/cache";
import { notFound, validationError } from "@/lib/errors";
import { createReviewSchema, type CreateReviewInput } from "@/server/validators/review";

// Reviews: create (hidden pending moderation), list approved + breakdown,
// approve/delete with denormalized aggregate recompute on Product.

export interface RatingBreakdown {
  average: number;
  count: number;
  stars: Record<1 | 2 | 3 | 4 | 5, number>;
}

interface CreateReviewArgs extends CreateReviewInput {
  customerId?: string | null;
}

export async function createReview(args: CreateReviewArgs) {
  const data = createReviewSchema.parse(args);

  if (!args.customerId && !data.guestName) {
    throw validationError("A name is required for guest reviews");
  }

  const product = await db.product.findUnique({
    where: { id: data.productId },
    select: { id: true, slug: true },
  });
  if (!product) throw notFound("Product not found");

  const review = await db.review.create({
    data: {
      productId: data.productId,
      customerId: args.customerId ?? null,
      guestName: args.customerId ? null : (data.guestName ?? null),
      rating: data.rating,
      comment: data.comment ?? null,
      imageUrls: data.imageUrls ?? [],
      // Always created hidden; visible only after moderation.
      isApproved: false,
    },
  });

  return review;
}

export async function listApprovedReviews(productId: string) {
  return db.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      imageUrls: true,
      guestName: true,
      createdAt: true,
      customer: { select: { name: true } },
    },
  });
}

export async function getRatingBreakdown(productId: string): Promise<RatingBreakdown> {
  const grouped = await db.review.groupBy({
    by: ["rating"],
    where: { productId, isApproved: true },
    _count: { rating: true },
  });

  const stars: RatingBreakdown["stars"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const g of grouped) {
    const star = g.rating as 1 | 2 | 3 | 4 | 5;
    const n = g._count.rating;
    stars[star] = n;
    total += n;
    sum += star * n;
  }

  return {
    average: total ? Math.round((sum / total) * 10) / 10 : 0,
    count: total,
    stars,
  };
}

/** Recompute Product.ratingAvg/ratingCount from approved reviews. */
async function recomputeAggregates(productId: string) {
  const agg = await db.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const count = agg._count.rating;
  const avg = agg._avg.rating ?? 0;

  await db.product.update({
    where: { id: productId },
    data: { ratingCount: count, ratingAvg: Math.round(avg * 10) / 10 },
  });
}

export async function setReviewApproved(reviewId: string, isApproved: boolean) {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, productId: true, product: { select: { slug: true } } },
  });
  if (!review) throw notFound("Review not found");

  await db.review.update({ where: { id: reviewId }, data: { isApproved } });
  await recomputeAggregates(review.productId);

  revalidateTags(
    cacheTags.products,
    cacheTags.product(review.productId),
    cacheTags.productSlug(review.product.slug),
  );
  return { id: review.id, isApproved };
}

export async function deleteReview(reviewId: string) {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, productId: true, product: { select: { slug: true } } },
  });
  if (!review) throw notFound("Review not found");

  await db.review.delete({ where: { id: reviewId } });
  await recomputeAggregates(review.productId);

  revalidateTags(
    cacheTags.products,
    cacheTags.product(review.productId),
    cacheTags.productSlug(review.product.slug),
  );
  return { id: review.id };
}

/** Pending reviews for the admin moderation queue. */
export async function listPendingReviews() {
  return db.review.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "asc" },
    include: { product: { select: { title: true, slug: true } } },
  });
}
