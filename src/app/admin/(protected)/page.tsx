import Link from "next/link";
import { Boxes, Package, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

import { formatBdt } from "@/lib/format";
import { STATUS_BADGE, STATUS_LABEL, type OrderStatusValue } from "@/lib/orders";
import { getDashboardForDays } from "@/server/services/reports";
import { getSession } from "@/server/auth-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminDashboard({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const range = sp.range === "7" ? 7 : 30;
  const [session, data] = await Promise.all([getSession(), getDashboardForDays(range)]);
  const firstName = session?.user.name?.split(" ")[0] || "there";

  const today = data.salesByPeriod.find((p) => p.day === data.todayIso);
  const maxRevenue = Math.max(1, ...data.salesByPeriod.map((p) => p.revenue));

  const kpis = [
    { label: "Today's sales", value: formatBdt(today?.revenue ?? 0), icon: TrendingUp },
    { label: `Revenue (${range}d)`, value: formatBdt(data.revenue), icon: Wallet },
    {
      label: `COD collected (${range}d)`,
      value: formatBdt(data.codCollected.total),
      icon: ShoppingCart,
    },
    { label: "Low-stock items", value: String(data.lowStock.length), icon: Boxes },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {firstName} 👋</h2>
          <p className="text-muted-foreground">
            {data.deliveredOrders} delivered order{data.deliveredOrders === 1 ? "" : "s"} in the
            last {range} days.
          </p>
        </div>
        <div className="bg-muted flex w-fit items-center gap-1 rounded-full p-1">
          {[7, 30].map((r) => (
            <Button
              key={r}
              asChild
              size="sm"
              variant={range === r ? "default" : "ghost"}
              className="rounded-full"
            >
              <Link href={`/admin?range=${r}`}>{r} days</Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardDescription>{kpi.label}</CardDescription>
                <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg">
                  <Icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tracking-tight tabular-nums">{kpi.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivered sales</CardTitle>
            <CardDescription>Daily revenue over the last {range} days.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.salesByPeriod.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No delivered orders in this window yet.
              </p>
            ) : (
              <div className="flex h-40 items-end gap-1">
                {data.salesByPeriod.map((p) => (
                  <div
                    key={p.day}
                    className="bg-brand/80 hover:bg-brand min-h-1 flex-1 rounded-t transition-colors"
                    style={{ height: `${(p.revenue / maxRevenue) * 100}%` }}
                    title={`${p.day}: ${formatBdt(p.revenue)} (${p.orders} orders)`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders by status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.ordersByStatus.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            ) : (
              data.ordersByStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <Badge variant={STATUS_BADGE[s.status as OrderStatusValue]}>
                    {STATUS_LABEL[s.status as OrderStatusValue]}
                  </Badge>
                  <span className="text-sm tabular-nums">{s.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>By units delivered.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sales yet.</p>
            ) : (
              <ol className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <li key={p.productId} className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground w-4 text-right tabular-nums">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate font-medium">{p.title}</span>
                    <span className="text-muted-foreground tabular-nums">{p.units} sold</span>
                    <span className="w-20 text-right tabular-nums">{formatBdt(p.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Low stock</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/inventory">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.lowStock.length === 0 ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Package className="size-4" /> Everything is well stocked.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.lowStock.slice(0, 8).map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link
                      href={`/admin/products/${v.product.id}/edit`}
                      className="hover:text-brand min-w-0 flex-1 truncate"
                    >
                      {v.product.title}
                      <span className="text-muted-foreground">
                        {" "}
                        · {[v.color, v.size].filter(Boolean).join(" / ") || "Default"}
                      </span>
                    </Link>
                    <Badge variant={v.stock === 0 ? "destructive" : "warning"}>
                      {v.stock === 0 ? "Out" : v.stock}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
