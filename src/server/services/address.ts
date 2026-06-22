import { db } from "@/lib/db";
import { forbidden, notFound } from "@/lib/errors";
import { addressInputSchema, type AddressInput } from "@/server/validators/address";

// Saved addresses for a logged-in customer. Exactly one may be the default.

export async function listAddresses(customerId: string) {
  return db.address.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(customerId: string, input: AddressInput) {
  const data = addressInputSchema.parse(input);

  return db.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { customerId } });
    const makeDefault = data.isDefault || count === 0; // first address is default
    if (makeDefault) {
      await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: {
        customerId,
        name: data.name,
        phone: data.phone,
        line1: data.line1,
        area: data.area ?? null,
        city: data.city ?? null,
        zoneId: data.zoneId ?? null,
        note: data.note ?? null,
        isDefault: makeDefault,
      },
    });
  });
}

async function assertOwned(customerId: string, addressId: string) {
  const address = await db.address.findUnique({
    where: { id: addressId },
    select: { customerId: true },
  });
  if (!address) throw notFound("Address not found");
  if (address.customerId !== customerId) throw forbidden("Not your address");
}

export async function updateAddress(
  customerId: string,
  addressId: string,
  input: Partial<AddressInput>,
) {
  await assertOwned(customerId, addressId);
  const data = addressInputSchema.partial().parse(input);

  return db.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
    }
    return tx.address.update({
      where: { id: addressId },
      data: {
        name: data.name,
        phone: data.phone,
        line1: data.line1,
        area: data.area,
        city: data.city,
        zoneId: data.zoneId,
        note: data.note,
        isDefault: data.isDefault,
      },
    });
  });
}

export async function setDefaultAddress(customerId: string, addressId: string) {
  await assertOwned(customerId, addressId);
  await db.$transaction([
    db.address.updateMany({ where: { customerId }, data: { isDefault: false } }),
    db.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
  return { id: addressId, isDefault: true };
}

export async function deleteAddress(customerId: string, addressId: string) {
  await assertOwned(customerId, addressId);
  await db.address.delete({ where: { id: addressId } });
  return { id: addressId };
}
