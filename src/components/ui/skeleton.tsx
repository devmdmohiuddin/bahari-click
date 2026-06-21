import { cn } from "@/lib/utils";

// Loading placeholder. Uses the brand tint so skeletons read on-brand, not grey.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
