import { revalidateTag, unstable_cache } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cacheTags } from "@/lib/cache";
import { conflict, notFound } from "@/lib/errors";
import { uniqueSlug } from "@/lib/slug";
import { campaignInputSchema, type CampaignInput } from "@/server/validators/campaign";

// Campaigns (flash sales / landing pages). Active reads are cached + tagged.

function revalidate() {
  try {
    revalidateTag(cacheTags.campaigns, "max");
  } catch {
    // outside a request (script/job) — ignore
  }
}

/** Campaigns that are active and within their (optional) time window. */
export const listLiveCampaigns = unstable_cache(
  async () => {
    const now = new Date();
    return db.campaign.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { startsAt: "desc" },
    });
  },
  ["live-campaigns"],
  { tags: [cacheTags.campaigns] },
);

export async function getCampaignBySlug(slug: string) {
  return db.campaign.findUnique({ where: { slug } });
}

export async function listCampaigns() {
  return db.campaign.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createCampaign(input: CampaignInput) {
  const data = campaignInputSchema.parse(input);
  const slug = await uniqueSlug(data.slug ?? data.title, async (s) =>
    Boolean(await db.campaign.findUnique({ where: { slug: s }, select: { id: true } })),
  );

  const campaign = await db.campaign.create({
    data: {
      title: data.title,
      slug,
      type: data.type,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
      isActive: data.isActive,
      config: (data.config ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
  revalidate();
  return campaign;
}

export async function updateCampaign(id: string, input: Partial<CampaignInput>) {
  const existing = await db.campaign.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Campaign not found");

  const data = campaignInputSchema.partial().parse(input);
  if (data.slug) {
    const clash = await db.campaign.findFirst({
      where: { slug: data.slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) throw conflict("Slug already in use");
  }

  const campaign = await db.campaign.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      type: data.type,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: data.isActive,
      config: (data.config ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
  revalidate();
  return campaign;
}
