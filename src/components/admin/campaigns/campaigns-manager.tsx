"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Pencil, Plus, Zap } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { PageHeader } from "@/components/admin/page-header";
import {
  CampaignDialog,
  type CampaignDialogState,
  type CampaignType,
} from "@/components/admin/campaigns/campaign-dialog";
import { updateCampaignAction } from "@/server/actions/campaign";

export type CampaignRow = {
  id: string;
  title: string;
  slug: string;
  type: CampaignType;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  config: unknown;
};

function windowLabel(c: CampaignRow): string {
  if (!c.startsAt && !c.endsAt) return "Always";
  const f = (s: string | null) => (s ? formatDateTime(s) : "—");
  return `${f(c.startsAt)} → ${f(c.endsAt)}`;
}

// A campaign is live when active and within its (optional) time window.
function isLive(c: CampaignRow): boolean {
  if (!c.isActive) return false;
  const now = Date.now();
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return false;
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return false;
  return true;
}

export function CampaignsManager({ campaigns }: { campaigns: CampaignRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<CampaignDialogState | null>(null);

  async function toggleActive(c: CampaignRow, isActive: boolean) {
    const res = await updateCampaignAction(c.id, { title: c.title, type: c.type, isActive });
    if (!res.ok) return toast.error("Could not update", res.error.message);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Campaigns" description="Flash sales and landing pages for promotions.">
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Plus />
          New campaign
        </Button>
      </PageHeader>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create a flash sale or a landing page to promote products."
        >
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus />
            New campaign
          </Button>
        </EmptyState>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Window</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="w-px"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-muted-foreground font-mono text-xs">/{c.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.type === "flash" ? "warning" : "secondary"}>
                      {c.type === "flash" && <Zap className="size-3" />}
                      {c.type === "flash" ? "Flash" : "Landing"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {windowLabel(c)}
                  </TableCell>
                  <TableCell className="text-center">
                    {isLive(c) ? (
                      <Badge variant="success">Live</Badge>
                    ) : (
                      <Badge variant="secondary">{c.isActive ? "Scheduled" : "Off"}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={(v) => toggleActive(c, v)}
                        aria-label="Toggle active"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit campaign"
                      onClick={() => setDialog({ mode: "edit", campaign: c })}
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

      <CampaignDialog state={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
