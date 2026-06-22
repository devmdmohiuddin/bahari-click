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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { createCampaignAction, updateCampaignAction } from "@/server/actions/campaign";

export type CampaignType = "flash" | "landing";

export type CampaignEdit = {
  id: string;
  title: string;
  slug: string;
  type: CampaignType;
  startsAt: string | null; // ISO
  endsAt: string | null;
  isActive: boolean;
  config: unknown;
};

export type CampaignDialogState = { mode: "create" } | { mode: "edit"; campaign: CampaignEdit };

// ISO → value for <input type="datetime-local"> (local time, minute precision).
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function CampaignForm({ state, onClose }: { state: CampaignDialogState; onClose: () => void }) {
  const router = useRouter();
  const edit = state.mode === "edit" ? state.campaign : null;

  const [title, setTitle] = useState(edit?.title ?? "");
  const [slug, setSlug] = useState(edit?.slug ?? "");
  const [type, setType] = useState<CampaignType>(edit?.type ?? "flash");
  const [startsAt, setStartsAt] = useState(toLocalInput(edit?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(edit?.endsAt ?? null));
  const [isActive, setIsActive] = useState(edit?.isActive ?? true);
  const [config, setConfig] = useState(edit?.config ? JSON.stringify(edit.config, null, 2) : "");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");

    let parsedConfig: Record<string, unknown> | null = null;
    if (config.trim()) {
      try {
        parsedConfig = JSON.parse(config);
      } catch {
        return toast.error("Config must be valid JSON");
      }
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      type,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      isActive,
      config: parsedConfig,
    };

    setSaving(true);
    const res =
      state.mode === "create"
        ? await createCampaignAction(payload)
        : await updateCampaignAction(state.campaign.id, payload);
    setSaving(false);

    if (!res.ok) return toast.error("Could not save campaign", res.error.message);
    toast.success(state.mode === "create" ? "Campaign created" : "Campaign updated");
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{state.mode === "create" ? "New campaign" : "Edit campaign"}</DialogTitle>
        <DialogDescription>
          Flash sales and landing pages. Leave the window blank to run indefinitely while active.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Eid Flash Sale"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as CampaignType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flash">Flash sale</SelectItem>
              <SelectItem value="landing">Landing page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Auto-generated from title if blank"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts</Label>
          <Input
            id="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Ends</Label>
          <Input
            id="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="config">
          Config <span className="text-muted-foreground font-normal">(JSON, optional)</span>
        </Label>
        <Textarea
          id="config"
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          rows={5}
          className="font-mono text-xs"
          placeholder={
            type === "flash"
              ? '{ "productIds": ["…"], "discountPct": 20 }'
              : '{ "blocks": [{ "type": "hero", "title": "…" }] }'
          }
        />
        <p className="text-muted-foreground text-xs">
          {type === "flash"
            ? "Flash payload — discounted product ids and the sale discount."
            : "Landing payload — ordered content blocks for the page."}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="active">Active</Label>
          <p className="text-muted-foreground text-xs">Live on the storefront within its window.</p>
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

export function CampaignDialog({
  state,
  onClose,
}: {
  state: CampaignDialogState | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {state && (
          <CampaignForm
            key={state.mode === "edit" ? state.campaign.id : "new"}
            state={state}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
