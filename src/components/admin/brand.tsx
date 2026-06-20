import Link from "next/link";
import { MousePointerClick } from "lucide-react";

import { cn } from "@/lib/utils";

// Logo lockup per docs/07-brand-guidelines.md: cursor/click mark (white knockout
// on brand orange) + "Bahari" wordmark + lowercase "click" pill.
export function Brand({ className, href = "/admin" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span className="bg-brand text-brand-foreground flex size-8 shrink-0 items-center justify-center rounded-xl shadow-sm">
        <MousePointerClick className="size-4" />
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-heading text-brand text-lg leading-none font-extrabold tracking-tight">
          Bahari
        </span>
        <span className="border-brand/40 text-brand rounded-full border px-2 py-0.5 text-xs font-semibold lowercase">
          click
        </span>
      </span>
    </Link>
  );
}
