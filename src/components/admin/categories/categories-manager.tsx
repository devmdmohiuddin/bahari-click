"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, FolderTree, Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  CategoryDialog,
  type CategoryDialogState,
} from "@/components/admin/categories/category-dialog";
import { updateCategoryAction, updateSubcategoryAction } from "@/server/actions/catalog";
import type { AdminCategory } from "@/server/services/category";

export function CategoriesManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<CategoryDialogState | null>(null);
  const [busy, setBusy] = useState(false);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  async function toggleCategory(id: string, isActive: boolean) {
    const res = await updateCategoryAction(id, { isActive });
    if (!res.ok) return toast.error("Could not update", res.error.message);
    router.refresh();
  }

  async function toggleSubcategory(id: string, isActive: boolean) {
    const res = await updateSubcategoryAction(id, { isActive });
    if (!res.ok) return toast.error("Could not update", res.error.message);
    router.refresh();
  }

  // Reorder by rewriting sortOrder to match the new positions (few rows, safe).
  async function reorderCategories(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= categories.length || busy) return;
    setBusy(true);
    const order = [...categories];
    [order[index], order[target]] = [order[target], order[index]];
    const res = await Promise.all(
      order.map((c, i) => updateCategoryAction(c.id, { sortOrder: i })),
    );
    setBusy(false);
    if (res.some((r) => !r.ok)) return toast.error("Could not reorder");
    router.refresh();
  }

  async function reorderSubcategories(
    subs: AdminCategory["subcategories"],
    index: number,
    dir: -1 | 1,
  ) {
    const target = index + dir;
    if (target < 0 || target >= subs.length || busy) return;
    setBusy(true);
    const order = [...subs];
    [order[index], order[target]] = [order[target], order[index]];
    const res = await Promise.all(
      order.map((s, i) => updateSubcategoryAction(s.id, { sortOrder: i })),
    );
    setBusy(false);
    if (res.some((r) => !r.ok)) return toast.error("Could not reorder");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Categories"
        description="Organize the storefront into categories and subcategories."
      >
        <Button onClick={() => setDialog({ kind: "category", mode: "create" })}>
          <Plus />
          New category
        </Button>
      </PageHeader>

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create your first category to start grouping products."
        >
          <Button onClick={() => setDialog({ kind: "category", mode: "create" })}>
            <Plus />
            New category
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {categories.map((category, ci) => (
            <Card key={category.id} className="gap-0 overflow-hidden py-0">
              <div className="flex flex-wrap items-center gap-3 border-b p-4">
                <div className="flex flex-col">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-1">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => reorderCategories(ci, -1)}
                      disabled={ci === 0 || busy}
                      aria-label="Move up"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => reorderCategories(ci, 1)}
                      disabled={ci === categories.length - 1 || busy}
                      aria-label="Move down"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{category.name}</h3>
                    {!category.isActive && <Badge variant="secondary">Hidden</Badge>}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    /{category.slug} · {category.subcategories.length} subcategor
                    {category.subcategories.length === 1 ? "y" : "ies"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Switch
                    checked={category.isActive}
                    onCheckedChange={(v) => toggleCategory(category.id, v)}
                    aria-label="Toggle active"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setDialog({
                        kind: "category",
                        mode: "edit",
                        id: category.id,
                        values: {
                          name: category.name,
                          slug: category.slug,
                          image: category.image,
                          isActive: category.isActive,
                        },
                      })
                    }
                    aria-label="Edit category"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDialog({ kind: "subcategory", mode: "create", categoryId: category.id })
                    }
                  >
                    <Plus />
                    Subcategory
                  </Button>
                </div>
              </div>

              {category.subcategories.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.subcategories.map((sub, si) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              onClick={() => reorderSubcategories(category.subcategories, si, -1)}
                              disabled={si === 0 || busy}
                              aria-label="Move up"
                            >
                              <ChevronUp className="size-4" />
                            </button>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              onClick={() => reorderSubcategories(category.subcategories, si, 1)}
                              disabled={si === category.subcategories.length - 1 || busy}
                              aria-label="Move down"
                            >
                              <ChevronDown className="size-4" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{sub.name}</TableCell>
                        <TableCell className="text-muted-foreground">/{sub.slug}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {sub._count.products}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={sub.isActive}
                              onCheckedChange={(v) => toggleSubcategory(sub.id, v)}
                              aria-label="Toggle active"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setDialog({
                                kind: "subcategory",
                                mode: "edit",
                                id: sub.id,
                                categoryId: category.id,
                                values: {
                                  name: sub.name,
                                  slug: sub.slug,
                                  image: sub.image,
                                  isActive: sub.isActive,
                                },
                              })
                            }
                            aria-label="Edit subcategory"
                          >
                            <Pencil />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          ))}
        </div>
      )}

      <CategoryDialog state={dialog} categories={categoryOptions} onClose={() => setDialog(null)} />
    </div>
  );
}
