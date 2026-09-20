import type { MetadataRoute } from "next";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { products, categories } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const [productRows, categoryRows] = await Promise.all([
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isPublished, true)),
    db.select({ slug: categories.slug }).from(categories).where(eq(categories.isEnabled, true)),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categoryRows.map((c) => ({ url: `${base}/shop?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...productRows.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
