import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  isEnabled: z.boolean().default(true),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data", issues: parsed.error.flatten() }, { status: 400 });

  await db.update(categories).set({ ...parsed.data, description: parsed.data.description || null, imageUrl: parsed.data.imageUrl || null }).where(eq(categories.id, id));
  await logAudit({ actorId: (session.user as { id?: string }).id ?? null, action: "CATEGORY_UPDATED", entity: "Category", entityId: id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await db.update(categories).set({ isEnabled: false }).where(eq(categories.id, id));
  await logAudit({ actorId: (session.user as { id?: string }).id ?? null, action: "CATEGORY_DISABLED", entity: "Category", entityId: id });
  return NextResponse.json({ ok: true });
}
