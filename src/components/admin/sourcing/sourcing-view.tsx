"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBdt, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { ReportFilters } from "@/components/admin/reports/report-filters";
import { createSourcingRecordAction } from "@/server/actions/sourcing";
import type { getProfitReport, listRecentSourcing } from "@/server/services/sourcing";

type Report = Awaited<ReturnType<typeof getProfitReport>>;
type SourcingRecord = Awaited<ReturnType<typeof listRecentSourcing>>[number];
type ProductOption = { id: string; title: string };

function RecordBatchForm({
  products,
  onClose,
}: {
  products: ProductOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierUrl, setSupplierUrl] = useState("");
  const [unitCostCNY, setUnitCostCNY] = useState("");
  const [shippingCost, setShippingCost] = useState("0");
  const [batchQty, setBatchQty] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return toast.error("Select a product");
    setSaving(true);
    const res = await createSourcingRecordAction({
      productId,
      supplierName,
      supplierUrl: supplierUrl.trim() || "",
      unitCostCNY: Number(unitCostCNY),
      shippingCost: Number(shippingCost) || 0,
      batchQty: Number(batchQty),
    });
    setSaving(false);
    if (!res.ok) return toast.error("Could not save", res.error.message);
    toast.success(
      "Sourcing batch recorded",
      `Landed cost ${formatBdt(res.data.landedCostBDT)}/unit`,
    );
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Record sourcing batch</DialogTitle>
        <DialogDescription>
          Landed cost per unit = CNY cost × rate + batch shipping ÷ quantity.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="product">Product</Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger id="product">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. 1688 / Taobao seller"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">Supplier URL (optional)</Label>
          <Input
            id="url"
            value={supplierUrl}
            onChange={(e) => setSupplierUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cny">Unit cost (¥)</Label>
          <Input
            id="cny"
            type="number"
            min={1}
            value={unitCostCNY}
            onChange={(e) => setUnitCostCNY(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ship">Batch shipping (৳)</Label>
          <Input
            id="ship"
            type="number"
            min={0}
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qty">Batch qty</Label>
          <Input
            id="qty"
            type="number"
            min={1}
            value={batchQty}
            onChange={(e) => setBatchQty(e.target.value)}
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Record batch
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SourcingView({
  report,
  records,
  products,
}: {
  report: Report;
  records: SourcingRecord[];
  products: ProductOption[];
}) {
  const [open, setOpen] = useState(false);
  const { totals } = report;

  const kpis = [
    { label: "Revenue", value: formatBdt(totals.revenue) },
    { label: "Landed cost", value: formatBdt(totals.cost) },
    { label: "Profit", value: formatBdt(totals.profit), accent: true },
    { label: "Margin", value: `${totals.marginPct}%` },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Sourcing & profit"
        description="Landed cost per batch and profit on delivered sales."
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle />
              Record batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            {open && <RecordBatchForm products={products} onClose={() => setOpen(false)} />}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <ReportFilters from={report.fromInput} to={report.toInput} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader>
              <CardDescription>{k.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-2xl font-bold tracking-tight tabular-nums",
                  k.accent && (totals.profit >= 0 ? "text-success" : "text-destructive"),
                )}
              >
                {k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profit by product */}
      <Card>
        <CardHeader>
          <CardTitle>Profit by product</CardTitle>
          <CardDescription>
            Delivered sales in range vs latest landed cost. Products without a sourcing record show
            zero cost.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Landed/unit</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                    No delivered sales in this range.
                  </TableCell>
                </TableRow>
              ) : (
                report.rows.map((r) => (
                  <TableRow key={r.productId}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.units}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBdt(r.revenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.landedUnitCost > 0 ? (
                        formatBdt(r.landedUnitCost)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBdt(r.cost)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        r.profit >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {formatBdt(r.profit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.marginPct}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent sourcing batches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent sourcing batches</CardTitle>
          <CardDescription>Latest recorded purchases.</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No sourcing records"
              description="Record a batch to track landed cost and profit margins."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Unit ¥</TableHead>
                  <TableHead className="text-right">Shipping</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Landed/unit</TableHead>
                  <TableHead>Purchased</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">{rec.product.title}</TableCell>
                    <TableCell>
                      {rec.supplierUrl ? (
                        <a
                          href={rec.supplierUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {rec.supplierName}
                        </a>
                      ) : (
                        rec.supplierName
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">¥{rec.unitCostCNY}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBdt(rec.shippingCost)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{rec.batchQty}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatBdt(rec.landedCostBDT)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(rec.purchasedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
