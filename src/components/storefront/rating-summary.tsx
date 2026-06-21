import { Star } from "lucide-react";

import type { RatingBreakdown } from "@/server/services/review";
import { StarRating } from "@/components/storefront/star-rating";

export function RatingSummary({ breakdown }: { breakdown: RatingBreakdown }) {
  const { average, count, stars } = breakdown;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex flex-col items-center justify-center gap-1 sm:w-40">
        <span className="font-heading text-5xl font-extrabold">{average.toFixed(1)}</span>
        <StarRating value={average} size="md" />
        <span className="text-muted-foreground text-sm">
          {count} {count === 1 ? "review" : "reviews"}
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const n = stars[star];
          const pct = count > 0 ? (n / count) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground flex w-8 items-center gap-0.5 tabular-nums">
                {star}
                <Star className="fill-warning text-warning size-3" />
              </span>
              <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                <div className="bg-warning h-full rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-muted-foreground w-8 text-right tabular-nums">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
