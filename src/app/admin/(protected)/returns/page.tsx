import { listReturns } from "@/server/services/returns";
import { ReturnsTable } from "@/components/admin/returns/returns-table";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const returns = await listReturns();
  return <ReturnsTable returns={returns} />;
}
