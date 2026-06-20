import { db } from "@/lib/db";
import { cacheTags, revalidateTags } from "@/lib/cache";
import { conflict, notFound, validationError } from "@/lib/errors";
import { slugify, uniqueSlug } from "@/lib/slug";
import {
  productCreateSchema,
  productUpdateSchema,
  type ProductCreateInput,
  type ProductUpdateInput,
} from "@/server/validators/catalog";

// Full product read shape (used to read back after a write, and as the base for
// the Phase-2 PDP service).
const fullInclude = {
  subcategory: { include: { category: true } },
  variants: {
    orderBy: { createdAt: "asc" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  },
  images: { orderBy: { sortOrder: "asc" } },
  specs: { orderBy: { sortOrder: "asc" } },
} as const;

type VariantInput = NonNullable<ProductCreateInput["variants"]>[number];

/** Variant SKUs default to `<product-slug>-<n>`, which is globally unique because
 *  the product slug is unique. Explicit SKUs are validated for collisions. */
async function resolveSkus(slug: string, variants: VariantInput[], excludeProductId?: string) {
  const seen = new Set<string>();
  const resolved: string[] = [];

  for (let i = 0; i < variants.length; i++) {
    const provided = variants[i].sku?.trim();
    const sku = provided && provided.length > 0 ? provided : `${slug}-${i + 1}`;

    if (seen.has(sku)) throw validationError(`Duplicate SKU "${sku}" in variants`);
    seen.add(sku);

    if (provided) {
      const clash = await db.variant.findFirst({
        where: { sku, ...(excludeProductId ? { NOT: { productId: excludeProductId } } : {}) },
        select: { id: true },
      });
      if (clash) throw conflict(`SKU "${sku}" already exists`);
    }
    resolved.push(sku);
  }
  return resolved;
}

function variantCreateData(variants: VariantInput[], skus: string[]) {
  return variants.map((v, i) => ({
    sku: skus[i],
    color: v.color ?? null,
    size: v.size ?? null,
    price: v.price ?? null,
    stock: v.stock ?? 0,
    isActive: v.isActive ?? true,
    images: {
      create: (v.images ?? []).map((img) => ({
        url: img.url,
        alt: img.alt ?? null,
        sortOrder: img.sortOrder ?? 0,
      })),
    },
  }));
}

export async function createProduct(input: ProductCreateInput) {
  const data = productCreateSchema.parse(input);

  const subcategory = await db.subcategory.findUnique({
    where: { id: data.subcategoryId },
    select: { id: true },
  });
  if (!subcategory) throw notFound("Subcategory not found");

  const slug = await uniqueSlug(data.slug ?? data.title, async (s) =>
    Boolean(await db.product.findUnique({ where: { slug: s }, select: { id: true } })),
  );

  const skus = await resolveSkus(slug, data.variants);

  const product = await db.product.create({
    data: {
      title: data.title,
      slug,
      subcategoryId: data.subcategoryId,
      description: data.description ?? "",
      basePrice: data.basePrice,
      compareAtPrice: data.compareAtPrice ?? null,
      isFeatured: data.isFeatured ?? false,
      soldCountBoost: data.soldCountBoost ?? 0,
      images: {
        create: (data.images ?? []).map((img) => ({
          url: img.url,
          alt: img.alt ?? null,
          sortOrder: img.sortOrder ?? 0,
        })),
      },
      specs: {
        create: (data.specs ?? []).map((s) => ({
          key: s.key,
          value: s.value,
          sortOrder: s.sortOrder ?? 0,
        })),
      },
      variants: { create: variantCreateData(data.variants, skus) },
    },
    include: fullInclude,
  });

  revalidateTags(cacheTags.products);
  return product;
}

export async function updateProduct(input: ProductUpdateInput) {
  const data = productUpdateSchema.parse(input);

  const existing = await db.product.findUnique({
    where: { id: data.id },
    select: { id: true, slug: true },
  });
  if (!existing) throw notFound("Product not found");

  // Slug stays stable (preserves URLs) unless an explicit slug is provided.
  let slug = existing.slug;
  if (data.slug && data.slug !== existing.slug) {
    slug = await uniqueSlug(data.slug, async (s) =>
      Boolean(
        await db.product.findFirst({
          where: { slug: s, NOT: { id: existing.id } },
          select: { id: true },
        }),
      ),
    );
  }

  const product = await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        slug,
        subcategoryId: data.subcategoryId,
        description: data.description,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice,
        isFeatured: data.isFeatured,
        soldCountBoost: data.soldCountBoost,
      },
    });

    // Provided collections replace the existing set.
    if (data.images) {
      await tx.productImage.deleteMany({ where: { productId: existing.id } });
      if (data.images.length) {
        await tx.productImage.createMany({
          data: data.images.map((img) => ({
            productId: existing.id,
            url: img.url,
            alt: img.alt ?? null,
            sortOrder: img.sortOrder ?? 0,
          })),
        });
      }
    }

    if (data.specs) {
      await tx.specification.deleteMany({ where: { productId: existing.id } });
      if (data.specs.length) {
        await tx.specification.createMany({
          data: data.specs.map((s) => ({
            productId: existing.id,
            key: s.key,
            value: s.value,
            sortOrder: s.sortOrder ?? 0,
          })),
        });
      }
    }

    if (data.variants) {
      const skus = await resolveSkus(slug, data.variants, existing.id);
      // Cascade deletes variant images.
      await tx.variant.deleteMany({ where: { productId: existing.id } });
      for (const v of variantCreateData(data.variants, skus)) {
        await tx.variant.create({ data: { productId: existing.id, ...v } });
      }
    }

    return tx.product.findUniqueOrThrow({ where: { id: existing.id }, include: fullInclude });
  });

  revalidateTags(cacheTags.products, cacheTags.product(existing.id), cacheTags.productSlug(slug));
  return product;
}

