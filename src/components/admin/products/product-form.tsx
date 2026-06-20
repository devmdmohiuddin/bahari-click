"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { PageHeader } from "@/components/admin/page-header";
import { ImageGallery, imageUid, type ImageItem } from "@/components/admin/products/image-gallery";
import {
  createProductAction,
  setProductPublishedAction,
  updateProductAction,
} from "@/server/actions/catalog";
import type { AdminProductDetail } from "@/server/services/product";

export type SubcategoryOption = { id: string; label: string; group: string };

type VariantRow = {
  uid: string;
  color: string;
  size: string;
  sku: string;
  price: string;
  stock: string;
  isActive: boolean;
  images: ImageItem[];
};

type SpecRow = { uid: string; key: string; value: string };

let counter = 0;
const uid = () => `r${Date.now()}_${counter++}`;

function emptyVariant(): VariantRow {
  return {
    uid: uid(),
    color: "",
    size: "",
    sku: "",
    price: "",
    stock: "0",
    isActive: true,
    images: [],
  };
}

function toImageItems(images: { url: string; alt: string | null }[]): ImageItem[] {
  return images.map((i) => ({ uid: imageUid(), url: i.url, alt: i.alt ?? "" }));
}

function initVariants(product?: AdminProductDetail | null): VariantRow[] {
  if (!product || product.variants.length === 0) return [emptyVariant()];
  return product.variants.map((v) => ({
    uid: uid(),
    color: v.color ?? "",
    size: v.size ?? "",
    sku: v.sku,
    price: v.price?.toString() ?? "",
    stock: v.stock.toString(),
    isActive: v.isActive,
    images: toImageItems(v.images),
  }));
}

function initSpecs(product?: AdminProductDetail | null): SpecRow[] {
  if (!product) return [];
  return product.specs.map((s) => ({ uid: uid(), key: s.key, value: s.value }));
}

