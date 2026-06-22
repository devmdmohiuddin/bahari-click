"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Recently-viewed products (client-only, localStorage). Lightweight shape so we
// don't need to refetch — just enough to render a compact card (S7).
export type RecentItem = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
};

const MAX = 12;

type RecentState = {
  items: RecentItem[];
  hydrated: boolean;
  record: (item: RecentItem) => void;
};

export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      record: (item) =>
        set((state) => ({
          items: [item, ...state.items.filter((i) => i.id !== item.id)].slice(0, MAX),
        })),
    }),
    {
      name: "bahari-recently-viewed",
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
