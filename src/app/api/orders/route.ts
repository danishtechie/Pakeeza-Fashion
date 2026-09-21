import { NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/validation/checkout";
import { createOrder, OrderError } from "@/server/orders";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { getCustomerSessionFromRequest } from "@/lib/customer-session";

export async function POST(req: Request) {
  const key = `create-order:${clientKey(req)}`;
  const limit = rateLimit(key, 8, 60_000); // 8 orders per minute per IP
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const customerSession = getCustomerSessionFromRequest(req);
  if (!customerSession) {
    return NextResponse.json({ error: "Please sign in before completing checkout." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { order, whatsappMessage, whatsappNumber } = await createOrder(parsed.data);
    return NextResponse.json({
      orderNumber: order.orderNumber,
      total: order.total,
      whatsappMessage,
      whatsappUrl: buildWhatsappUrl(whatsappNumber, whatsappMessage),
    });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 409 });
    }
    // eslint-disable-next-line no-console
    console.error("Order creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong placing your order. Please try again." },
      { status: 500 }
    );
  }
}
