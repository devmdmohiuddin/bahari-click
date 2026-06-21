import { MousePointerClick } from "lucide-react";

import { cn } from "@/lib/utils";

// Brand loading motif (docs/07-brand-guidelines.md §6): the cursor-sparkle click
// mark, gently pulsing. Used for route/data loading and inline busy states —
// kept light, not gimmicky.
const sizes = {
  sm: "size-4",
  md: "size-6",
  lg: "size-9",
} as const;

export function Spinner({
  size = "md",
  className,
  label = "Loading",
}: {
  size?: keyof typeof sizes;
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" aria-label={label} className={cn("text-brand inline-flex", className)}>
      <MousePointerClick className={cn("animate-pulse", sizes[size])} />
    </span>
  );
}

// Full-area centered spinner for route-level loading.tsx files.
export function PageSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-64 flex-1 items-center justify-center", className)}>
      <Spinner size="lg" />
    </div>
  );
}
