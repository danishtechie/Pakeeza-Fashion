"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Plus, Star } from "lucide-react";
import { formatPaise, effectivePrice, discountPercent } from "@/lib/money";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { toast } from "@/components/ui/toaster";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  inStock: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  rating?: number;
  reviewCount?: number;
  firstVariantId?: string;
}

function badgeFor(p: ProductCardData): { label: string; className: string } | null {
  if (p.isBestseller) return { label: "Bestseller", className: "bg-gold text-charcoal" };
  if (p.isTrending) return { label: "Trending", className: "bg-burgundy text-ivory" };
  if (p.isNewArrival) return { label: "New", className: "bg-forest text-ivory" };
  return null;
}

export function ProductCard({ product, index = 0 }: { product: ProductCardData; index?: number }) {
  const addLine = useCartStore((s) => s.addLine);
  const { has, toggle } = useWishlistStore();
  const badge = badgeFor(product);
  const eff = effectivePrice(product.price, product.salePrice);
  const discount = discountPercent(product.price, product.salePrice);
  const wished = has(product.id);

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!product.inStock) return;
    addLine({
      productId: product.id,
      variantId: product.firstVariantId ?? product.id,
      slug: product.slug,
      name: product.name,
      size: null,
      color: null,
      unitPrice: eff,
      image: product.thumbnail,
      quantity: 1,
      maxStock: 99,
    });
    toast("Added to your bag", "success");
  }

  // NOTE: previously used framer-motion's whileInView pattern
  // (initial opacity:0, animated on scroll-into-view). That depends on
  // React hydrating and an IntersectionObserver firing — if either is
  // delayed or interrupted, the card is stuck invisible forever, which is
  // exactly what was happening. Pure CSS animation (globals.css
  // `animate-fade-up`, with a `forwards` fill-mode) runs the instant the
  // browser paints the element, needs no JS, and always ends at opacity:1.
  return (
    <div
      className="animate-fade-up group relative"
      style={{ animationDelay: `${Math.min(index, 6) * 0.05}s` }}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] border border-black/5 bg-[#f7f3ee] shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-shadow duration-500 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-105"
          />
          {badge && (
            <span className={`absolute left-3 top-3 rounded-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${badge.className}`}>
              {badge.label}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute right-3 top-3 rounded-sm bg-[#111111]/90 px-2.5 py-1 text-[10px] font-semibold text-[#F7C767]">
              -{discount}%
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
              toast(wished ? "Removed from wishlist" : "Added to wishlist", "success");
            }}
            aria-label="Toggle wishlist"
            className="absolute bottom-3 right-3 rounded-full bg-ivory/90 p-2 opacity-0 shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Heart size={15} className={wished ? "fill-burgundy text-burgundy" : "text-charcoal"} />
          </button>

          {product.inStock ? (
            <button
              onClick={quickAdd}
              className="absolute inset-x-3 bottom-3 flex translate-y-10 items-center justify-center gap-1.5 rounded-full bg-[#111111] py-2.5 text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            >
              <Plus size={13} /> Quick Add
            </button>
          ) : (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-charcoal/70 py-2.5 text-center text-xs text-ivory">
              Out of Stock
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1.5">
          <h3 className="line-clamp-1 text-sm font-medium text-charcoal/90">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#111111]">{formatPaise(eff)}</span>
            {discount > 0 && (
              <span className="text-xs text-charcoal/40 line-through">{formatPaise(product.price)}</span>
            )}
          </div>
          {product.rating != null && product.reviewCount != null && product.reviewCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-charcoal/50">
              <Star size={11} className="fill-gold text-gold" />
              <span>{product.rating.toFixed(1)}</span>
              <span>({product.reviewCount})</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
