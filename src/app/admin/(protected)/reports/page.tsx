import { formatBdt, formatDate } from "@/lib/format";
import { STATUS_BADGE, STATUS_LABEL, type OrderStatusValue } from "@/lib/orders";
import { getReport } from "@/server/services/reports";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { ReportFilters } from "@/components/admin/reports/report-filters";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const data = await getReport(str(sp.from), str(sp.to));

  const kpis = [
    { label: "Revenue", value: formatBdt(data.revenue) },
    { label: "Delivered orders", value: String(data.deliveredOrders) },
    { label: "COD collected", value: formatBdt(data.codCollected.total) },
    { label: "Avg order value", value: formatBdt(data.avgOrderValue) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Reports" description="Sales and order analytics for a date range." />

      <ReportFilters from={data.fromInput} to={data.toInput} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader>
              <CardDescription>{k.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>Whole pipeline (all time).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ordersByStatus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.ordersByStatus.map((s) => (
                    <TableRow key={s.status}>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[s.status as OrderStatusValue]}>
                          {STATUS_LABEL[s.status as OrderStatusValue]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{s.count}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBdt(s.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>By units delivered in range.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                      No sales in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topProducts.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.units}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBdt(p.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Daily sales */}
      <Card>
        <CardHeader>
          <CardTitle>Daily delivered sales</CardTitle>
          <CardDescription>Revenue from delivered orders per day.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.salesByPeriod.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                    No delivered orders in this range.
                  </TableCell>
                </TableRow>
              ) : (
                [...data.salesByPeriod].reverse().map((p) => (
                  <TableRow key={p.day}>
                    <TableCell>{formatDate(p.day)}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.orders}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBdt(p.revenue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
