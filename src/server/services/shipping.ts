import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { cacheTags, revalidateTags } from "@/lib/cache";
import { notFound } from "@/lib/errors";
import { shippingZoneInputSchema, type ShippingZoneInput } from "@/server/validators/shipping";

// Shipping zones: flat per-zone COD fee with an optional free-ship threshold.

/** Active zones for the checkout selector. Cached + tagged. */
export const listActiveZones = unstable_cache(
  async () =>
    db.shippingZone.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ["shipping-active-zones"],
  { tags: [cacheTags.shippingZones] },
);

export async function listAllZones() {
  return db.shippingZone.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

/**
 * Resolve the delivery fee for a zone given the order subtotal. The fee is
 * waived when a free-ship threshold is set and the subtotal reaches it.
 * Returns the active zone too so callers can snapshot it onto the order.
 */
export async function resolveShippingFee(zoneId: string, subtotal: number) {
  const zone = await db.shippingZone.findUnique({ where: { id: zoneId } });
  if (!zone || !zone.isActive) throw notFound("Shipping zone not found");

  const fee = zone.freeShipThreshold !== null && subtotal >= zone.freeShipThreshold ? 0 : zone.fee;

  return { zone, fee };
}

export async function createZone(input: ShippingZoneInput) {
  const data = shippingZoneInputSchema.parse(input);
  const zone = await db.shippingZone.create({
    data: {
      name: data.name,
      fee: data.fee,
      freeShipThreshold: data.freeShipThreshold ?? null,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
  });
  revalidateTags(cacheTags.shippingZones);
  return zone;
}

export async function updateZone(id: string, input: Partial<ShippingZoneInput>) {
  const existing = await db.shippingZone.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Shipping zone not found");

  const data = shippingZoneInputSchema.partial().parse(input);
  const zone = await db.shippingZone.update({
    where: { id },
    data: {
      name: data.name,
      fee: data.fee,
      freeShipThreshold: data.freeShipThreshold,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
  });
  revalidateTags(cacheTags.shippingZones);
  return zone;
}
