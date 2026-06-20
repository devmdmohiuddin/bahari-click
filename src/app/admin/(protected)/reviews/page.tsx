import { listPendingReviews } from "@/server/services/review";
import { ReviewModeration } from "@/components/admin/reviews/review-moderation";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await listPendingReviews();
  return <ReviewModeration reviews={reviews} />;
}
