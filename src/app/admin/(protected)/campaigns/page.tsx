import { listCampaigns } from "@/server/services/campaign";
import { CampaignsManager, type CampaignRow } from "@/components/admin/campaigns/campaigns-manager";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();
  const rows: CampaignRow[] = campaigns.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    type: c.type,
    startsAt: c.startsAt?.toISOString() ?? null,
    endsAt: c.endsAt?.toISOString() ?? null,
    isActive: c.isActive,
    config: c.config ?? null,
  }));
  return <CampaignsManager campaigns={rows} />;
}
