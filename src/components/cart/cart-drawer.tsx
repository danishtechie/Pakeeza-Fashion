"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore, cartSubtotal, cartCount } from "@/lib/cart-store";
import { formatPaise } from "@/lib/money";

export function CartDrawer() {
  const { lines, isDrawerOpen, closeDrawer, removeLine, setQuantity } = useCartStore();
  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-charcoal/50 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl"
            role="dialog"
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-5">
              <h2 className="font-display text-2xl">Your Bag ({count})</h2>
              <button
                onClick={closeDrawer}
                aria-label="Close bag"
                className="rounded-full p-2 hover:bg-charcoal/5"
              >
                <X size={20} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-charcoal/60">
                <ShoppingBag size={40} strokeWidth={1} />
                <p>Your bag is empty.</p>
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="mt-2 rounded-full bg-charcoal px-6 py-2.5 text-sm text-ivory transition hover:bg-forest"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <ul className="flex flex-col gap-5">
                    {lines.map((line) => (
                      <li key={line.variantId} className="flex gap-4">
                        <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-cream">
                          <Image src={line.image} alt={line.name} fill className="object-cover" sizes="80px" />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link
                              href={`/product/${line.slug}`}
                              onClick={closeDrawer}
                              className="line-clamp-1 font-medium hover:underline"
                            >
                              {line.name}
                            </Link>
                            <p className="text-xs text-charcoal/60">
                              {[line.size, line.color].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-full border border-charcoal/15 px-2 py-1">
                              <button
                                aria-label="Decrease quantity"
                                onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                                className="rounded-full p-0.5 hover:bg-charcoal/5 disabled:opacity-30"
                                disabled={line.quantity <= 1}
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-5 text-center text-sm tabular-nums">{line.quantity}</span>
                              <button
                                aria-label="Increase quantity"
                                onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                                className="rounded-full p-0.5 hover:bg-charcoal/5 disabled:opacity-30"
                                disabled={line.quantity >= line.maxStock}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <span className="text-sm font-medium">{formatPaise(line.unitPrice * line.quantity)}</span>
                          </div>
                        </div>
                        <button
                          aria-label={`Remove ${line.name} from bag`}
                          onClick={() => removeLine(line.variantId)}
                          className="self-start p-1 text-charcoal/40 hover:text-burgundy"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-charcoal/10 px-6 py-5">
                  <div className="mb-4 flex items-center justify-between text-sm text-charcoal/70">
                    <span>Subtotal</span>
                    <span className="font-medium text-charcoal">{formatPaise(subtotal)}</span>
                  </div>
                  <p className="mb-4 text-xs text-charcoal/50">
                    Delivery charges & COD advance are calculated at checkout.
                  </p>
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="block w-full rounded-full bg-charcoal py-3.5 text-center text-sm tracking-wide text-ivory transition hover:bg-forest"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
