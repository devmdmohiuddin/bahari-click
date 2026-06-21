import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABEL, type OrderStatusValue } from "@/lib/orders";

type HistoryEntry = { status: string; note: string | null; createdAt: Date };

// Vertical timeline of an order's real status history (most recent at the
// bottom). S5.1 will enrich this into a full pending→delivered rail.
export function OrderTimeline({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null;

  return (
    <ol className="relative space-y-6 pl-2">
      {history.map((h, i) => {
        const isLast = i === history.length - 1;
        const label = STATUS_LABEL[h.status as OrderStatusValue] ?? h.status;
        return (
          <li key={`${h.status}-${i}`} className="relative flex gap-4">
            {/* connector */}
            {!isLast && <span className="bg-border absolute top-7 left-[11px] h-full w-px" />}
            <span
              className={cn(
                "z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
                isLast ? "bg-brand text-brand-foreground" : "bg-success text-brand-foreground",
              )}
            >
              <Check className="size-3.5" />
            </span>
            <div className="-mt-0.5">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-muted-foreground text-xs">{formatDateTime(h.createdAt)}</p>
              {h.note && <p className="text-muted-foreground mt-0.5 text-sm">{h.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
