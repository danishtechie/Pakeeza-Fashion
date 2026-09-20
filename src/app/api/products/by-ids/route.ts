import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { products, productImages, productVariants } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({ ids: z.array(z.string()).max(50) });

// Public, read-only endpoint — only returns published products, and only
// the fields the wishlist grid needs. No sensitive data exposed.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || parsed.data.ids.length === 0) return NextResponse.json({ products: [] });

  const rows = await db.select().from(products).where(and(inArray(products.id, parsed.data.ids), eq(products.isPublished, true)));
  const images = await db.select().from(productImages).where(inArray(productImages.productId, rows.map((r) => r.id)));
  const variants = await db.select().from(productVariants).where(inArray(productVariants.productId, rows.map((r) => r.id)));

  const result = rows.map((p) => {
    const stock = variants.filter((v) => v.productId === p.id).reduce((s, v) => s + v.stock, 0);
    return {
      id: p.id, slug: p.slug, name: p.name, price: p.price, salePrice: p.salePrice,
      thumbnail: images.find((i) => i.productId === p.id)?.url ?? "/placeholder-product.svg",
      inStock: stock > 0,
    };
  });
  return NextResponse.json({ products: result });
}
