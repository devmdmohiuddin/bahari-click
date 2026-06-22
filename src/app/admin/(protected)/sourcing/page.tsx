import { listProductsAdmin } from "@/server/services/product";
import { getProfitReport, listRecentSourcing } from "@/server/services/sourcing";
import { SourcingView } from "@/components/admin/sourcing/sourcing-view";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export default async function SourcingPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [report, records, products] = await Promise.all([
    getProfitReport(str(sp.from), str(sp.to)),
    listRecentSourcing(),
    listProductsAdmin(),
  ]);

  const productOptions = products.map((p) => ({ id: p.id, title: p.title }));

  return <SourcingView report={report} records={records} products={productOptions} />;
}
