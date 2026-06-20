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
import {
  createCategoryAction,
  createSubcategoryAction,
  updateCategoryAction,
  updateSubcategoryAction,
} from "@/server/actions/catalog";

type EditValues = { name: string; slug: string; image: string | null; isActive: boolean };

export type CategoryDialogState =
  | { kind: "category"; mode: "create" }
  | { kind: "category"; mode: "edit"; id: string; values: EditValues }
  | { kind: "subcategory"; mode: "create"; categoryId: string }
  | { kind: "subcategory"; mode: "edit"; id: string; categoryId: string; values: EditValues };

type CategoryOption = { id: string; name: string };

function keyOf(state: CategoryDialogState): string {
  return `${state.kind}-${state.mode}-${"id" in state ? state.id : "new"}`;
}

// Inner form — keyed by the dialog target so each open starts with fresh state
// (no effect-based syncing).
function CategoryForm({
  state,
  categories,
  onClose,
}: {
  state: CategoryDialogState;
  categories: CategoryOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const edit = "values" in state ? state.values : null;
  const [name, setName] = useState(edit?.name ?? "");
  const [slug, setSlug] = useState(edit?.slug ?? "");
  const [image, setImage] = useState(edit?.image ?? "");
  const [isActive, setIsActive] = useState(edit?.isActive ?? true);
  const [categoryId, setCategoryId] = useState(
    state.kind === "subcategory" ? state.categoryId : "",
  );
  const [saving, setSaving] = useState(false);

  const isSub = state.kind === "subcategory";
  const noun = isSub ? "subcategory" : "category";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const base = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      image: image.trim() || null,
      isActive,
    };

    let result;
    if (state.kind === "category") {
      result =
        state.mode === "create"
          ? await createCategoryAction(base)
          : await updateCategoryAction(state.id, base);
    } else {
      const payload = { ...base, categoryId };
      result =
        state.mode === "create"
          ? await createSubcategoryAction(payload)
          : await updateSubcategoryAction(state.id, payload);
    }

    setSaving(false);
    if (!result.ok) {
      toast.error("Could not save", result.error.message);
      return;
    }
    toast.success(
      `${noun[0].toUpperCase()}${noun.slice(1)} ${state.mode === "create" ? "created" : "updated"}`,
    );
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{state.mode === "create" ? `New ${noun}` : `Edit ${noun}`}</DialogTitle>
        <DialogDescription>
          {isSub
            ? "Subcategories group products inside a category."
            : "Top-level groups shown in storefront navigation."}
        </DialogDescription>
      </DialogHeader>

      {isSub && (
        <div className="space-y-2">
          <Label htmlFor="parent">Parent category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="parent">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isSub ? "e.g. Wallets" : "e.g. Bags"}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Auto-generated from name if blank"
        />
        <p className="text-muted-foreground text-xs">Used in the storefront URL.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://… (optional)"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="active">Active</Label>
          <p className="text-muted-foreground text-xs">Visible on the storefront.</p>
        </div>
        <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || (isSub && !categoryId)}>
          {saving && <Loader2 className="animate-spin" />}
          {state.mode === "create" ? "Create" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoryDialog({
  state,
  categories,
  onClose,
}: {
  state: CategoryDialogState | null;
  categories: CategoryOption[];
  onClose: () => void;
}) {
  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {state && (
          <CategoryForm
            key={keyOf(state)}
            state={state}
            categories={categories}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
