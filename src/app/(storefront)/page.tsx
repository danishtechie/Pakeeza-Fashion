import Link from "next/link";
import Image from "next/image";
import { getFeaturedSections, listCategories, listFeaturedReviews } from "@/server/catalog";
import { ProductCard } from "@/components/product/product-card";
import { HeroSection } from "@/components/home/hero-section";
import { getSettings } from "@/lib/settings";
import { Star, Sparkles, ShieldCheck, MessageCircle, Truck, Gem } from "lucide-react";

export const revalidate = 60;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ subscribed?: string }> }) {
  const { subscribed } = await searchParams;
  const [{ featured, trending, newArrivals, kashmiri, pakistani }, categories, testimonials, settings] =
    await Promise.all([getFeaturedSections(), listCategories(), listFeaturedReviews(), getSettings().catch(() => null)]);

  return (
    <div>
      {subscribed === "1" && (
        <div className="bg-forest py-2.5 text-center text-xs text-ivory">
          Thanks for subscribing — you&apos;ll hear from us about new collections soon.
        </div>
      )}
      {subscribed === "0" && (
        <div className="bg-burgundy py-2.5 text-center text-xs text-ivory">
          Please enter a valid email address to subscribe.
        </div>
      )}
      <HeroSection product={featured[0]} storeName={settings?.storeName ?? "Pakeeza Fashion"} />

      {/* Featured Categories */}
      <section className="container-luxe py-16 sm:py-24">
        <div className="mb-10 text-center">
          <p className="eyebrow">Shop by Category</p>
          <h2 className="section-heading mt-2">Curated Fashion Collections</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-[#141414]"
            >
              <Image
                src={c.imageUrl || "/placeholder-product.svg"}
                alt={c.name}
                fill
                sizes="200px"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b]/85 via-[#0b0b0b]/15 to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 text-sm font-semibold uppercase tracking-[0.18em] text-ivory/95">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      {trending.length > 0 && (
        <section className="bg-[#111111] py-10 text-white sm:py-16">
          <div className="container-luxe">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="eyebrow text-[#F7C767]">Featured Products</p>
                <h2 className="section-heading mt-2 text-white">Handpicked premium fashion essentials</h2>
              </div>
              <Link href="/shop?sort=trending" className="hidden text-sm text-[#F7C767] hover:underline sm:inline">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {trending.map((p, i) => (
                <ProductCard key={p.id} product={{ ...p, reviewCount: 0, rating: 5 }} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="bg-[#f5f1ea] py-10 sm:py-16">
          <div className="container-luxe">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="eyebrow text-[#B71D2A]">Just Landed</p>
                <h2 className="section-heading mt-2">New Arrivals</h2>
              </div>
              <Link href="/shop?sort=newest" className="hidden text-sm text-[#B71D2A] hover:underline sm:inline">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {newArrivals.map((p, i) => (
                <ProductCard key={p.id} product={{ ...p, reviewCount: 0, rating: 5 }} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Kashmiri Collection Editorial */}
      {kashmiri.length > 0 && (
        <EditorialSection
          eyebrow="Heritage Craft"
          title="The Kashmiri Collection"
          copy="Hand-embroidered Pherans, Pashmina shawls and Tilla-work kurtas — carrying the valley's centuries-old craft into modern everyday wear."
          href="/shop?collection=Kashmiri"
          products={kashmiri}
          reverse={false}
        />
      )}

      {/* Pakistani Collection Editorial */}
      {pakistani.length > 0 && (
        <EditorialSection
          eyebrow="Contemporary Elegance"
          title="The Pakistani Collection"
          copy="Lawn suits, chiffon ensembles and festive embroidery — designed for effortless elegance, from daily wear to the grandest occasion."
          href="/shop?collection=Pakistani"
          products={pakistani}
          reverse
        />
      )}

      {/* Why Fashion */}
      <section className="bg-[#101010] py-16 text-ivory sm:py-20">
        <div className="container-luxe">
          <div className="mb-12 text-center">
            <p className="eyebrow text-[#F7C767]">Our Promise</p>
            <h2 className="section-heading mt-2 text-ivory">Why Fashion</h2>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: Gem, label: "Curated Style" },
              { icon: Sparkles, label: "Premium Fabrics" },
              { icon: ShieldCheck, label: "Authentic Looks" },
              { icon: ShieldCheck, label: "Secure Ordering" },
              { icon: MessageCircle, label: "WhatsApp Support" },
              { icon: Truck, label: "COD Available" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3 text-center">
                <Icon size={26} className="text-[#F7C767]" strokeWidth={1.4} />
                <span className="text-xs tracking-[0.14em] text-ivory/80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      {testimonials.length > 0 && (
        <section className="container-luxe py-16 sm:py-24">
          <div className="mb-10 text-center">
            <p className="eyebrow">Loved By Customers</p>
            <h2 className="section-heading mt-2">What They&apos;re Saying</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((r) => (
              <div key={r.id} className="rounded-xl border border-charcoal/10 bg-cream/40 p-6">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < r.rating ? "fill-gold text-gold" : "text-charcoal/20"} />
                  ))}
                </div>
                {r.title && <p className="mb-1 font-medium">{r.title}</p>}
                <p className="text-sm text-charcoal/70">{r.body}</p>
                <p className="mt-4 text-xs text-charcoal/50">
                  {r.customerName}
                  {r.isVerifiedPurchase && " · Verified Purchase"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="border-t border-charcoal/10 bg-cream/50 py-14">
        <div className="container-luxe max-w-xl text-center">
          <h3 className="section-heading">Stay In Style</h3>
          <p className="mt-2 text-sm text-charcoal/60">
            Be the first to know about new collections and festive drops.
          </p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            action="/api/newsletter"
            method="post"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Your email address"
              className="flex-1 rounded-full border border-charcoal/20 bg-ivory px-5 py-3 text-sm outline-none focus:border-gold"
            />
            <button className="rounded-full bg-charcoal px-6 py-3 text-sm text-ivory transition hover:bg-forest">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function EditorialSection({
  eyebrow,
  title,
  copy,
  href,
  products,
  reverse,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  products: { id: string; slug: string; name: string; price: number; salePrice: number | null; thumbnail: string; inStock: boolean }[];
  reverse: boolean;
}) {
  return (
    <section className="container-luxe py-10 sm:py-16">
      <div className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[&>div:first-child]:order-2" : ""}`}>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="section-heading mt-2">{title}</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-charcoal/65">{copy}</p>
          <Link
            href={href}
            className="mt-6 inline-block rounded-full border border-charcoal px-6 py-2.5 text-sm transition hover:bg-charcoal hover:text-ivory"
          >
            Explore Collection
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {products.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
