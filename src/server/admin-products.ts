import { db } from "@/db/client";
import { products, productImages, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ProductInput } from "@/lib/validation/product";

/**
 * Creates or fully replaces a product's images and variants inside a
 * transaction. Variant SKUs must stay globally unique (enforced by the DB
 * unique index) — callers see a clear error if they collide.
 */
export async function upsertProduct(input: ProductInput, existingId?: string) {
  return db.transaction(async (tx) => {
    const values = {
      name: input.name,
      brand: input.brand || null,
      slug: input.slug,
      description: input.description,
      shortDescription: input.shortDescription || null,
      sku: input.sku,
      gender: input.gender,
      collection: input.collection || null,
      fabric: input.fabric || null,
      careInstructions: input.careInstructions || null,
      price: input.price,
      salePrice: input.salePrice || null,
      categoryId: input.categoryId,
      tags: input.tags || null,
      seoTitle: input.seoTitle || null,
      seoDesc: input.seoDesc || null,
      isFeatured: input.isFeatured,
      isTrending: input.isTrending,
      isBestseller: input.isBestseller,
      isNewArrival: input.isNewArrival,
      isPublished: input.isPublished,
    };

    let productId = existingId;
    if (existingId) {
      await tx.update(products).set(values).where(eq(products.id, existingId));
    } else {
      const [created] = await tx.insert(products).values(values).returning();
      productId = created!.id;
    }

    // Replace images & variants wholesale — simplest correct approach at
    // this scale, and avoids diffing logic that could silently orphan rows.
    await tx.delete(productImages).where(eq(productImages.productId, productId!));
    for (const [idx, img] of input.images.entries()) {
      await tx.insert(productImages).values({
        productId: productId!,
        url: img.url,
        altText: img.altText || "",
        sortOrder: idx,
        isThumbnail: idx === 0,
      });
    }

    await tx.delete(productVariants).where(eq(productVariants.productId, productId!));
    for (const v of input.variants) {
      await tx.insert(productVariants).values({
        productId: productId!,
        size: v.size || null,
        color: v.color || null,
        sku: v.sku,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold,
      });
    }

    return productId!;
  });
}
