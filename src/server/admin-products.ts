import { db } from "@/db/client";
import { orderItems, products, productImages, productVariants } from "@/db/schema";
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

    const existingVariants = existingId
      ? await tx.select().from(productVariants).where(eq(productVariants.productId, productId!))
      : [];
    const submittedVariantIds = new Set(input.variants.map((variant) => variant.id).filter(Boolean));

    for (const variant of existingVariants) {
      if (!submittedVariantIds.has(variant.id)) {
        const referenced = await tx.select({ id: orderItems.id }).from(orderItems)
          .where(eq(orderItems.variantId, variant.id)).limit(1);
        if (referenced.length === 0) {
          await tx.delete(productVariants).where(eq(productVariants.id, variant.id));
        }
      }
    }

    for (const v of input.variants) {
      const values = {
        productId: productId!, size: v.size || null, color: v.color || null,
        sku: v.sku, stock: v.stock, lowStockThreshold: v.lowStockThreshold,
      };
      if (v.id && existingVariants.some((variant) => variant.id === v.id)) {
        await tx.update(productVariants).set(values).where(eq(productVariants.id, v.id));
      } else {
        await tx.insert(productVariants).values(values);
      }
    }

    return productId!;
  });
}
