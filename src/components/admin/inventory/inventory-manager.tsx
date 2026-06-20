"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Boxes, Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import {
  AdjustStockDialog,
  type AdjustTarget,
} from "@/components/admin/inventory/adjust-stock-dialog";
import type { InventoryRow } from "@/server/services/stock";

// Mirror of LOW_STOCK_THRESHOLD (server) for client-side display.
const LOW_STOCK = 5;

function variantLabel(v: InventoryRow): string {
  return [v.color, v.size].filter(Boolean).join(" · ") || "Default";
}

export function InventoryManager({ inventory }: { inventory: InventoryRow[] }) {
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [target, setTarget] = useState<AdjustTarget | null>(null);

  const lowCount = useMemo(
    () => inventory.filter((v) => v.isActive && v.stock <= LOW_STOCK).length,
    [inventory],
  );
  const outCount = useMemo(
    () => inventory.filter((v) => v.isActive && v.stock === 0).length,
    [inventory],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.filter((v) => {
      if (lowOnly && !(v.isActive && v.stock <= LOW_STOCK)) return false;
      if (!q) return true;
      return (
        v.product.title.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        variantLabel(v).toLowerCase().includes(q)
      );
    });
  }, [inventory, query, lowOnly]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock levels per variant with audited adjustments."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total variants</p>
              <p className="text-2xl font-bold tabular-nums">{inventory.length}</p>
            </div>
            <Boxes className="text-muted-foreground size-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Low stock (≤{LOW_STOCK})</p>
              <p className="text-warning text-2xl font-bold tabular-nums">{lowCount}</p>
            </div>
            <AlertTriangle className="text-warning size-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Out of stock</p>
              <p className="text-destructive text-2xl font-bold tabular-nums">{outCount}</p>
            </div>
            <AlertTriangle className="text-destructive size-5" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, SKU, or variant…"
            className="pl-9"
          />
        </div>
        <Button variant={lowOnly ? "default" : "outline"} onClick={() => setLowOnly((v) => !v)}>
          <SlidersHorizontal />
          Low stock only
        </Button>
      </div>

      {inventory.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No variants yet"
          description="Add products with variants to track inventory here."
        >
          <Button asChild>
            <Link href="/admin/products/new">New product</Link>
          </Button>
        </EmptyState>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-px"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Link
                      href={`/admin/products/${v.product.id}/edit`}
                      className="hover:text-brand font-medium"
                    >
                      {v.product.title}
                    </Link>
                  </TableCell>
                  <TableCell>{variantLabel(v)}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{v.sku}</TableCell>
                  <TableCell className="text-right">
                    {v.stock === 0 ? (
                      <Badge variant="destructive">Out</Badge>
                    ) : v.stock <= LOW_STOCK ? (
                      <Badge variant="warning">{v.stock}</Badge>
                    ) : (
                      <span className="tabular-nums">{v.stock}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {v.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTarget({
                          id: v.id,
                          label: `${v.product.title} — ${variantLabel(v)}`,
                          stock: v.stock,
                        })
                      }
                    >
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                    No variants match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <AdjustStockDialog target={target} onClose={() => setTarget(null)} />
    </div>
  );
}
