"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUSES, STATUS_LABEL } from "@/lib/orders";

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const status = params.get("status") ?? "all";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  function apply(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    sp.delete("page"); // reset to first page on any filter change
    router.push(`${pathname}?${sp.toString()}`);
  }

  const hasFilters = q || status !== "all" || from || to;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form
        className="relative flex-1 sm:min-w-64"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
      >
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search order # or phone…"
          className="pl-9"
        />
      </form>

      <Select value={status} onValueChange={(v) => apply({ status: v === "all" ? "" : v })}>
        <SelectTrigger className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs">From</label>
          <Input type="date" value={from} onChange={(e) => apply({ from: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs">To</label>
          <Input type="date" value={to} onChange={(e) => apply({ to: e.target.value })} />
        </div>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            setQ("");
            router.push(pathname);
          }}
        >
          <X />
          Clear
        </Button>
      )}
    </div>
  );
}
