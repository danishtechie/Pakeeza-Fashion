import { db } from "@/db/client";
import { products, productImages, productVariants, categories, reviews } from "@/db/schema";
import { and, eq, desc, asc, sql, gte, lte, inArray, like, or } from "drizzle-orm";

export interface ProductListFilters {
  categorySlug?: string;
  collection?: string;
  gender?: "WOMEN" | "MEN" | "UNISEX";
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular" | "trending" | "rating";
  page?: number;
  pageSize?: number;
}

/** Product + first image + variant/stock rollup, for grid/list views. */
export async function listProducts(filters: ProductListFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;

  const conditions = [eq(products.isPublished, true)];
  if (filters.gender) conditions.push(eq(products.gender, filters.gender));
  if (filters.collection) conditions.push(eq(products.collection, filters.collection));
  if (filters.search) {
    conditions.push(
      or(
        like(products.name, `%${filters.search}%`),
        like(products.brand, `%${filters.search}%`),
        like(products.tags, `%${filters.search}%`),
      )!
    );
  }
  if (filters.minPrice != null) conditions.push(gte(products.price, filters.minPrice));
  if (filters.maxPrice != null) conditions.push(lte(products.price, filters.maxPrice));

  let categoryId: string | undefined;
  if (filters.categorySlug) {
    const cat = await db.query.categories.findFirst({ where: eq(categories.slug, filters.categorySlug) });
    categoryId = cat?.id;
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  }

  const orderBy =
    filters.sort === "price_asc"
      ? [asc(products.price)]
      : filters.sort === "price_desc"
      ? [desc(products.price)]
      : filters.sort === "trending"
      ? [desc(products.isTrending), desc(products.createdAt)]
      : filters.sort === "popular"
      ? [desc(products.isBestseller), desc(products.createdAt)]
      : [desc(products.createdAt)];

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(...conditions));
  const total = totalRow[0]?.count ?? 0;

  const productIds = rows.map((p) => p.id);
  const images = productIds.length
    ? await db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
    : [];
  const variants = productIds.length
    ? await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds))
    : [];

  const withMeta = rows.map((p) => {
    const productImgs = images.filter((i) => i.productId === p.id).sort((a, b) => a.sortOrder - b.sortOrder);
    const productVariantsForP = variants.filter((v) => v.productId === p.id);
    const totalStock = productVariantsForP.reduce((s, v) => s + v.stock, 0);
    const firstInStockVariant = productVariantsForP.find((v) => v.stock > 0) ?? productVariantsForP[0];
    return {
      ...p,
      thumbnail: productImgs[0]?.url ?? "/placeholder-product.svg",
      inStock: totalStock > 0,
      sizes: [...new Set(productVariantsForP.map((v) => v.size).filter(Boolean))],
      firstVariantId: firstInStockVariant?.id,
    };
  });

  return { items: withMeta, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isPublished, true)),
    with: {
      category: true,
      images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] },
      variants: true,
      reviews: { where: eq(reviews.isApproved, true), orderBy: (r, { desc }) => [desc(r.createdAt)] },
    },
  });
  return product ?? null;
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.isPublished, true), sql`${products.id} != ${productId}`))
    .limit(limit);
  const productIds = rows.map((p) => p.id);
  const images = productIds.length
    ? await db.select().from(productImages).where(inArray(productImages.productId, productIds))
    : [];
  return rows.map((p) => ({
    ...p,
    thumbnail: images.find((i) => i.productId === p.id)?.url ?? "/placeholder-product.svg",
  }));
}

export async function getFeaturedSections() {
  const [featured, trending, newArrivals, kashmiri, pakistani] = await Promise.all([
    listProducts({ sort: "newest", pageSize: 8 }).then((r) => r.items.filter((p) => p.isFeatured)),
    listProducts({ sort: "trending", pageSize: 8 }),
    listProducts({ sort: "newest", pageSize: 8 }).then((r) => r.items.filter((p) => p.isNewArrival)),
    listProducts({ collection: "Kashmiri", pageSize: 6 }),
    listProducts({ collection: "Pakistani", pageSize: 6 }),
  ]);
  return { featured, trending: trending.items, newArrivals, kashmiri: kashmiri.items, pakistani: pakistani.items };
}

export async function listCategories() {
  return db.query.categories.findMany({
    where: eq(categories.isEnabled, true),
    orderBy: (c, { asc }) => [asc(c.sortOrder)],
  });
}

export async function listFeaturedReviews(limit = 6) {
  return db.query.reviews.findMany({
    where: eq(reviews.isApproved, true),
    orderBy: (r, { desc }) => [desc(r.isFeatured), desc(r.createdAt)],
    limit,
    with: { product: true },
  });
}
