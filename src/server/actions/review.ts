"use server";

import { RATE_LIMITS } from "@/lib/rate-limits";
import { ok, toResult, type Result } from "@/lib/result";
import { getSession, requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { clientIp, enforcePolicy } from "@/server/services/rate-limit";
import {
  approveReviews,
  createReview,
  deleteReview,
  setReviewApproved,
} from "@/server/services/review";
import { createReviewSchema, type CreateReviewInput } from "@/server/validators/review";

// Public: submit a review. Rate-limited per IP; always created pending moderation.
export async function submitReviewAction(
  input: CreateReviewInput,
): Promise<Result<{ id: string; pending: true }>> {
  try {
    const data = createReviewSchema.parse(input);

    await enforcePolicy(`review:create:${await clientIp()}`, RATE_LIMITS.reviewCreate);

    const session = await getSession();
    const review = await createReview({ ...data, customerId: session?.user.id ?? null });

    return ok({ id: review.id, pending: true });
  } catch (error) {
    return toResult(error);
  }
}

// Admin: approve/unapprove a review (recomputes product rating aggregates).
export async function setReviewApprovedAction(
  reviewId: string,
  isApproved: boolean,
): Promise<Result<{ id: string; isApproved: boolean }>> {
  try {
    const session = await requireAdmin();
    const result = await setReviewApproved(reviewId, isApproved);
    await recordAudit({
      adminId: session.user.id,
      action: isApproved ? "review.approve" : "review.unapprove",
      entity: "Review",
      entityId: reviewId,
    });
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}

// Admin: bulk-approve reviews from the moderation queue.
export async function bulkApproveReviewsAction(ids: string[]): Promise<Result<{ count: number }>> {
  try {
    const session = await requireAdmin();
    const result = await approveReviews(ids);
    await recordAudit({
      adminId: session.user.id,
      action: "review.bulk_approve",
      entity: "Review",
      diff: { ids, count: result.count },
    });
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}

// Admin: delete a review (recomputes product rating aggregates).
export async function deleteReviewAction(reviewId: string): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const result = await deleteReview(reviewId);
    await recordAudit({
      adminId: session.user.id,
      action: "review.delete",
      entity: "Review",
      entityId: reviewId,
    });
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}
