import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { productInputSchema } from "@/lib/validation/product";
import { upsertProduct } from "@/server/admin-products";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { images: true, variants: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product data", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await upsertProduct(parsed.data, id);
    await logAudit({
      actorId: (session.user as { id?: string }).id ?? null,
      action: "PRODUCT_UPDATED", entity: "Product", entityId: id,
    });
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update product";
    const isConflict = message.toLowerCase().includes("unique");
    return NextResponse.json(
      { error: isConflict ? "Slug, SKU, or a variant SKU is already in use" : "Failed to update product" },
      { status: isConflict ? 409 : 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.update(products).set({ isPublished: false }).where(eq(products.id, id));
  await logAudit({
    actorId: (session.user as { id?: string }).id ?? null,
    action: "PRODUCT_UNPUBLISHED", entity: "Product", entityId: id,
  });
  return NextResponse.json({ ok: true });
}
