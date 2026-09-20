import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  storeName: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(200),
  whatsappNumber: z.string().trim().regex(/^\d{10,15}$/, "Digits only, with country code, e.g. 919999999999"),
  storePhone: z.string().trim().max(20).optional().or(z.literal("")),
  storeEmail: z.string().trim().email().optional().or(z.literal("")),
  storeAddress: z.string().trim().max(300).optional().or(z.literal("")),
  deliveryFee: z.coerce.number().int().min(0),
  freeDeliveryAbove: z.coerce.number().int().min(0).optional(),
  codEnabled: z.boolean(),
  codAdvancePercent: z.coerce.number().int().min(1).max(100),
  instagramUrl: z.string().trim().max(300).optional().or(z.literal("")),
  facebookUrl: z.string().trim().max(300).optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only a super admin can change store settings" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings", issues: parsed.error.flatten() }, { status: 400 });

  await db
    .update(settings)
    .set({
      ...parsed.data,
      storePhone: parsed.data.storePhone || null,
      storeEmail: parsed.data.storeEmail || null,
      storeAddress: parsed.data.storeAddress || null,
      freeDeliveryAbove: parsed.data.freeDeliveryAbove ?? null,
      instagramUrl: parsed.data.instagramUrl || null,
      facebookUrl: parsed.data.facebookUrl || null,
    })
    .where(eq(settings.id, "singleton"));

  await logAudit({ actorId: (session.user as { id?: string }).id ?? null, action: "SETTINGS_UPDATED", entity: "Settings", entityId: "singleton" });
  return NextResponse.json({ ok: true });
}
