import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sparkles, Tag, Truck, BadgeCheck } from "lucide-react";

import { getCampaignBySlug } from "@/server/services/campaign";
import { getProductCardsBySlugs } from "@/server/services/listing";
import { getProductDetailBySlug } from "@/server/services/pdp";
import { getFeaturedProducts } from "@/server/services/home";
import { listActiveZones } from "@/server/services/shipping";
import { formatBdt } from "@/lib/format";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Countdown } from "@/components/storefront/countdown";
import { ProductImage } from "@/components/storefront/product-image";
import { LandingOrderForm, type LandingVariant } from "@/components/storefront/landing-order-form";

type CampaignConfig = {
  subtitle?: string;
  couponCode?: string;
  productSlugs?: string[];
  productSlug?: string;
  benefits?: string[];
};

function readConfig(raw: unknown): CampaignConfig {
  const c = (raw ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof c[k] === "string" ? (c[k] as string) : undefined);
  const arr = (k: string) =>
    Array.isArray(c[k])
      ? (c[k] as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
  return {
    subtitle: str("subtitle"),
    couponCode: str("couponCode"),
    productSlug: str("productSlug"),
    productSlugs: arr("productSlugs"),
    benefits: arr("benefits"),
  };
}

function isLive(c: { isActive: boolean; startsAt: Date | null; endsAt: Date | null }): boolean {
  const now = Date.now();
  if (!c.isActive) return false;
  if (c.startsAt && c.startsAt.getTime() > now) return false;
  if (c.endsAt && c.endsAt.getTime() < now) return false;
  return true;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Not found" };
  return {
    title: campaign.title,
    description: readConfig(campaign.config).subtitle ?? campaign.title,
    alternates: { canonical: `/campaigns/${campaign.slug}` },
  };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign || !isLive(campaign)) notFound();

  const config = readConfig(campaign.config);

  if (campaign.type === "landing") {
    return <LandingCampaign campaign={campaign} config={config} />;
  }
  return <FlashCampaign campaign={campaign} config={config} />;
}

// ── Flash sale ────────────────────────────────────────────────────────────────
async function FlashCampaign({
  campaign,
  config,
}: {
  campaign: { title: string; endsAt: Date | null };
  config: CampaignConfig;
}) {
  const products =
    config.productSlugs && config.productSlugs.length > 0
      ? await getProductCardsBySlugs(config.productSlugs)
      : await getFeaturedProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="from-brand via-brand to-brand-hover relative overflow-hidden rounded-3xl bg-linear-to-br px-6 py-12 text-white shadow-lg sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-white/15 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25 backdrop-blur">
            <Sparkles className="size-3.5" /> Flash sale
          </span>
          <h1 className="font-heading mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
            {campaign.title}
          </h1>
          {config.subtitle && <p className="mt-3 max-w-xl text-white/90">{config.subtitle}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {campaign.endsAt && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white/90">Ends in</span>
                <Countdown to={campaign.endsAt.toISOString()} />
              </div>
            )}
            {config.couponCode && (
              <span className="text-brand inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow">
                <Tag className="size-4" /> Use code {config.couponCode}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mt-10">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="text-muted-foreground py-16 text-center">
            Products for this sale are coming soon.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Single-product landing (FB-ad funnel) ─────────────────────────────────────
async function LandingCampaign({
  campaign,
  config,
}: {
  campaign: { title: string };
  config: CampaignConfig;
}) {
  if (!config.productSlug) notFound();
  const [detail, zones] = await Promise.all([
    getProductDetailBySlug(config.productSlug),
    listActiveZones(),
  ]);
  if (!detail) notFound();

  const { product } = detail;
  const image = product.images[0]?.url ?? product.variants[0]?.images[0]?.url ?? null;
  const prices = product.variants.map((v) => v.price ?? product.basePrice);
  const fromPrice = prices.length ? Math.min(...prices) : product.basePrice;

  const variants: LandingVariant[] = product.variants.map((v) => ({
    id: v.id,
    label: [v.color, v.size].filter(Boolean).join(" / ") || "Standard",
    price: v.price ?? product.basePrice,
    stock: v.stock,
  }));

  const benefits = config.benefits?.length
    ? config.benefits
    : ["Cash on delivery", "Nationwide delivery", "7-day easy returns"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="bg-muted relative aspect-square overflow-hidden rounded-3xl border">
            <ProductImage
              src={image}
              alt={product.title}
              priority
              sizes="(max-width:1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <h1 className="font-heading mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {campaign.title}
          </h1>
          <p className="text-muted-foreground mt-1">{product.title}</p>
          <p className="font-heading text-brand mt-3 text-2xl font-extrabold">
            From {formatBdt(fromPrice)}
          </p>
          {config.subtitle && <p className="mt-3 text-balance">{config.subtitle}</p>}
          <ul className="mt-5 space-y-2">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <BadgeCheck className="text-success size-4 shrink-0" /> {b}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <Truck className="text-brand size-4" /> Order now, pay when it arrives.
          </p>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <LandingOrderForm
            variants={variants}
            zones={zones.map((z) => ({
              id: z.id,
              name: z.name,
              fee: z.fee,
              freeShipThreshold: z.freeShipThreshold,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
