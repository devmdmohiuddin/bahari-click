import Link from "next/link";
import { Package, Plus } from "lucide-react";

import { formatBdt } from "@/lib/format";
import { listProductsAdmin } from "@/server/services/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listProductsAdmin();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Products" description="Create and manage your catalog.">
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus />
            New product
          </Link>
        </Button>
      </PageHeader>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product with variants, pricing, and specifications."
        >
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus />
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
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {p.variantCount} variant{p.variantCount === 1 ? "" : "s"}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.categoryName} › {p.subcategoryName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBdt(p.basePrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.totalStock}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={p.isPublished ? "success" : "secondary"}>
                        {p.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {p.isFeatured && <Badge variant="warning">Featured</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/products/${p.id}/edit`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
