"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Share2, Minus, Plus, Star, Truck, ShieldCheck } from "lucide-react";
import { formatPaise, effectivePrice, discountPercent } from "@/lib/money";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { toast } from "@/components/ui/toaster";

interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
}

interface ProductForPanel {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  salePrice: number | null;
  description: string;
  fabric: string | null;
  careInstructions: string | null;
  variants: Variant[];
  thumbnail: string;
  avgRating: number | null;
  reviewCount: number;
}

export function ProductPurchasePanel({ product }: { product: ProductForPanel }) {
  const sizes = useMemo(
    () => [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[],
    [product.variants]
  );
  const colors = useMemo(
    () => [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[],
    [product.variants]
  );

  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [qty, setQty] = useState(1);
  const router = useRouter();

  const selectedVariant =
    product.variants.find((v) => v.size === size && v.color === color) ??
    product.variants.find((v) => (sizes.length ? v.size === size : true) && (colors.length ? v.color === color : true));

  const inStock = (selectedVariant?.stock ?? 0) > 0;
  const eff = effectivePrice(product.price, product.salePrice);
  const discount = discountPercent(product.price, product.salePrice);
  const addLine = useCartStore((s) => s.addLine);
  const { has, toggle } = useWishlistStore();
  const wished = has(product.id);

  function handleAddToCart(goToCheckout = false) {
    if (!selectedVariant) {
      toast("Please select a size / color", "error");
      return;
    }
    if (selectedVariant.stock < qty) {
      toast(`Only ${selectedVariant.stock} left in stock`, "error");
      return;
    }
    addLine({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      size: selectedVariant.size,
      color: selectedVariant.color,
      unitPrice: eff,
      image: product.thumbnail,
      quantity: qty,
      maxStock: selectedVariant.stock,
    });
    toast(goToCheckout ? "Redirecting to checkout" : "Added to your bag", "success");
    if (goToCheckout) router.push("/checkout");
  }

  return (
    <div>
      {product.brand && <p className="eyebrow mb-2">{product.brand}</p>}
      <h1 className="font-display text-3xl sm:text-4xl">{product.name}</h1>

      {product.avgRating != null && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-charcoal/60">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className={i < Math.round(product.avgRating!) ? "fill-gold text-gold" : "text-charcoal/20"} />
            ))}
          </div>
          <span>{product.avgRating.toFixed(1)} ({product.reviewCount} reviews)</span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <span className="text-2xl font-medium">{formatPaise(eff)}</span>
        {discount > 0 && (
          <>
            <span className="text-charcoal/40 line-through">{formatPaise(product.price)}</span>
            <span className="rounded-full bg-burgundy/10 px-2 py-1 text-xs text-burgundy">-{discount}%</span>
          </>
        )}
      </div>

      {product.fabric && <p className="mt-4 text-sm text-charcoal/60">Fabric: {product.fabric}</p>}
      <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{product.description}</p>

      {sizes.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest2 text-charcoal/50">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  size === s ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/20 hover:border-charcoal"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest2 text-charcoal/50">Color</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  color === c ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/20 hover:border-charcoal"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        <p className="mr-2 text-xs font-medium uppercase tracking-widest2 text-charcoal/50">Qty</p>
        <div className="flex items-center gap-3 rounded-full border border-charcoal/20 px-3 py-1.5">
          <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
            <Minus size={14} />
          </button>
          <span className="w-5 text-center tabular-nums">{qty}</span>
          <button
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(q + 1, selectedVariant?.stock ?? 1))}
            disabled={!inStock || qty >= (selectedVariant?.stock ?? 1)}
          >
            <Plus size={14} />
          </button>
        </div>
        {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
          <span className="text-xs text-burgundy">Only {selectedVariant.stock} left</span>
        )}
        {!inStock && <span className="text-xs text-charcoal/50">Out of stock</span>}
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => handleAddToCart(false)}
          disabled={!inStock}
          className="flex-1 rounded-full border border-charcoal py-3.5 text-sm transition hover:bg-charcoal hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to Cart
        </button>
        <button
          onClick={() => handleAddToCart(true)}
          disabled={!inStock}
          className="flex-1 rounded-full bg-charcoal py-3.5 text-sm text-ivory transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy Now
        </button>
        <button
          onClick={() => {
            toggle(product.id);
            toast(wished ? "Removed from wishlist" : "Added to wishlist", "success");
          }}
          aria-label="Toggle wishlist"
          className="flex items-center justify-center rounded-full border border-charcoal/20 p-3.5 hover:border-charcoal"
        >
          <Heart size={18} className={wished ? "fill-burgundy text-burgundy" : ""} />
        </button>
        <button
          onClick={async () => {
            const url = typeof window !== "undefined" ? window.location.href : "";
            if (navigator.share) {
              await navigator.share({ title: product.name, url }).catch(() => {});
            } else {
              await navigator.clipboard.writeText(url);
              toast("Link copied", "success");
            }
          }}
          aria-label="Share product"
          className="flex items-center justify-center rounded-full border border-charcoal/20 p-3.5 hover:border-charcoal"
        >
          <Share2 size={18} />
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-2 border-t border-charcoal/10 pt-6 text-xs text-charcoal/60">
        <div className="flex items-center gap-2"><Truck size={14} /> Delivered across India, Cash on Delivery available</div>
        <div className="flex items-center gap-2"><ShieldCheck size={14} /> Order confirmed personally over WhatsApp</div>
      </div>

      {product.careInstructions && (
        <details className="mt-6 border-t border-charcoal/10 pt-4 text-sm">
          <summary className="cursor-pointer font-medium">Care Instructions</summary>
          <p className="mt-2 text-charcoal/65">{product.careInstructions}</p>
        </details>
      )}
    </div>
  );
}
