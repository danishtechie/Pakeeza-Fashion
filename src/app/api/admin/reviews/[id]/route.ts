import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  isApproved: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  await db.update(reviews).set(parsed.data).where(eq(reviews.id, id));
  await logAudit({ actorId: (session.user as { id?: string }).id ?? null, action: "REVIEW_MODERATED", entity: "Review", entityId: id, metadata: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(reviews).where(eq(reviews.id, id));
  await logAudit({ actorId: (session.user as { id?: string }).id ?? null, action: "REVIEW_DELETED", entity: "Review", entityId: id });
  return NextResponse.json({ ok: true });
}
