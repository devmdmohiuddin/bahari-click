"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { createCouponAction, updateCouponAction } from "@/server/actions/coupon";

export type CouponEdit = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  startsAt: string | null; // ISO
  endsAt: string | null;
  isActive: boolean;
};

export type CouponDialogState = { mode: "create" } | { mode: "edit"; coupon: CouponEdit };

function toDateInput(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

function num(v: string): number | null {
  const n = Number(v);
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

function CouponForm({ state, onClose }: { state: CouponDialogState; onClose: () => void }) {
  const router = useRouter();
  const edit = state.mode === "edit" ? state.coupon : null;

  const [code, setCode] = useState(edit?.code ?? "");
  const [type, setType] = useState<"percent" | "fixed">(edit?.type ?? "percent");
  const [value, setValue] = useState(edit?.value?.toString() ?? "");
  const [minOrder, setMinOrder] = useState(edit?.minOrder?.toString() ?? "");
  const [maxDiscount, setMaxDiscount] = useState(edit?.maxDiscount?.toString() ?? "");
  const [usageLimit, setUsageLimit] = useState(edit?.usageLimit?.toString() ?? "");
  const [startsAt, setStartsAt] = useState(toDateInput(edit?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDateInput(edit?.endsAt ?? null));
  const [isActive, setIsActive] = useState(edit?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valueNum = Number(value);
    if (!code.trim()) return toast.error("Code is required");
    if (!valueNum || valueNum <= 0) return toast.error("Enter a valid value");
    if (type === "percent" && valueNum > 100) return toast.error("Percent must be 1–100");

    const payload = {
      code: code.trim(),
      type,
      value: valueNum,
      minOrder: num(minOrder),
      maxDiscount: type === "percent" ? num(maxDiscount) : null,
      usageLimit: num(usageLimit),
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      isActive,
    };

    setSaving(true);
    const res =
      state.mode === "create"
        ? await createCouponAction(payload)
        : await updateCouponAction(state.coupon.id, payload);
    setSaving(false);

    if (!res.ok) return toast.error("Could not save coupon", res.error.message);
    toast.success(state.mode === "create" ? "Coupon created" : "Coupon updated");
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{state.mode === "create" ? "New coupon" : "Edit coupon"}</DialogTitle>
        <DialogDescription>Discounts apply to the order subtotal at checkout.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EID25"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as "percent" | "fixed")}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent (%)</SelectItem>
              <SelectItem value="fixed">Fixed (৳)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="value">{type === "percent" ? "Percent off" : "Amount off (৳)"}</Label>
          <Input
            id="value"
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        {type === "percent" && (
          <div className="space-y-2">
            <Label htmlFor="maxDiscount">Max discount (৳)</Label>
            <Input
              id="maxDiscount"
              type="number"
              min={0}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="No cap"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="minOrder">Min order (৳)</Label>
          <Input
            id="minOrder"
            type="number"
            min={0}
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            placeholder="None"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="usageLimit">Usage limit</Label>
          <Input
            id="usageLimit"
            type="number"
            min={1}
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts</Label>
          <Input
            id="startsAt"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Ends</Label>
          <Input
            id="endsAt"
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="active">Active</Label>
          <p className="text-muted-foreground text-xs">Usable at checkout.</p>
        </div>
        <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {state.mode === "create" ? "Create" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CouponDialog({
  state,
  onClose,
}: {
  state: CouponDialogState | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {state && (
          <CouponForm
            key={state.mode === "edit" ? state.coupon.id : "new"}
            state={state}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
