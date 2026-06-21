"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

// Header search slot. Submits to /search (results page arrives in Phase 6 S6.1).
export function SearchBar({
  className,
  onSubmitted,
}: {
  className?: string;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    onSubmitted?.();
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
        className="bg-muted/60 focus-visible:ring-ring/50 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background h-10 w-full rounded-full border border-transparent pr-4 pl-10 text-sm transition-colors outline-none focus-visible:ring-3"
      />
    </form>
  );
}
