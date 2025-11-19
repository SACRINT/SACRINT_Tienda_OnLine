// Zustand Store para Productos Vistos Recientemente
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentlyViewedItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  viewedAt: string;
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  addItem: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clear: () => void;
  getItems: (limit?: number) => RecentlyViewedItem[];
}

const MAX_ITEMS = 10;

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // Remove if already exists
          const filtered = state.items.filter(
            (i) => i.productId !== item.productId,
          );

          // Add to beginning with timestamp
          const newItems = [
            {
              ...item,
              viewedAt: new Date().toISOString(),
            },
            ...filtered,
          ].slice(0, MAX_ITEMS);

          return { items: newItems };
        }),

      clear: () => set({ items: [] }),

      getItems: (limit = MAX_ITEMS) => {
        const { items } = get();
        return items.slice(0, limit);
      },
    }),
    {
      name: "recently-viewed-storage",
      skipHydration: true,
    },
  ),
);
