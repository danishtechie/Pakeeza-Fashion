"use client";

import { useEffect, useState } from "react";
import { CartDrawer } from "./cart-drawer";

/**
 * Guards against SSR/client hydration mismatch for the persisted zustand
 * cart store (localStorage isn't available on the server) and hosts the
 * global cart drawer so it's reachable from anywhere in the tree.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {children}
      {mounted && <CartDrawer />}
    </>
  );
}
