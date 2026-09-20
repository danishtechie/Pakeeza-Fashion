import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.sortOrder)] }),
    db.query.products.findFirst({ where: eq(products.id, id), with: { images: true, variants: true } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Edit Product</h1>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name, brand: product.brand ?? "", slug: product.slug, description: product.description,
          shortDescription: product.shortDescription ?? "", sku: product.sku, gender: product.gender,
          collection: product.collection ?? "", fabric: product.fabric ?? "", careInstructions: product.careInstructions ?? "",
          price: product.price, salePrice: product.salePrice, categoryId: product.categoryId,
          tags: product.tags ?? "", seoTitle: product.seoTitle ?? "", seoDesc: product.seoDesc ?? "",
          isFeatured: product.isFeatured, isTrending: product.isTrending, isBestseller: product.isBestseller,
          isNewArrival: product.isNewArrival, isPublished: product.isPublished,
          images: product.images.sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({ url: i.url, altText: i.altText })),
          variants: product.variants.map((v) => ({ id: v.id, size: v.size ?? "", color: v.color ?? "", sku: v.sku, stock: v.stock, lowStockThreshold: v.lowStockThreshold })),
        }}
      />
    </div>
  );
}
