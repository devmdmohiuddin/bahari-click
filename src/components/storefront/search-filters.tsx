"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { FilterFacets } from "@/server/services/catalog-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SubFilterOption = { slug: string; name: string; group: string };

export function SearchFilters({
  subcategories,
  facets,
  onApplied,
}: {
  subcategories: SubFilterOption[];
  facets: FilterFacets;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [min, setMin] = useState(searchParams.get("min") ?? "");
  const [max, setMax] = useState(searchParams.get("max") ?? "");

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(patch)) {
      if (val === null || val === "") params.delete(key);
      else params.set(key, val);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    onApplied?.();
  }

  // Single-select toggles: clicking the active value clears it.
  const toggle = (key: string, val: string) =>
    update({ [key]: searchParams.get(key) === val ? null : val });

  const activeSub = searchParams.get("sub");
  const activeColor = searchParams.get("color");
  const activeSize = searchParams.get("size");
  const inStock = searchParams.get("instock") === "true";
  const hasAny =
    [...searchParams.keys()].some((k) =>
      ["sub", "color", "size", "min", "max", "instock"].includes(k),
    ) || false;

  // Group subcategories by parent category.
  const groups = subcategories.reduce<Record<string, SubFilterOption[]>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        {hasAny && (
          <button
            type="button"
            onClick={() =>
              update({ sub: null, color: null, size: null, min: null, max: null, instock: null })
            }
            className="text-brand text-sm hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* In stock */}
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => update({ instock: e.target.checked ? "true" : null })}
          className="accent-brand size-4 rounded"
        />
        In stock only
      </label>

      {/* Subcategory */}
      {subcategories.length > 0 && (
        <FilterGroup label="Category">
          <div className="space-y-3">
            {Object.entries(groups).map(([group, subs]) => (
              <div key={group}>
                <p className="text-muted-foreground mb-1.5 text-xs font-medium">{group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {subs.map((s) => (
                    <Chip
                      key={s.slug}
                      active={activeSub === s.slug}
                      onClick={() => toggle("sub", s.slug)}
                    >
                      {s.name}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Price */}
      <FilterGroup label="Price (৳)">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="f-min" className="text-muted-foreground text-xs">
              Min
            </Label>
            <Input
              id="f-min"
              type="number"
              inputMode="numeric"
              value={min}
              min={0}
              placeholder={String(facets.priceMin)}
              onChange={(e) => setMin(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="f-max" className="text-muted-foreground text-xs">
              Max
            </Label>
            <Input
              id="f-max"
              type="number"
              inputMode="numeric"
              value={max}
              min={0}
              placeholder={String(facets.priceMax)}
              onChange={(e) => setMax(e.target.value)}
              className="h-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update({ min: min || null, max: max || null })}
          >
            Go
          </Button>
        </div>
      </FilterGroup>

      {/* Color */}
      {facets.colors.length > 0 && (
        <FilterGroup label="Color">
          <div className="flex flex-wrap gap-1.5">
            {facets.colors.map((c) => (
              <Chip key={c} active={activeColor === c} onClick={() => toggle("color", c)}>
                {c}
              </Chip>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Size */}
      {facets.sizes.length > 0 && (
        <FilterGroup label="Size">
          <div className="flex flex-wrap gap-1.5">
            {facets.sizes.map((s) => (
              <Chip key={s} active={activeSize === s} onClick={() => toggle("size", s)}>
                {s}
              </Chip>
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{label}</h3>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active ? "border-brand bg-brand-tint text-brand" : "hover:border-foreground/30",
      )}
    >
      {children}
    </button>
  );
}
