import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  productIds: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      has: (id) => get().productIds.includes(id),
      toggle: (id) =>
        set({
          productIds: get().productIds.includes(id)
            ? get().productIds.filter((p) => p !== id)
            : [...get().productIds, id],
        }),
    }),
    { name: "pakeeza-wishlist" }
  )
);
