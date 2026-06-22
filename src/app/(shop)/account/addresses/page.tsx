import { getSession } from "@/server/auth-session";
import { listAddresses } from "@/server/services/address";
import { listActiveZones } from "@/server/services/shipping";
import { AddressManager } from "@/components/storefront/address-manager";

export default async function AddressesPage() {
  const session = await getSession();
  const [addresses, zones] = await Promise.all([
    session ? listAddresses(session.user.id) : Promise.resolve([]),
    listActiveZones(),
  ]);

  return (
    <AddressManager
      addresses={addresses.map((a) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        line1: a.line1,
        area: a.area,
        city: a.city,
        zoneId: a.zoneId,
        note: a.note,
        isDefault: a.isDefault,
      }))}
      zones={zones.map((z) => ({ id: z.id, name: z.name }))}
    />
  );
}
