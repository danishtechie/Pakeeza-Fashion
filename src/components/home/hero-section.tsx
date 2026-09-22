"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { effectivePrice, formatPaise } from "@/lib/money";

// NOTE: This was originally animated with framer-motion's initial-opacity-0
// + animate-to-1 pattern. In practice that left the whole hero permanently
// invisible for some users — if client JS hydration is even slightly
// delayed or interrupted, an element that starts at opacity:0 and depends
// on React running to reach opacity:1 can get stuck invisible forever.
// Real content should never be hidden behind a JS-dependent animation.
// This uses the pure-CSS `animate-fade-up` keyframe (globals.css) instead:
// it runs the moment the browser paints the element, needs no JS at all,
// and its `forwards` fill-mode guarantees it ends at opacity:1 and stays
// there — so the hero is visible immediately even before hydration, and
// still gets the same subtle entrance motion.
//
// The background is a CSS gradient rather than a hotlinked photo — the
// original build referenced Unsplash photo IDs that were never actually
// verified as live (the build sandbox couldn't reach images.unsplash.com
// to check), and one of them was dead. A gradient can't 404.
type HeroProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
};

export function HeroSection({ products = [], storeName = "Zenvy" }: { products?: HeroProduct[]; storeName?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselProducts = products.length > 0 ? products : [{
    id: "fallback",
    slug: "",
    name: "Signature Fashion Edit",
    price: 280000,
    salePrice: null,
    thumbnail: "/seed/product-premium-womens-suit-1.png",
  }];
  const activeProduct = carouselProducts[activeIndex % carouselProducts.length]!;

  useEffect(() => {
    if (carouselProducts.length < 2 || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % carouselProducts.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [carouselProducts.length, isPaused]);

  function selectProduct(index: number) {
    setActiveIndex(index);
  }

  return (
    <section className="relative overflow-hidden bg-[#111111] text-ivory">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 20%, rgba(240,179,58,0.28) 0%, rgba(240,179,58,0) 18%), radial-gradient(circle at 15% 85%, rgba(183,29,42,0.3) 0%, rgba(183,29,42,0) 32%), linear-gradient(120deg, #0b0b0b 0%, #191919 52%, #1f1a18 100%)",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="container-luxe relative z-10 grid min-h-[82vh] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-xl animate-fade-up">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F7C767]">
            Premium fashion essentials
          </p>
          <h1 className="text-5xl leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            {storeName}
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/75 sm:text-base">
            Look polished, stay confident, and shop elevated essentials designed for everyday wear, special moments, and effortless statement style.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="rounded-full bg-[#F7C767] px-6 py-3 text-sm font-semibold text-[#111111] transition hover:-translate-y-0.5 hover:bg-[#ffd77d]">
              Shop Now
            </Link>
            <Link href="/shop" className="rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/10">
              View Collection
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.2em] text-white/70">
            <span>Casual</span>
            <span>•</span>
            <span>Elegant</span>
            <span>•</span>
            <span>Luxury</span>
            <span>•</span>
            <span>Everyday</span>
          </div>
        </div>

        <div
          className="relative animate-fade-up"
          style={{ animationDelay: "0.15s" }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div className="absolute -left-8 top-10 h-28 w-28 rounded-full border border-[#F7C767]/40" />
          <div className="absolute -right-6 bottom-10 h-32 w-32 rounded-full border border-white/20" />

          <div className="relative mx-auto max-w-[460px] rounded-[28px] border border-white/10 bg-black/25 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-sm">
            <div className="rounded-[22px] border border-[#F7C767]/15 bg-[linear-gradient(135deg,#161616,#2c2c2c_40%,#111111)] p-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/60">
                <span>Fashion</span>
                <span className="rounded-full border border-[#F7C767]/40 px-2 py-1 text-[#F7C767]">New</span>
              </div>

              <div className="mt-5 rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,#8a1f2e,#1f2124_52%,#111111)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#F7C767]">Curated style</span>
                  <span className="text-xl font-black text-white">✦</span>
                </div>
                <div className="relative h-[260px] overflow-hidden rounded-[16px] bg-[#292020] [perspective:900px]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeProduct.id}
                      initial={{ opacity: 0, rotateY: 75, x: 42, scale: 0.92 }}
                      animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
                      exit={{ opacity: 0, rotateY: -75, x: -42, scale: 0.92 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                    >
                      {activeProduct.slug ? (
                        <Link href={`/product/${activeProduct.slug}`} className="absolute inset-0 block" aria-label={`View ${activeProduct.name}`}>
                          <Image src={activeProduct.thumbnail} alt={activeProduct.name} fill sizes="380px" className="object-cover object-center transition duration-700 hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
                          <div className="absolute bottom-8 left-8 right-8 rounded-[18px] border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[10px] uppercase tracking-[0.2em] text-white/65">Featured</span>
                              <span className="text-2xl font-black text-[#F7C767]">{formatPaise(effectivePrice(activeProduct.price, activeProduct.salePrice))}</span>
                            </div>
                            <p className="mt-2 line-clamp-1 text-sm font-medium text-white">{activeProduct.name}</p>
                          </div>
                        </Link>
                      ) : (
                        <>
                          <Image src={activeProduct.thumbnail} alt={activeProduct.name} fill sizes="380px" className="object-cover object-center" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
                          <div className="absolute bottom-8 left-8 right-8 rounded-[18px] border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[10px] uppercase tracking-[0.2em] text-white/65">Featured</span>
                              <span className="text-2xl font-black text-[#F7C767]">{formatPaise(effectivePrice(activeProduct.price, activeProduct.salePrice))}</span>
                            </div>
                            <p className="mt-2 line-clamp-1 text-sm font-medium text-white">{activeProduct.name}</p>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {carouselProducts.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Featured products">
                    {carouselProducts.map((carouselProduct, index) => (
                      <button
                        key={carouselProduct.id}
                        type="button"
                        role="tab"
                        aria-selected={index === activeIndex}
                        aria-label={`Show ${carouselProduct.name}`}
                        onClick={() => selectProduct(index)}
                        className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-7 bg-[#F7C767]" : "w-1.5 bg-white/35 hover:bg-white/70"}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-[10px] uppercase tracking-[0.18em] text-white/70">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-lg font-black text-[#F7C767]">200+</div>
                  <div className="mt-1">Looks</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-lg font-black text-[#F7C767]">COD</div>
                  <div className="mt-1">Avail</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-lg font-black text-[#F7C767]">24/7</div>
                  <div className="mt-1">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
