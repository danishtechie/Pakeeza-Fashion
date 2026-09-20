import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const updateSchema = z.object({
  status: z.enum([
    "PENDING","WHATSAPP_CONTACTED","AWAITING_ADVANCE","ADVANCE_RECEIVED","CONFIRMED",
    "PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","RETURNED",
  ]).optional(),
  paymentStatus: z.enum(["UNPAID","ADVANCE_PENDING","ADVANCE_RECEIVED","FULLY_PAID","REFUNDED"]).optional(),
  adminNotes: z.string().max(2000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  // Defense in depth — middleware already gates /api/admin/*, but every
  // sensitive route re-checks the session itself.
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const [updated] = await db.update(orders).set(parsed.data).where(eq(orders.id, id)).returning();

  await logAudit({
    actorId: (session.user as { id?: string }).id ?? null,
    action: "ORDER_UPDATED",
    entity: "Order",
    entityId: id,
    metadata: { before: { status: existing.status, paymentStatus: existing.paymentStatus }, after: parsed.data },
  });

  return NextResponse.json({ order: updated });
}
