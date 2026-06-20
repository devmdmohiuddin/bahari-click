"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { createZone, updateZone } from "@/server/services/shipping";
import { shippingZoneInputSchema, type ShippingZoneInput } from "@/server/validators/shipping";

// Admin shipping-zone CRUD: requireAdmin → service → audit → Result.

export async function createZoneAction(input: ShippingZoneInput): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const zone = await createZone(shippingZoneInputSchema.parse(input));
    await recordAudit({
      adminId: session.user.id,
      action: "shipping_zone.create",
      entity: "ShippingZone",
      entityId: zone.id,
      diff: { name: zone.name, fee: zone.fee },
    });
    return ok({ id: zone.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function updateZoneAction(
  id: string,
  input: Partial<ShippingZoneInput>,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const zone = await updateZone(id, input);
    await recordAudit({
      adminId: session.user.id,
      action: "shipping_zone.update",
      entity: "ShippingZone",
      entityId: zone.id,
      diff: input,
    });
    return ok({ id: zone.id });
  } catch (error) {
    return toResult(error);
  }
}
