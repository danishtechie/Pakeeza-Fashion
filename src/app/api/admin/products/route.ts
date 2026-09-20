import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { productInputSchema } from "@/lib/validation/product";
import { upsertProduct } from "@/server/admin-products";
import { logAudit } from "@/lib/audit";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.products.findMany({
    orderBy: [desc(products.createdAt)],
    with: { category: true, variants: true, images: true },
  });
  return NextResponse.json({ products: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product data", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const id = await upsertProduct(parsed.data);
    await logAudit({
      actorId: (session.user as { id?: string }).id ?? null,
      action: "PRODUCT_CREATED", entity: "Product", entityId: id,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    const isConflict = message.toLowerCase().includes("unique");
    return NextResponse.json(
      { error: isConflict ? "Slug, SKU, or a variant SKU is already in use" : "Failed to create product" },
      { status: isConflict ? 409 : 500 }
    );
  }
}
