import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  isEnabled: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const [created] = await db
      .insert(categories)
      .values({ ...parsed.data, description: parsed.data.description || null, imageUrl: parsed.data.imageUrl || null, parentId: parsed.data.parentId || null })
      .returning();
    await logAudit({ actorId: (session.user as { id?: string }).id ?? null, action: "CATEGORY_CREATED", entity: "Category", entityId: created!.id });
    return NextResponse.json({ category: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }
}
