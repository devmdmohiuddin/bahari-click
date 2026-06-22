"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { createCampaign, updateCampaign } from "@/server/services/campaign";
import { campaignInputSchema, type CampaignInput } from "@/server/validators/campaign";

// Admin: create / update campaigns (flash sales, landing pages).

export async function createCampaignAction(
  input: CampaignInput,
): Promise<Result<{ id: string; slug: string }>> {
  try {
    const session = await requireAdmin();
    const campaign = await createCampaign(campaignInputSchema.parse(input));
    await recordAudit({
      adminId: session.user.id,
      action: "campaign.create",
      entity: "Campaign",
      entityId: campaign.id,
      diff: { title: campaign.title, type: campaign.type },
    });
    return ok({ id: campaign.id, slug: campaign.slug });
  } catch (error) {
    return toResult(error);
  }
}

export async function updateCampaignAction(
  id: string,
  input: Partial<CampaignInput>,
): Promise<Result<{ id: string; slug: string }>> {
  try {
    const session = await requireAdmin();
    const campaign = await updateCampaign(id, input);
    await recordAudit({
      adminId: session.user.id,
      action: "campaign.update",
      entity: "Campaign",
      entityId: campaign.id,
      diff: input,
    });
    return ok({ id: campaign.id, slug: campaign.slug });
  } catch (error) {
    return toResult(error);
  }
}
