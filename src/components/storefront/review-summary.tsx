import { Check, Info, Sparkles } from "lucide-react";

import type { ReviewSummary as ReviewSummaryData } from "@/server/integrations/ai";

// AI-2: shows the cached pros/cons summary above the full review list (S2.2).
// Rendered only when a summary exists; otherwise the PDP shows reviews as usual.
export function ReviewSummary({ summary }: { summary: ReviewSummaryData }) {
  const hasLists = summary.pros.length > 0 || summary.cons.length > 0;

  return (
    <div className="bg-muted/30 rounded-xl border p-4 sm:p-5">
      <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
        <Sparkles className="size-3.5" />
        AI summary of buyer reviews
      </div>
      <p className="text-sm leading-relaxed">{summary.sentiment}</p>

      {hasLists && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {summary.pros.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">What buyers love</p>
              <ul className="space-y-1.5">
                {summary.pros.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.cons.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">What to note</p>
              <ul className="space-y-1.5">
                {summary.cons.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
