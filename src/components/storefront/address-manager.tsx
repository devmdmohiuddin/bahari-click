"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateAddressAction,
} from "@/server/actions/account";

type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  area: string | null;
  city: string | null;
  zoneId: string | null;
  note: string | null;
  isDefault: boolean;
};
type Zone = { id: string; name: string };

const EMPTY = { name: "", phone: "", line1: "", area: "", city: "", zoneId: "", note: "" };

export function AddressManager({ addresses, zones }: { addresses: Address[]; zones: Zone[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [pending, startTransition] = useTransition();

  function openAdd() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(a: Address) {
    setForm({
      name: a.name,
      phone: a.phone,
      line1: a.line1,
      area: a.area ?? "",
      city: a.city ?? "",
      zoneId: a.zoneId ?? "",
      note: a.note ?? "",
    });
    setEditingId(a.id);
    setShowForm(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.line1.trim()) {
      toast.error("Name, phone and address are required");
      return;
    }
    const input = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      area: form.area.trim() || undefined,
      city: form.city.trim() || undefined,
      zoneId: form.zoneId || undefined,
      note: form.note.trim() || undefined,
    };
    startTransition(async () => {
      const res = editingId
        ? await updateAddressAction(editingId, input)
        : await addAddressAction(input);
      if (res.ok) {
        toast.success(editingId ? "Address updated" : "Address added");
        setShowForm(false);
        setEditingId(null);
        router.refresh();
      } else {
        toast.error("Couldn’t save address", res.error.message);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteAddressAction(id);
      if (res.ok) {
        toast.success("Address removed");
        router.refresh();
      } else {
        toast.error("Couldn’t remove", res.error.message);
      }
    });
  }

  function makeDefault(id: string) {
    startTransition(async () => {
      const res = await setDefaultAddressAction(id);
      if (res.ok) router.refresh();
      else toast.error("Couldn’t update", res.error.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Saved addresses</h2>
        {!showForm && (
          <Button size="sm" onClick={openAdd}>
            <Plus />
            Add address
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-muted/30 space-y-4 rounded-2xl border p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </Field>
          </div>
          <Field label="Address">
            <Input
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              placeholder="House, road, area"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Area (optional)">
              <Input
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
            </Field>
            <Field label="City (optional)">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Delivery zone">
              <Select value={form.zoneId} onValueChange={(v) => setForm({ ...form, zoneId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save address"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border py-16 text-center">
          <MapPin className="text-muted-foreground/40 size-10" />
          <p className="text-muted-foreground">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl border p-4",
                a.isDefault && "border-brand/40 bg-brand-tint/30",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{a.name}</p>
                {a.isDefault && (
                  <span className="text-brand flex items-center gap-1 text-xs font-semibold">
                    <Star className="size-3 fill-current" /> Default
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{a.phone}</p>
              <p className="mt-1 text-sm">
                {a.line1}
                {a.area ? `, ${a.area}` : ""}
                {a.city ? `, ${a.city}` : ""}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {!a.isDefault && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => makeDefault(a.id)}
                    disabled={pending}
                  >
                    <Check /> Set default
                  </Button>
                )}
                <Button variant="outline" size="xs" onClick={() => openEdit(a)} disabled={pending}>
                  <Pencil /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => remove(a.id)}
                  disabled={pending}
                  className="text-destructive"
                >
                  <Trash2 /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
