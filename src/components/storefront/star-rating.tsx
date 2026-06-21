import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

// Presentational star rating. Renders a greyed row with a brand-amber filled
// overlay clipped to the fractional average — supports half/partial stars.
export function StarRating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / 5)) * 100;
  const star = size === "md" ? "size-4" : "size-3.5";
  const text = size === "md" ? "text-sm" : "text-xs";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="relative inline-flex" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
        <div className="text-muted-foreground/30 flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(star, "fill-current")} />
          ))}
        </div>
        <div className="absolute inset-0 flex overflow-hidden" style={{ width: `${pct}%` }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(star, "fill-warning text-warning shrink-0")} />
          ))}
        </div>
      </div>
      {typeof count === "number" && (
        <span className={cn("text-muted-foreground tabular-nums", text)}>({count})</span>
      )}
    </div>
  );
}
