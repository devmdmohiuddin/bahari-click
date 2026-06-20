"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Package, Pencil, Search } from "lucide-react";

import { formatBdt } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import {
  duplicateProductAction,
  setProductPublishedAction,
  updateProductAction,
} from "@/server/actions/catalog";
import type { AdminProductRow } from "@/server/services/product";

type StatusFilter = "all" | "published" | "draft";
type StockFilter = "all" | "in" | "low" | "out";

export function ProductsTable({ products }: { products: AdminProductRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<string>("all");
  const [stock, setStock] = useState<StockFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.categoryName))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q)) return false;
      if (status === "published" && !p.isPublished) return false;
      if (status === "draft" && p.isPublished) return false;
      if (category !== "all" && p.categoryName !== category) return false;
      if (stock === "in" && p.totalStock <= 0) return false;
      if (stock === "out" && p.totalStock > 0) return false;
      if (stock === "low" && !(p.totalStock > 0 && p.totalStock <= 5)) return false;
      return true;
    });
  }, [products, query, status, category, stock]);

  async function togglePublish(p: AdminProductRow, next: boolean) {
    setPendingId(p.id);
    const res = await setProductPublishedAction(p.id, next);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not update", res.error.message);
    toast.success(next ? "Published" : "Unpublished");
    router.refresh();
  }

  async function toggleFeatured(p: AdminProductRow, next: boolean) {
    setPendingId(p.id);
    const res = await updateProductAction({ id: p.id, isFeatured: next });
    setPendingId(null);
    if (!res.ok) return toast.error("Could not update", res.error.message);
    router.refresh();
  }

  async function duplicate(p: AdminProductRow) {
    setPendingId(p.id);
    const res = await duplicateProductAction(p.id);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not duplicate", res.error.message);
    toast.success("Product duplicated", "Created as a draft.");
    router.push(`/admin/products/${res.data.id}/edit`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Products" description="Create and manage your catalog.">
        <Button asChild>
          <Link href="/admin/products/new">
            <Package />
            New product
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-64">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stock} onValueChange={(v) => setStock(v as StockFilter)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any stock</SelectItem>
            <SelectItem value="in">In stock</SelectItem>
            <SelectItem value="low">Low (≤5)</SelectItem>
            <SelectItem value="out">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product with variants, pricing, and specifications."
        >
          <Button asChild>
            <Link href="/admin/products/new">
              <Package />
              New product
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="w-px"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} data-state={pendingId === p.id ? "selected" : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="bg-muted size-10 shrink-0 overflow-hidden rounded-md border">
                        {p.thumbnail && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnail} alt="" className="size-full object-cover" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="hover:text-brand font-medium"
                        >
                          {p.title}
                        </Link>
                        <div className="text-muted-foreground text-xs">
                          {p.variantCount} variant{p.variantCount === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.categoryName} › {p.subcategoryName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBdt(p.basePrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.totalStock === 0 ? (
                      <Badge variant="destructive">Out</Badge>
                    ) : p.totalStock <= 5 ? (
                      <Badge variant="warning">{p.totalStock}</Badge>
                    ) : (
                      p.totalStock
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={p.isPublished}
                        disabled={pendingId === p.id}
                        onCheckedChange={(v) => togglePublish(p, v)}
                        aria-label="Toggle published"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={p.isFeatured}
                        disabled={pendingId === p.id}
                        onCheckedChange={(v) => toggleFeatured(p, v)}
                        aria-label="Toggle featured"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" asChild aria-label="Edit">
                        <Link href={`/admin/products/${p.id}/edit`}>
                          <Pencil />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={pendingId === p.id}
                        onClick={() => duplicate(p)}
                        aria-label="Duplicate"
                      >
                        <Copy />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                    No products match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
