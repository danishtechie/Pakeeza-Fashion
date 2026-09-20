import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  size: string | null;
  color: string | null;
  unitPrice: number; // paise, snapshot at add-time — re-verified server-side at checkout
  image: string;
  quantity: number;
  maxStock: number;
}

interface CartState {
  lines: CartLine[];
  isDrawerOpen: boolean;
  addLine: (line: CartLine) => void;
  removeLine: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isDrawerOpen: false,
      addLine: (line) => {
        const existing = get().lines.find((l) => l.variantId === line.variantId);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.variantId === line.variantId
                ? { ...l, quantity: Math.min(l.quantity + line.quantity, l.maxStock) }
                : l
            ),
          });
        } else {
          set({ lines: [...get().lines, line] });
        }
        set({ isDrawerOpen: true });
      },
      removeLine: (variantId) => set({ lines: get().lines.filter((l) => l.variantId !== variantId) }),
      setQuantity: (variantId, quantity) =>
        set({
          lines: get().lines.map((l) =>
            l.variantId === variantId ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxStock)) } : l
          ),
        }),
      clear: () => set({ lines: [] }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    { name: "pakeeza-cart" }
  )
);

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
