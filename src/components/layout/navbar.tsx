"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, ShoppingBag, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, cartCount } from "@/lib/cart-store";

const navLinks = [
  { href: "/shop?gender=WOMEN", label: "Women" },
  { href: "/shop?gender=MEN", label: "Men" },
  { href: "/shop?collection=Kashmiri", label: "Kashmiri Collection" },
  { href: "/shop?collection=Pakistani", label: "Pakistani Collection" },
  { href: "/shop?sort=newest", label: "New Arrivals" },
];

export function Navbar({ storeName }: { storeName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const count = useCartStore((s) => cartCount(s.lines));

  return (
    <header className="sticky top-0 z-30 border-b border-charcoal/10 bg-ivory/80 backdrop-blur-xl">
      <div className="container-luxe flex h-[4.5rem] items-center justify-between sm:h-20">
        <button
          className="p-2 lg:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="group flex items-center gap-3 font-display text-xl tracking-tight sm:text-2xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold text-xs font-semibold text-gold transition-transform duration-500 group-hover:rotate-12">P</span>
          <span>{storeName}</span>
        </Link>

        <nav className="hidden gap-8 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="luxe-link text-xs font-medium uppercase tracking-widest2 text-charcoal/75"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/shop" aria-label="Search products" className="rounded-full p-2 transition hover:bg-charcoal/5 hover:text-gold">
            <Search size={20} />
          </Link>
          <Link href="/wishlist" aria-label="Wishlist" className="hidden rounded-full p-2 transition hover:bg-charcoal/5 hover:text-gold sm:inline-flex">
            <Heart size={20} />
          </Link>
          <button aria-label="Open bag" onClick={openDrawer} className="relative rounded-full p-2 transition hover:bg-charcoal/5 hover:text-gold">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-[10px] text-ivory">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-charcoal/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28 }}
              className="fixed left-0 top-0 z-50 h-full w-80 bg-ivory p-6 shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="font-display text-xl tracking-tight">{storeName}</span>
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X size={22} />
                </button>
              </div>
              <nav className="flex flex-col gap-5">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="luxe-link text-base text-charcoal/85"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
