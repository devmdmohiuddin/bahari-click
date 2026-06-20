import Link from "next/link";
import { Store } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({ className, href = "/admin" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
        <Store className="size-4" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight">Bahari Click</span>
        <span className="text-muted-foreground text-[0.7rem]">Admin Panel</span>
      </span>
    </Link>
  );
}
