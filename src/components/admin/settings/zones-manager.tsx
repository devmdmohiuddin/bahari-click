"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Pencil, Plus } from "lucide-react";

import { formatBdt } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/admin/empty-state";
import { createZoneAction, updateZoneAction } from "@/server/actions/shipping";

export type ZoneRow = {
  id: string;
  name: string;
  fee: number;
  freeShipThreshold: number | null;
  sortOrder: number;
  isActive: boolean;
};

type DialogState = { mode: "create" } | { mode: "edit"; zone: ZoneRow } | null;

function ZoneForm({ state, onClose }: { state: Exclude<DialogState, null>; onClose: () => void }) {
  const router = useRouter();
  const edit = state.mode === "edit" ? state.zone : null;
  const [name, setName] = useState(edit?.name ?? "");
  const [fee, setFee] = useState(edit?.fee?.toString() ?? "");
  const [threshold, setThreshold] = useState(edit?.freeShipThreshold?.toString() ?? "");
  const [sortOrder, setSortOrder] = useState(edit?.sortOrder?.toString() ?? "0");
  const [isActive, setIsActive] = useState(edit?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    const payload = {
      name: name.trim(),
      fee: Number(fee) || 0,
      freeShipThreshold: threshold.trim() === "" ? null : Number(threshold),
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };
    setSaving(true);
    const res =
      state.mode === "create"
        ? await createZoneAction(payload)
        : await updateZoneAction(state.zone.id, payload);
    setSaving(false);
    if (!res.ok) return toast.error("Could not save zone", res.error.message);
    toast.success(state.mode === "create" ? "Zone created" : "Zone updated");
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{state.mode === "create" ? "New zone" : "Edit zone"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="zname">Name</Label>
        <Input
          id="zname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Inside Dhaka"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="zfee">Delivery fee (৳)</Label>
          <Input
            id="zfee"
            type="number"
            min={0}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zthr">Free-ship threshold (৳)</Label>
          <Input
            id="zthr"
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="None"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="zsort">Sort order</Label>
          <Input
            id="zsort"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="flex h-9 items-center justify-between rounded-lg border px-3">
          <Label htmlFor="zactive">Active</Label>
          <Switch id="zactive" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {state.mode === "create" ? "Create" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ZonesManager({ zones }: { zones: ZoneRow[] }) {
  const [dialog, setDialog] = useState<DialogState>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Plus />
          New zone
        </Button>
      </div>

      {zones.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No shipping zones"
          description="Add delivery zones with COD fees."
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Free ship over</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="w-px"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((z) => (
                <TableRow key={z.id}>
                  <TableCell className="font-medium">{z.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBdt(z.fee)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {z.freeShipThreshold ? formatBdt(z.freeShipThreshold) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {z.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit zone"
                      onClick={() => setDialog({ mode: "edit", zone: z })}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          {dialog && (
            <ZoneForm
              key={dialog.mode === "edit" ? dialog.zone.id : "new"}
              state={dialog}
              onClose={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