/** Clone a product as an unpublished draft. SKUs regenerate; titles get "(Copy)". */
export async function duplicateProduct(id: string) {
  const p = await db.product.findUnique({ where: { id }, include: fullInclude });
  if (!p) throw notFound("Product not found");

  return createProduct({
    title: `${p.title} (Copy)`,
    subcategoryId: p.subcategoryId,
    description: p.description,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    isFeatured: false,
    soldCountBoost: p.soldCountBoost,
    // Drop SKUs so they regenerate uniquely from the new slug.
    variants: p.variants.map((v) => ({
      color: v.color,
      size: v.size,
      price: v.price,
      stock: v.stock,
      isActive: v.isActive,
      images: v.images.map((im) => ({ url: im.url, alt: im.alt, sortOrder: im.sortOrder })),
    })),
    images: p.images.map((im) => ({ url: im.url, alt: im.alt, sortOrder: im.sortOrder })),
    specs: p.specs.map((s) => ({ key: s.key, value: s.value, sortOrder: s.sortOrder })),
  });
}

/** Publish/unpublish. Publishing requires at least one active, in-stock-capable variant. */
export async function setProductPublished(id: string, isPublished: boolean) {
  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, slug: true, variants: { where: { isActive: true }, select: { id: true } } },
  });
  if (!product) throw notFound("Product not found");

  if (isPublished && product.variants.length === 0) {
    throw validationError("Cannot publish a product with no active variants");
  }

  const updated = await db.product.update({ where: { id }, data: { isPublished } });
  revalidateTags(cacheTags.products, cacheTags.product(id), cacheTags.productSlug(product.slug));
  return updated;
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getProductById(id: string) {
  const product = await db.product.findUnique({ where: { id }, include: fullInclude });
  return product ? withDisplaySold(product) : null;
}

export type AdminProductDetail = NonNullable<Awaited<ReturnType<typeof getProductById>>>;

/** Admin product list — all products (incl. unpublished) with rollups for the table. */
export async function listProductsAdmin() {
  const rows = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subcategory: { include: { category: true } },
      variants: { select: { stock: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });

  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    basePrice: p.basePrice,
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    categoryName: p.subcategory.category.name,
    subcategoryName: p.subcategory.name,
    variantCount: p.variants.length,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    thumbnail: p.images[0]?.url ?? null,
    createdAt: p.createdAt,
  }));
}

export type AdminProductRow = Awaited<ReturnType<typeof listProductsAdmin>>[number];

export async function getProductBySlug(slug: string) {
  const product = await db.product.findUnique({ where: { slug }, include: fullInclude });
  return product ? withDisplaySold(product) : null;
}

/** Attach the display sold count (real + boost) used across storefront UI. */
export function withDisplaySold<T extends { soldCountReal: number; soldCountBoost: number }>(
  product: T,
): T & { soldCountDisplay: number } {
  return { ...product, soldCountDisplay: product.soldCountReal + product.soldCountBoost };
}

// Re-exported so callers can build slugs consistently (e.g. preview links).
export { slugify };
