import { listInventory } from "@/server/services/stock";
import { InventoryManager } from "@/components/admin/inventory/inventory-manager";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const inventory = await listInventory();
  return <InventoryManager inventory={inventory} />;
}
