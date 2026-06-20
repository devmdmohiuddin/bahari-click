import { BarChart3, Boxes, Package, ShoppingCart, TrendingUp, Truck } from "lucide-react";

import { getSession } from "@/server/auth-session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const KPIS = [
  { label: "Today's sales", value: "৳ —", icon: TrendingUp },
  { label: "Open orders", value: "—", icon: ShoppingCart },
  { label: "Awaiting dispatch", value: "—", icon: Truck },
  { label: "Low-stock items", value: "—", icon: Boxes },
];

const NEXT_UP = [
  {
    icon: Package,
    title: "Catalog management",
    description: "Categories, the product editor with variants, and image galleries.",
  },
  {
    icon: ShoppingCart,
    title: "Order operations",
    description: "Order list, detail view, fraud verdicts, and confirm/cancel actions.",
  },
  {
    icon: Truck,
    title: "Courier fulfillment",
    description: "One-click dispatch, tracking sync, and per-order SMS visibility.",
  },
  {
    icon: BarChart3,
    title: "Dashboard & reports",
    description: "Live sales, COD collected, top products, and low-stock widgets.",
  },
];

export default async function AdminDashboard() {
  const session = await getSession();
  const firstName = session?.user.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, {firstName} 👋</h2>
        <p className="text-muted-foreground">
          The admin foundation is live. Operational tooling lands phase by phase.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => {
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
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-muted-foreground mt-1 text-xs">Connected in a later phase</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Coming up next</CardTitle>
            <Badge variant="secondary">Roadmap</Badge>
          </div>
          <CardDescription>
            Each area ships as its own sprint, fully wired to the backend already in place.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {NEXT_UP.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-muted/40 flex items-start gap-3 rounded-lg border p-4"
              >
                <span className="bg-background flex size-9 shrink-0 items-center justify-center rounded-lg border">
                  <Icon className="size-4" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
