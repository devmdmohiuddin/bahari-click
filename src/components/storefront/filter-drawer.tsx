"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FilterFacets } from "@/server/services/catalog-options";
import { Button } from "@/components/ui/button";
import { SearchFilters, type SubFilterOption } from "@/components/storefront/search-filters";

// Mobile/tablet filter access: a button that opens a slide-in panel with the
// same SearchFilters used in the desktop sidebar.
export function FilterDrawer({
  subcategories,
  facets,
}: {
  subcategories: SubFilterOption[];
  facets: FilterFacets;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="lg:hidden">
        <SlidersHorizontal />
        Filters
      </Button>

      <div
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "bg-background absolute inset-y-0 right-0 flex w-[20rem] max-w-[88vw] flex-col shadow-xl transition-transform duration-200",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between border-b px-4">
            <span className="font-semibold">Filters</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
            >
              <X />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SearchFilters
              subcategories={subcategories}
              facets={facets}
              onApplied={() => setOpen(false)}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
