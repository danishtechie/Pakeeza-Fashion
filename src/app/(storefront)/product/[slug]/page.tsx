import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/server/catalog";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductCard } from "@/components/product/product-card";
import { ReviewsSection } from "@/components/product/reviews-section";
import { effectivePrice } from "@/lib/money";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seoTitle || product.name,
    description: product.seoDesc || product.shortDescription || undefined,
    openGraph: { images: product.images[0]?.url ? [product.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categoryId, 4);
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  const eff = effectivePrice(product.price, product.salePrice);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.images.map((i) => i.url),
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (eff / 100).toFixed(2),
      availability: product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(avgRating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: product.reviews.length,
          },
        }
      : {}),
  };

  return (
    <div className="container-luxe py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-charcoal/50" aria-label="Breadcrumb">
        <a href="/" className="hover:text-gold">Home</a> / <a href="/shop" className="hover:text-gold">Shop</a> /{" "}
        <a href={`/shop?category=${product.category.slug}`} className="hover:text-gold">{product.category.name}</a> /{" "}
        <span className="text-charcoal">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductPurchasePanel
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            price: product.price,
            salePrice: product.salePrice,
            description: product.description,
            fabric: product.fabric,
            careInstructions: product.careInstructions,
            variants: product.variants,
            thumbnail: product.images[0]?.url ?? "/placeholder-product.svg",
            avgRating,
            reviewCount: product.reviews.length,
          }}
        />
      </div>

      <ReviewsSection reviews={product.reviews} avgRating={avgRating} />

      {related.length > 0 && (
        <section className="mt-16 border-t border-charcoal/10 pt-12">
          <h2 className="section-heading mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={{ ...p, inStock: true }} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
