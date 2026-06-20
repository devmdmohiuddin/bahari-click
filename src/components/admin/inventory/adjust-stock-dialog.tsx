"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { adjustStockAction, getStockHistoryAction, setStockAction } from "@/server/actions/stock";
import type { StockHistoryEntry } from "@/server/services/stock";

export type AdjustTarget = { id: string; label: string; stock: number };

const REASONS = ["restock", "correction", "damaged", "returned", "manual"];

function AdjustForm({ target, onClose }: { target: AdjustTarget; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"set" | "adjust">("set");
  const [value, setValue] = useState(target.stock.toString());
  const [reason, setReason] = useState("restock");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<StockHistoryEntry[] | null>(null);

  useEffect(() => {
    let active = true;
    getStockHistoryAction(target.id).then((res) => {
      if (active && res.ok) setHistory(res.data);
    });
    return () => {
      active = false;
    };
  }, [target.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (Number.isNaN(n)) return toast.error("Enter a valid number");
    if (mode === "adjust" && n === 0) return toast.error("Adjustment cannot be zero");
    if (mode === "set" && n < 0) return toast.error("Stock cannot be negative");

    setSaving(true);
    const res =
      mode === "set"
        ? await setStockAction({ variantId: target.id, stock: n, reason })
        : await adjustStockAction({ variantId: target.id, delta: n, reason });
    setSaving(false);

    if (!res.ok) return toast.error("Could not update stock", res.error.message);
    toast.success("Stock updated", `New stock: ${res.data.newStock}`);
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogDescription>
          {target.label} · current stock <span className="font-medium">{target.stock}</span>
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="mode">Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as "set" | "adjust")}>
            <SelectTrigger id="mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="set">Set to</SelectItem>
              <SelectItem value="adjust">Adjust by (±)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="value">{mode === "set" ? "New stock" : "Change (+/-)"}</Label>
          <Input
            id="value"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === "set" ? "0" : "e.g. 10 or -2"}
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger id="reason" className="capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Recent movements</Label>
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2 text-sm">
          {history === null ? (
            <p className="text-muted-foreground flex items-center gap-2 px-1 py-2">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </p>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground px-1 py-2">No movements yet.</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-2 px-1">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-10 text-right font-medium tabular-nums",
                      h.delta > 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {h.delta > 0 ? `+${h.delta}` : h.delta}
                  </span>
                  <span className="text-muted-foreground capitalize">{h.reason}</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  → {h.newStock} · {formatDate(h.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdjustStockDialog({
  target,
  onClose,
}: {
  target: AdjustTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {target && <AdjustForm key={target.id} target={target} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
