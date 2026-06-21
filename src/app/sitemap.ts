import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { listActiveTree } from "@/server/services/category";

// Dynamic sitemap: static pages + active categories/subcategories + published
// products (S6.2). Regenerated periodically.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, tree] = await Promise.all([
    db.product.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    listActiveTree(),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/track"), lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = tree.flatMap((c) => [
    {
      url: absoluteUrl(`/c/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...c.subcategories.map((s) => ({
      url: absoluteUrl(`/c/${c.slug}/${s.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ]);

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/p/${p.slug}`),
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
