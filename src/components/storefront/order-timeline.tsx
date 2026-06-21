import { Check, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABEL, type OrderStatusValue } from "@/lib/orders";

type HistoryEntry = { status: string; note: string | null; createdAt: Date };

// Canonical happy-path rail. Returned/cancelled are terminal and render after
// the steps actually reached.
const HAPPY_PATH: OrderStatusValue[] = [
  "pending",
  "confirmed",
  "packed",
  "dispatched",
  "delivered",
];

type StepState = "done" | "current" | "upcoming" | "terminal";
type Step = { status: OrderStatusValue; state: StepState; at?: Date; note?: string | null };

export function OrderTimeline({
  history,
  currentStatus,
}: {
  history: HistoryEntry[];
  currentStatus: string;
}) {
  const reached = new Set(history.map((h) => h.status));
  const at = (s: string) => history.find((h) => h.status === s)?.createdAt;
  const noteAt = (s: string) => history.find((h) => h.status === s)?.note ?? null;

  const happyIdx = HAPPY_PATH.indexOf(currentStatus as OrderStatusValue);
  let steps: Step[];

  if (happyIdx >= 0) {
    steps = HAPPY_PATH.map((s, i) => ({
      status: s,
      state: i < happyIdx ? "done" : i === happyIdx ? "current" : "upcoming",
      at: at(s),
      note: noteAt(s),
    }));
  } else {
    // Terminal (returned/cancelled): show reached happy steps, then the terminal.
    steps = HAPPY_PATH.filter((s) => reached.has(s)).map((s) => ({
      status: s,
      state: "done" as const,
      at: at(s),
      note: noteAt(s),
    }));
    steps.push({
      status: currentStatus as OrderStatusValue,
      state: "terminal",
      at: at(currentStatus),
      note: noteAt(currentStatus),
    });
  }

  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const done = step.state === "done";
        const current = step.state === "current";
        const terminal = step.state === "terminal";
        return (
          <li key={`${step.status}-${i}`} className="flex gap-4 pb-6 last:pb-0">
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
                  done && "bg-success text-brand-foreground",
                  current && "bg-brand text-brand-foreground ring-brand/25 ring-4",
                  terminal && "bg-destructive text-brand-foreground",
                  step.state === "upcoming" && "bg-muted text-muted-foreground border",
                )}
              >
                {terminal ? (
                  <X className="size-4" />
                ) : current ? (
                  <Clock className="size-4" />
                ) : done ? (
                  <Check className="size-4" />
                ) : (
                  <span className="bg-muted-foreground/40 size-2 rounded-full" />
                )}
              </span>
              {!isLast && (
                <span
                  className={cn("w-px flex-1", done ? "bg-success" : "bg-border")}
                  aria-hidden
                />
              )}
            </div>

            <div className="-mt-0.5 pb-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "upcoming" && "text-muted-foreground",
                  terminal && "text-destructive",
                  current && "text-brand",
                )}
              >
                {STATUS_LABEL[step.status] ?? step.status}
              </p>
              {step.at ? (
                <p className="text-muted-foreground text-xs">{formatDateTime(step.at)}</p>
              ) : step.state === "upcoming" ? (
                <p className="text-muted-foreground/70 text-xs">Pending</p>
              ) : null}
              {step.note && <p className="text-muted-foreground mt-0.5 text-sm">{step.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
