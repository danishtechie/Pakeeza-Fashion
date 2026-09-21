import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CUSTOMER_SESSION_COOKIE,
  getCustomerSessionFromRequest,
  signCustomerSession,
} from "@/lib/customer-session";

const customerSessionSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(8).max(20),
  email: z.string().trim().email(),
  password: z.string().min(6).max(120),
});

export async function GET(req: Request) {
  const session = getCustomerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, customer: session });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = customerSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid name, mobile, email and password" }, { status: 400 });
  }

  const sessionId = `customer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const safeCustomer = {
    id: sessionId,
    name: parsed.data.fullName,
    email: parsed.data.email.toLowerCase(),
    mobile: parsed.data.mobile,
  };

  const cookieValue = signCustomerSession(safeCustomer);
  const response = NextResponse.json({ authenticated: true, customer: safeCustomer });

  response.cookies.set(CUSTOMER_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}