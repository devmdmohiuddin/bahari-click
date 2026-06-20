import { listPreOrders } from "@/server/services/preorder";
import { PreOrdersTable } from "@/components/admin/preorders/preorders-table";

export const dynamic = "force-dynamic";

export default async function PreOrdersPage() {
  const requests = await listPreOrders();
  return <PreOrdersTable requests={requests} />;
}
