import { formatDate } from "@/lib/format";
import { StarRating } from "@/components/storefront/star-rating";

export type StorefrontReview = {
  id: string;
  rating: number;
  comment: string | null;
  imageUrls: string[];
  guestName: string | null;
  createdAt: Date;
  customer: { name: string | null } | null;
};

function authorName(r: StorefrontReview): string {
  return r.customer?.name ?? r.guestName ?? "Verified buyer";
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function ReviewList({ reviews }: { reviews: StorefrontReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-sm">
        No reviews yet — be the first to share your experience.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {reviews.map((r) => {
        const name = authorName(r);
        return (
          <li key={r.id} className="flex gap-3 py-5">
            <span className="bg-brand-tint text-brand flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {initial(name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-muted-foreground text-xs">{formatDate(r.createdAt)}</span>
              </div>
              <StarRating value={r.rating} className="mt-1" />
              {r.comment && <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
