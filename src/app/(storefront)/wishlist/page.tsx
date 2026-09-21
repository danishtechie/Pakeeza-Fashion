"use client";

import { useEffect, useState } from "react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const { productIds } = useWishlistStore();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      setLoaded(true);
      return;
    }
    fetch("/api/products/by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: productIds }),
    })
      .then((r) => r.json())
      .then((d) => setProducts(d.products))
      .finally(() => setLoaded(true));
  }, [productIds]);

  return (
    <div className="container-luxe py-10 sm:py-14">
      <p className="eyebrow">Saved</p>
      <h1 className="section-heading mt-2 mb-8 uppercase">Your Wishlist</h1>

      {loaded && products.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-charcoal/60">
          <Heart size={36} strokeWidth={1} />
          <p>You haven&apos;t saved anything yet.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
    </div>
  );
}
