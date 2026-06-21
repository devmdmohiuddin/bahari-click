"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Client-side cart. Display-only: prices/totals here are for UX; the server
// re-computes authoritative totals at checkout (docs/03-architecture.md). One
// line per product variant — variantId is the merge key.
export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  /** Human variant label, e.g. "Red · M". Empty for single-variant products. */
  variantLabel: string;
  /** Whole-taka unit price (Int) at the time it was added. */
  price: number;
  image: string | null;
  qty: number;
};

type CartState = {
  items: CartItem[];
  /** True once persisted state has rehydrated from localStorage (SSR-safe). */
  hydrated: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, qty }] };
        }),
      remove: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      setQty: (variantId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) => (i.variantId === variantId ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "bahari-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

// Selectors — subscribe to derived values so components re-render minimally.
export const useCartCount = () => useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));

export const useCartSubtotal = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.price * i.qty, 0));
