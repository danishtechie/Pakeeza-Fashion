import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { z } from "zod";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(req: Request) {
  const limit = rateLimit(`newsletter:${clientKey(req)}`, 5, 60_000);
  if (!limit.ok) return NextResponse.redirect(new URL("/?subscribed=0", req.url), 303);

  const contentType = req.headers.get("content-type") || "";
  let email: string | undefined;

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    email = body?.email;
  } else {
    const form = await req.formData();
    email = form.get("email")?.toString();
  }

  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/?subscribed=0", req.url), 303);
  }

  await db.insert(newsletterSubscribers).values({ email: parsed.data.email.toLowerCase() }).onConflictDoNothing();

  return NextResponse.redirect(new URL("/?subscribed=1", req.url), 303);
}