function parseList(input: string): string[] {
  return [
    ...new Set(
      input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

export function ProductForm({
  subcategoryOptions,
  product,
}: {
  subcategoryOptions: SubcategoryOption[];
  product?: AdminProductDetail | null;
}) {
  const router = useRouter();
  const isEdit = !!product;

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [subcategoryId, setSubcategoryId] = useState(product?.subcategoryId ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() ?? "");
  const [compareAt, setCompareAt] = useState(product?.compareAtPrice?.toString() ?? "");
  const [soldBoost, setSoldBoost] = useState(product?.soldCountBoost?.toString() ?? "0");
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);

  const [variants, setVariants] = useState<VariantRow[]>(() => initVariants(product));
  const [specs, setSpecs] = useState<SpecRow[]>(() => initSpecs(product));
  const [productImages, setProductImages] = useState<ImageItem[]>(() =>
    toImageItems(product?.images ?? []),
  );

  const [genColors, setGenColors] = useState("");
  const [genSizes, setGenSizes] = useState("");
  const [saving, setSaving] = useState(false);

  // Group subcategory options by parent category for the select.
  const groups = subcategoryOptions.reduce<Record<string, SubcategoryOption[]>>((acc, o) => {
    (acc[o.group] ??= []).push(o);
    return acc;
  }, {});

  function setVariant(uidv: string, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((r) => (r.uid === uidv ? { ...r, ...patch } : r)));
  }

  // Build the color × size matrix, preserving any already-entered cell data.
  function generateMatrix() {
    const colors = parseList(genColors);
    const sizes = parseList(genSizes);
    const combos: Array<{ color: string; size: string }> = [];
    if (colors.length && sizes.length) {
      for (const c of colors) for (const s of sizes) combos.push({ color: c, size: s });
    } else if (colors.length) {
      for (const c of colors) combos.push({ color: c, size: "" });
    } else if (sizes.length) {
      for (const s of sizes) combos.push({ color: "", size: s });
    }
    if (combos.length === 0) {
      toast.error("Enter at least one color or size");
      return;
    }
    const byKey = new Map(variants.map((v) => [`${v.color}|${v.size}`, v]));
    setVariants(
      combos.map(
        ({ color, size }) => byKey.get(`${color}|${size}`) ?? { ...emptyVariant(), color, size },
      ),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!subcategoryId) return toast.error("Select a subcategory");
    if (basePrice.trim() === "" || Number(basePrice) < 0)
      return toast.error("Enter a valid base price");

    // Guard duplicate color/size combos (DB enforces a unique constraint too).
    const seen = new Set<string>();
    for (const v of variants) {
      const key = `${v.color.trim().toLowerCase()}|${v.size.trim().toLowerCase()}`;
      if (seen.has(key)) {
        const label = `${v.color} ${v.size}`.trim() || "(blank)";
        return toast.error("Duplicate variant", label);
      }
      seen.add(key);
    }

    const variantPayload = variants.map((v) => ({
      sku: v.sku.trim() || undefined,
      color: v.color.trim() || null,
      size: v.size.trim() || null,
      price: v.price.trim() === "" ? null : Number(v.price),
      stock: v.stock.trim() === "" ? 0 : Number(v.stock),
      isActive: v.isActive,
      images: v.images.map((img, i) => ({ url: img.url, alt: img.alt || null, sortOrder: i })),
    }));

    const imagePayload = productImages.map((img, i) => ({
      url: img.url,
      alt: img.alt || null,
      sortOrder: i,
    }));

    const specPayload = specs
      .filter((s) => s.key.trim() && s.value.trim())
      .map((s, i) => ({ key: s.key.trim(), value: s.value.trim(), sortOrder: i }));

    const common = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      subcategoryId,
      description,
      basePrice: Number(basePrice),
      compareAtPrice: compareAt.trim() === "" ? null : Number(compareAt),
      isFeatured,
      soldCountBoost: soldBoost.trim() === "" ? 0 : Number(soldBoost),
      variants: variantPayload,
      images: imagePayload,
      specs: specPayload,
    };

    setSaving(true);
    try {
      let productId: string;
      let publishChanged = false;

      if (isEdit && product) {
        const res = await updateProductAction({ id: product.id, ...common });
        if (!res.ok) return toast.error("Could not save", res.error.message);
        productId = product.id;
        publishChanged = isPublished !== product.isPublished;
      } else {
        const res = await createProductAction(common);
        if (!res.ok) return toast.error("Could not create", res.error.message);
        productId = res.data.id;
        publishChanged = isPublished; // newly published if toggled on
      }

      if (publishChanged) {
        const pub = await setProductPublishedAction(productId, isPublished);
        if (!pub.ok) {
          toast.error("Saved, but publish failed", pub.error.message);
          router.push(`/admin/products/${productId}/edit`);
          router.refresh();
          return;
        }
      }

      toast.success(isEdit ? "Product saved" : "Product created");
      if (isEdit) {
        router.refresh();
      } else {
        router.push(`/admin/products/${productId}/edit`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={isEdit ? "Edit product" : "New product"}
        description={isEdit ? product?.title : "Add a product with variants and specifications."}
      >
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft />
            Back
          </Link>
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {isEdit ? "Save changes" : "Create product"}
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Basics */}
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Classic Leather Wallet"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Auto from title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(groups).map(([group, opts]) => (
                        <SelectGroup key={group}>
                          <SelectLabel>{group}</SelectLabel>
                          {opts.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the product. Basic HTML is supported."
                  className="min-h-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>
                Shared product gallery. The first image is the cover. Drag to reorder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageGallery value={productImages} onChange={setProductImages} />
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>
                Each color × size combination is a variant with its own stock, price, and SKU.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/40 grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1">
                  <Label htmlFor="gen-colors" className="text-xs">
                    Colors (comma-separated)
                  </Label>
                  <Input
                    id="gen-colors"
                    value={genColors}
                    onChange={(e) => setGenColors(e.target.value)}
                    placeholder="Black, Brown"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gen-sizes" className="text-xs">
                    Sizes (comma-separated)
                  </Label>
                  <Input
                    id="gen-sizes"
                    value={genSizes}
                    onChange={(e) => setGenSizes(e.target.value)}
                    placeholder="Standard, Slim"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="secondary" onClick={generateMatrix}>
                    <Sparkles />
                    Generate
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="w-28">Price (৳)</TableHead>
                    <TableHead className="w-24">Stock</TableHead>
                    <TableHead className="w-16 text-center">Active</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((v) => (
                    <TableRow key={v.uid}>
                      <TableCell>
                        <Input
                          value={v.color}
                          onChange={(e) => setVariant(v.uid, { color: e.target.value })}
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={v.size}
                          onChange={(e) => setVariant(v.uid, { size: e.target.value })}
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={v.sku}
                          onChange={(e) => setVariant(v.uid, { sku: e.target.value })}
                          placeholder="Auto"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={v.price}
                          onChange={(e) => setVariant(v.uid, { price: e.target.value })}
                          placeholder="Base"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) => setVariant(v.uid, { stock: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={v.isActive}
                            onCheckedChange={(c) => setVariant(v.uid, { isActive: c })}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={variants.length === 1}
                          onClick={() => setVariants((rows) => rows.filter((r) => r.uid !== v.uid))}
                          aria-label="Remove variant"
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariants((rows) => [...rows, emptyVariant()])}
              >
                <Plus />
                Add variant
              </Button>

              {/* Per-variant images — the first one drives the storefront variant switch. */}
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-medium">Variant images</p>
                <p className="text-muted-foreground -mt-3 text-xs">
                  Linked to a specific variant; shown when a shopper selects it.
                </p>
                {variants.map((v) => (
                  <div key={v.uid} className="bg-muted/30 rounded-lg border p-3">
                    <p className="mb-2 text-sm font-medium">
                      {[v.color, v.size].filter(Boolean).join(" · ") || "Default variant"}
                    </p>
                    <ImageGallery
                      compact
                      value={v.images}
                      onChange={(next) => setVariant(v.uid, { images: next })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Key/value details shown on the product page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {specs.length === 0 && (
                <p className="text-muted-foreground text-sm">No specifications added.</p>
              )}
              {specs.map((s) => (
                <div key={s.uid} className="flex gap-2">
                  <Input
                    value={s.key}
                    onChange={(e) =>
                      setSpecs((rows) =>
                        rows.map((r) => (r.uid === s.uid ? { ...r, key: e.target.value } : r)),
                      )
                    }
                    placeholder="Material"
                  />
                  <Input
                    value={s.value}
                    onChange={(e) =>
                      setSpecs((rows) =>
                        rows.map((r) => (r.uid === s.uid ? { ...r, value: e.target.value } : r)),
                      )
                    }
                    placeholder="PU Leather"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSpecs((rows) => rows.filter((r) => r.uid !== s.uid))}
                    aria-label="Remove specification"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSpecs((rows) => [...rows, { uid: uid(), key: "", value: "" }])}
              >
                <Plus />
                Add specification
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="published">Published</Label>
                  <p className="text-muted-foreground text-xs">Visible on the storefront.</p>
                </div>
                <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="featured">Featured</Label>
                  <p className="text-muted-foreground text-xs">Highlighted in featured lists.</p>
                </div>
                <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base price (৳)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min={0}
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAt">Compare-at price (৳)</Label>
                <Input
                  id="compareAt"
                  type="number"
                  min={0}
                  value={compareAt}
                  onChange={(e) => setCompareAt(e.target.value)}
                  placeholder="Optional strikethrough"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soldBoost">Sold-count boost</Label>
                <Input
                  id="soldBoost"
                  type="number"
                  min={0}
                  value={soldBoost}
                  onChange={(e) => setSoldBoost(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  Added to real sales for social proof.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
