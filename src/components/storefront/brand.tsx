import Link from "next/link";
import { MousePointerClick } from "lucide-react";

import { cn } from "@/lib/utils";

// Storefront logo lockup (docs/07-brand-guidelines.md): cursor/click mark
// (white knockout on brand orange) + "Bahari" wordmark + lowercase "click" pill.
export function Brand({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string;
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
  return (
    <Link
      href={href}
      aria-label="Bahari Click — home"
      className={cn(
        "group flex items-center gap-2.5 transition-opacity hover:opacity-90",
        className,
      )}
    >
      <span
        className={cn(
          "bg-brand text-brand-foreground flex shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:-rotate-6 group-active:scale-95",
          lg ? "size-10" : "size-9",
        )}
      >
        <MousePointerClick className={lg ? "size-5" : "size-[18px]"} />
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "font-heading text-brand leading-none font-extrabold tracking-tight",
            lg ? "text-2xl" : "text-xl",
          )}
        >
          Bahari
        </span>
        <span className="border-brand/40 text-brand rounded-full border px-2 py-0.5 text-xs font-semibold lowercase">
          click
        </span>
      </span>
    </Link>
  );
}
