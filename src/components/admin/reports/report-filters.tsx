"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export function ReportFilters({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function apply(next: { from?: string; to?: string }) {
    const sp = new URLSearchParams(params.toString());
    if (next.from !== undefined) sp.set("from", next.from);
    if (next.to !== undefined) sp.set("to", next.to);
    router.push(`${pathname}?${sp.toString()}`);
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
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
      <div className="bg-muted flex w-fit items-center gap-1 rounded-full p-1">
        {PRESETS.map((p) => (
          <Button
            key={p.days}
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => apply({ from: isoDaysAgo(p.days), to: todayIso })}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
