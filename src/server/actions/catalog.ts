"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import {
  createCategory,
  createSubcategory,
  updateCategory,
  updateSubcategory,
} from "@/server/services/category";
import {
  createProduct,
  duplicateProduct,
  setProductPublished,
  updateProduct,
} from "@/server/services/product";
import type {
  CategoryInput,
  ProductCreateInput,
  ProductUpdateInput,
  SubcategoryInput,
} from "@/server/validators/catalog";

// Thin admin actions: requireAdmin → service (validates) → audit → typed Result.

export async function createCategoryAction(input: CategoryInput): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const category = await createCategory(input);
    await recordAudit({
      adminId: session.user.id,
      action: "category.create",
      entity: "Category",
      entityId: category.id,
      diff: { name: category.name, slug: category.slug },
    });
    return ok({ id: category.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function updateCategoryAction(
  id: string,
  input: Partial<CategoryInput>,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const category = await updateCategory(id, input);
    await recordAudit({
      adminId: session.user.id,
      action: "category.update",
      entity: "Category",
      entityId: category.id,
      diff: input,
    });
    return ok({ id: category.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function createSubcategoryAction(
  input: SubcategoryInput,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const subcategory = await createSubcategory(input);
    await recordAudit({
      adminId: session.user.id,
      action: "subcategory.create",
      entity: "Subcategory",
      entityId: subcategory.id,
      diff: { name: subcategory.name, slug: subcategory.slug },
    });
    return ok({ id: subcategory.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function updateSubcategoryAction(
  id: string,
  input: Partial<SubcategoryInput>,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const subcategory = await updateSubcategory(id, input);
    await recordAudit({
      adminId: session.user.id,
      action: "subcategory.update",
      entity: "Subcategory",
      entityId: subcategory.id,
      diff: input,
    });
    return ok({ id: subcategory.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function createProductAction(
  input: ProductCreateInput,
): Promise<Result<{ id: string; slug: string }>> {
  try {
    const session = await requireAdmin();
    const product = await createProduct(input);
    await recordAudit({
      adminId: session.user.id,
      action: "product.create",
      entity: "Product",
      entityId: product.id,
      diff: { title: product.title, slug: product.slug, variants: product.variants.length },
    });
    return ok({ id: product.id, slug: product.slug });
  } catch (error) {
    return toResult(error);
  }
}

export async function updateProductAction(
  input: ProductUpdateInput,
): Promise<Result<{ id: string; slug: string }>> {
  try {
    const session = await requireAdmin();
    const product = await updateProduct(input);
    await recordAudit({
      adminId: session.user.id,
      action: "product.update",
      entity: "Product",
      entityId: product.id,
      diff: { id: input.id },
    });
    return ok({ id: product.id, slug: product.slug });
  } catch (error) {
    return toResult(error);
  }
}

export async function duplicateProductAction(
  id: string,
): Promise<Result<{ id: string; slug: string }>> {
  try {
    const session = await requireAdmin();
    const product = await duplicateProduct(id);
    await recordAudit({
      adminId: session.user.id,
      action: "product.duplicate",
      entity: "Product",
      entityId: product.id,
      diff: { sourceId: id, slug: product.slug },
    });
    return ok({ id: product.id, slug: product.slug });
  } catch (error) {
    return toResult(error);
  }
}

export async function setProductPublishedAction(
  id: string,
  isPublished: boolean,
): Promise<Result<{ id: string; isPublished: boolean }>> {
  try {
    const session = await requireAdmin();
    const product = await setProductPublished(id, isPublished);
    await recordAudit({
      adminId: session.user.id,
      action: isPublished ? "product.publish" : "product.unpublish",
      entity: "Product",
      entityId: product.id,
    });
    return ok({ id: product.id, isPublished: product.isPublished });
  } catch (error) {
    return toResult(error);
  }
}
