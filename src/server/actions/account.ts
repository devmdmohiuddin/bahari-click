"use server";

import { ok, toResult, type Result } from "@/lib/result";
import { requireUser } from "@/server/auth-session";
import { getCustomerOrderDetail, getCustomerOrders } from "@/server/services/account";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/server/services/address";
import {
  addToWishlist,
  isWishlisted,
  listWishlist,
  removeFromWishlist,
} from "@/server/services/wishlist";
import { addressInputSchema, type AddressInput } from "@/server/validators/address";

// All actions are scoped to the signed-in customer (requireUser).

// ── Orders ───────────────────────────────────────────────────────────────────
export async function getMyOrdersAction(): Promise<
  Result<Awaited<ReturnType<typeof getCustomerOrders>>>
> {
  try {
    const session = await requireUser();
    return ok(await getCustomerOrders(session.user.id));
  } catch (error) {
    return toResult(error);
  }
}

export async function getMyOrderDetailAction(
  orderNumber: string,
): Promise<Result<Awaited<ReturnType<typeof getCustomerOrderDetail>>>> {
  try {
    const session = await requireUser();
    return ok(await getCustomerOrderDetail(session.user.id, orderNumber));
  } catch (error) {
    return toResult(error);
  }
}

// ── Addresses ────────────────────────────────────────────────────────────────
export async function listAddressesAction(): Promise<
  Result<Awaited<ReturnType<typeof listAddresses>>>
> {
  try {
    const session = await requireUser();
    return ok(await listAddresses(session.user.id));
  } catch (error) {
    return toResult(error);
  }
}

export async function addAddressAction(input: AddressInput): Promise<Result<{ id: string }>> {
  try {
    const session = await requireUser();
    const address = await createAddress(session.user.id, addressInputSchema.parse(input));
    return ok({ id: address.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function updateAddressAction(
  id: string,
  input: Partial<AddressInput>,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireUser();
    const address = await updateAddress(session.user.id, id, input);
    return ok({ id: address.id });
  } catch (error) {
    return toResult(error);
  }
}

export async function setDefaultAddressAction(id: string): Promise<Result<{ id: string }>> {
  try {
    const session = await requireUser();
    await setDefaultAddress(session.user.id, id);
    return ok({ id });
  } catch (error) {
    return toResult(error);
  }
}

export async function deleteAddressAction(id: string): Promise<Result<{ id: string }>> {
  try {
    const session = await requireUser();
    return ok(await deleteAddress(session.user.id, id));
  } catch (error) {
    return toResult(error);
  }
}

// ── Wishlist ─────────────────────────────────────────────────────────────────
export async function listWishlistAction(): Promise<
  Result<Awaited<ReturnType<typeof listWishlist>>>
> {
  try {
    const session = await requireUser();
    return ok(await listWishlist(session.user.id));
  } catch (error) {
    return toResult(error);
  }
}

export async function toggleWishlistAction(
  productId: string,
): Promise<Result<{ productId: string; wishlisted: boolean }>> {
  try {
    const session = await requireUser();
    const already = await isWishlisted(session.user.id, productId);
    const result = already
      ? await removeFromWishlist(session.user.id, productId)
      : await addToWishlist(session.user.id, productId);
    return ok(result);
  } catch (error) {
    return toResult(error);
  }
}
